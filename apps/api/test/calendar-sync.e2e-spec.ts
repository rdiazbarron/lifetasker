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

/**
 * End-to-end coverage for calendar sync on completion (#35), exercising the
 * real HTTP boundary with the Google port replaced by a fake so nothing touches
 * the network:
 *   1. a connected user's completion creates exactly one event and stores the
 *      returned id with status SYNCED
 *   2. a port failure still returns a successful completion (points intact) and
 *      leaves the row PENDING
 *   3. a not-connected user's completion makes no port calls and stays
 *      NOT_APPLICABLE
 *
 * Sessions are seeded directly into the shared Session table, as in the other
 * e2e specs; the auth guard resolves them exactly as for a real cookie.
 */
const TAG = "e2e-calendar";

const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

/** Records every call and can be toggled connected/failing per test. */
class FakeCalendarPort extends CalendarPort {
  connected = true;
  failCreate = false;
  createCalls: Array<{ userId: string; input: CalendarEventInput }> = [];
  deleteCalls: Array<{ userId: string; eventId: string }> = [];
  private counter = 0;

  reset() {
    this.connected = true;
    this.failCreate = false;
    this.createCalls = [];
    this.deleteCalls = [];
    this.counter = 0;
  }

  async isConnected(): Promise<boolean> {
    return this.connected;
  }

  async createEvent(
    userId: string,
    input: CalendarEventInput,
  ): Promise<string> {
    this.createCalls.push({ userId, input });
    if (this.failCreate) throw new Error("simulated Google failure");
    this.counter += 1;
    return `fake-event-${this.counter}`;
  }

  async deleteEvent(userId: string, eventId: string): Promise<void> {
    this.deleteCalls.push({ userId, eventId });
  }
}

describe("Calendar sync on completion (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const calendar = new FakeCalendarPort();

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
      data: { email: `${TAG}-${stamp}@test.local`, name: "Calendar User" },
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

  beforeEach(() => calendar.reset());

  it("syncs a connected user's completion as a single SYNCED event", async () => {
    const res = await request(app.getHttpServer())
      .post("/api/v1/block-instances/complete")
      .set("Cookie", cookieFor(token))
      .send({ blockTypeId })
      .expect(201);

    expect(res.body.calendarSyncStatus).toBe("SYNCED");
    expect(res.body.googleEventId).toBe("fake-event-1");

    // Exactly one event, carrying the block's details.
    expect(calendar.createCalls).toHaveLength(1);
    const { input } = calendar.createCalls[0];
    expect(input.summary).toBe("Deep Study");
    expect(input.colorHex).toBe("#6366f1");
    // 60-minute block: start is one hour before end.
    expect(input.end.getTime() - input.start.getTime()).toBe(60 * 60 * 1000);
    // Description carries category + frozen points (60 min @ +20% -> 5).
    expect(input.description).toContain("Category: Study");
    expect(input.description).toContain("Points: 5");

    const stored = await prisma.blockInstance.findUnique({
      where: { id: res.body.id },
    });
    expect(stored?.calendarSyncStatus).toBe("SYNCED");
    expect(stored?.googleEventId).toBe("fake-event-1");
  });

  it("still completes (points intact) and marks PENDING when the write fails", async () => {
    calendar.failCreate = true;

    const res = await request(app.getHttpServer())
      .post("/api/v1/block-instances/complete")
      .set("Cookie", cookieFor(token))
      .send({ blockTypeId })
      .expect(201);

    // The completion itself is unaffected: it succeeded and kept its points.
    expect(res.body.points).toBe(5);
    expect(res.body.calendarSyncStatus).toBe("PENDING");
    expect(res.body.googleEventId).toBeNull();

    expect(calendar.createCalls).toHaveLength(1); // attempted once

    const stored = await prisma.blockInstance.findUnique({
      where: { id: res.body.id },
    });
    expect(stored?.calendarSyncStatus).toBe("PENDING");
    expect(stored?.googleEventId).toBeNull();
  });

  it("makes no port calls for a not-connected user (NOT_APPLICABLE)", async () => {
    calendar.connected = false;

    const res = await request(app.getHttpServer())
      .post("/api/v1/block-instances/complete")
      .set("Cookie", cookieFor(token))
      .send({ blockTypeId })
      .expect(201);

    expect(res.body.calendarSyncStatus).toBe("NOT_APPLICABLE");
    expect(res.body.googleEventId).toBeNull();
    expect(calendar.createCalls).toHaveLength(0);
  });
});
