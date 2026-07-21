import "reflect-metadata";
import "dotenv/config";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import {
  CalendarEventInput,
  CalendarPort,
} from "../src/calendar/calendar.port";
import { calendarEventId } from "../src/calendar/event-id";

/**
 * End-to-end coverage for idempotent event ids (#47): the create-ok/persist-fail
 * window where a completion's event was already created in Google but its id was
 * never stored (row stuck PENDING, googleEventId null). A retry must NOT create a
 * second event.
 *
 * The fake models Google's client-set-id idempotency: it keys events by the
 * caller-supplied `eventId`. A repeat create for a known id records the call but
 * returns the existing id without minting a new event — so `effectiveCreates`
 * (distinct ids) counts real events, while `createCalls` counts attempts.
 */
const TAG = "e2e-cal-idem";

const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

class IdempotentFakeCalendarPort extends CalendarPort {
  connected = true;
  createCalls: Array<{ userId: string; input: CalendarEventInput }> = [];
  /** Distinct event ids that exist "in Google" — one per real event. */
  readonly events = new Set<string>();

  reset() {
    this.connected = true;
    this.createCalls = [];
    this.events.clear();
  }

  /** Number of real events created (distinct ids), ignoring idempotent repeats. */
  get effectiveCreates(): number {
    return this.events.size;
  }

  /** Pre-seed an event as if a prior attempt had already created it in Google. */
  preexisting(eventId: string) {
    this.events.add(eventId);
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  async createEvent(
    userId: string,
    input: CalendarEventInput,
  ): Promise<string> {
    this.createCalls.push({ userId, input });
    // create-or-get: inserting a known id is a no-op that returns the same id.
    this.events.add(input.eventId);
    return input.eventId;
  }

  async deleteEvent(): Promise<void> {
    // unused here
  }
}

describe("Calendar idempotency: deterministic event ids (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const calendar = new IdempotentFakeCalendarPort();

  const userIds: string[] = [];
  let token: string;
  let blockTypeId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(CalendarPort)
      .useValue(calendar)
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const stamp = Date.now();
    const user = await prisma.user.create({
      data: { email: `${TAG}-${stamp}@test.local`, name: "Idempotency User" },
    });
    userIds.push(user.id);

    const category = await prisma.category.create({
      data: {
        key: `${TAG}-cat-${stamp}`,
        name: "Study",
        weightPercent: 20,
        color: "#6366f1",
        userId: user.id,
      },
    });

    const blockType = await prisma.blockType.create({
      data: {
        name: "Deep Study",
        durationMinutes: 60,
        userId: user.id,
        categoryId: category.id,
      },
    });
    blockTypeId = blockType.id;

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    token = `${TAG}-token-${stamp}`;
    await prisma.session.create({
      data: { token, userId: user.id, expiresAt },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.blockInstance.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.blockType.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  beforeEach(async () => {
    calendar.reset();
    await prisma.blockInstance.deleteMany({ where: { userId: userIds[0] } });
  });

  const seedPending = () =>
    prisma.blockInstance.create({
      data: {
        userId: userIds[0],
        blockTypeId,
        points: 5,
        completedAt: new Date(),
        calendarSyncStatus: "PENDING",
        googleEventId: null,
      },
    });

  it("a retry after create-ok/persist-fail does not create a duplicate event", async () => {
    // The row is PENDING with no id, but its event was already created in a
    // prior attempt whose id-persist never committed.
    const row = await seedPending();
    const expectedId = calendarEventId(row.id);
    calendar.preexisting(expectedId);

    const res = await request(app.getHttpServer())
      .post("/api/v1/block-instances/sync")
      .set("Cookie", cookieFor(token))
      .expect(201);

    // The drain attempts a create, but it resolves to the SAME event — no dupe.
    expect(calendar.createCalls).toHaveLength(1);
    expect(calendar.effectiveCreates).toBe(1);

    // The row is now reconciled to SYNCED with the deterministic id.
    expect(res.body).toEqual({ synced: 1, pending: 0 });
    const stored = await prisma.blockInstance.findUnique({ where: { id: row.id } });
    expect(stored?.calendarSyncStatus).toBe("SYNCED");
    expect(stored?.googleEventId).toBe(expectedId);
  });

  it("syncing the same completion twice issues at most one effective create", async () => {
    const row = await seedPending();
    const expectedId = calendarEventId(row.id);

    // First sync creates the event and persists the id.
    await request(app.getHttpServer())
      .post("/api/v1/block-instances/sync")
      .set("Cookie", cookieFor(token))
      .expect(201);

    // Force a second attempt for the same completion by rolling it back to
    // PENDING/null — the create-ok/persist-fail state — then syncing again.
    await prisma.blockInstance.update({
      where: { id: row.id },
      data: { calendarSyncStatus: "PENDING", googleEventId: null },
    });

    await request(app.getHttpServer())
      .post("/api/v1/block-instances/sync")
      .set("Cookie", cookieFor(token))
      .expect(201);

    expect(calendar.effectiveCreates).toBe(1);
    const stored = await prisma.blockInstance.findUnique({ where: { id: row.id } });
    expect(stored?.googleEventId).toBe(expectedId);
  });
});
