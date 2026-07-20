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
 * End-to-end coverage for undo-delete, idempotent retry and "Sync now" (#36),
 * with the Google port replaced by a fake so nothing touches the network:
 *   1. undo deletes the stored Google event via the port
 *   2. undo still succeeds locally when the remote delete fails
 *   3. "Sync now" re-syncs only PENDING rows and never re-creates a SYNCED one
 *   4. a second "Sync now" once everything is synced is a no-op (idempotent)
 *   5. the endpoint requires a valid session
 *
 * Rows are seeded directly with the exact sync state each case needs, so the
 * background retries that fire on completion/dashboard-load can't muddy the
 * setup.
 */
const TAG = "e2e-cal-recovery";

const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

/** Records every call; can be toggled connected / failing per test. */
class FakeCalendarPort extends CalendarPort {
  connected = true;
  failCreate = false;
  failDelete = false;
  createCalls: Array<{ userId: string; input: CalendarEventInput }> = [];
  deleteCalls: Array<{ userId: string; eventId: string }> = [];
  private counter = 0;

  reset() {
    this.connected = true;
    this.failCreate = false;
    this.failDelete = false;
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
    if (this.failDelete) throw new Error("simulated Google delete failure");
  }
}

describe("Calendar recovery: undo, retry & sync now (e2e)", () => {
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
      data: { email: `${TAG}-${stamp}@test.local`, name: "Recovery User" },
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
    // Start each case from a clean slate of completions for our user.
    await prisma.blockInstance.deleteMany({ where: { userId: userIds[0] } });
  });

  const seedCompletion = (data: {
    status: "PENDING" | "SYNCED" | "NOT_APPLICABLE";
    googleEventId?: string | null;
  }) =>
    prisma.blockInstance.create({
      data: {
        userId: userIds[0],
        blockTypeId,
        points: 5,
        completedAt: new Date(),
        calendarSyncStatus: data.status,
        googleEventId: data.googleEventId ?? null,
      },
    });

  const storedRow = (id: string) =>
    prisma.blockInstance.findUnique({ where: { id } });

  it("undo deletes the stored Google event", async () => {
    const row = await seedCompletion({
      status: "SYNCED",
      googleEventId: "evt-to-delete",
    });

    await request(app.getHttpServer())
      .delete(`/api/v1/block-instances/complete/${blockTypeId}`)
      .set("Cookie", cookieFor(token))
      .expect(200);

    expect(calendar.deleteCalls).toEqual([
      { userId: userIds[0], eventId: "evt-to-delete" },
    ]);
    expect(await storedRow(row.id)).toBeNull();
  });

  it("still undoes locally when the remote delete fails", async () => {
    calendar.failDelete = true;
    const row = await seedCompletion({
      status: "SYNCED",
      googleEventId: "evt-doomed",
    });

    await request(app.getHttpServer())
      .delete(`/api/v1/block-instances/complete/${blockTypeId}`)
      .set("Cookie", cookieFor(token))
      .expect(200);

    // The delete was attempted but threw; the local completion is gone anyway.
    expect(calendar.deleteCalls).toHaveLength(1);
    expect(await storedRow(row.id)).toBeNull();
  });

  it("does not call the port on undo when nothing was synced", async () => {
    await seedCompletion({ status: "PENDING", googleEventId: null });

    await request(app.getHttpServer())
      .delete(`/api/v1/block-instances/complete/${blockTypeId}`)
      .set("Cookie", cookieFor(token))
      .expect(200);

    expect(calendar.deleteCalls).toHaveLength(0);
  });

  it("Sync now re-syncs only PENDING rows and never duplicates a SYNCED one", async () => {
    const pending = await seedCompletion({
      status: "PENDING",
      googleEventId: null,
    });
    const alreadySynced = await seedCompletion({
      status: "SYNCED",
      googleEventId: "evt-existing",
    });

    const res = await request(app.getHttpServer())
      .post("/api/v1/block-instances/sync")
      .set("Cookie", cookieFor(token))
      .expect(201);

    expect(res.body).toEqual({ synced: 1, pending: 0 });

    // Exactly one create — for the pending row only.
    expect(calendar.createCalls).toHaveLength(1);

    const pendingRow = await storedRow(pending.id);
    expect(pendingRow?.calendarSyncStatus).toBe("SYNCED");
    expect(pendingRow?.googleEventId).toBe("fake-event-1");

    // The already-synced row is untouched: same id, no new event.
    const syncedRow = await storedRow(alreadySynced.id);
    expect(syncedRow?.googleEventId).toBe("evt-existing");
  });

  it("Sync now is a no-op once everything is synced (idempotent)", async () => {
    await seedCompletion({ status: "SYNCED", googleEventId: "evt-a" });
    await seedCompletion({ status: "SYNCED", googleEventId: "evt-b" });

    const res = await request(app.getHttpServer())
      .post("/api/v1/block-instances/sync")
      .set("Cookie", cookieFor(token))
      .expect(201);

    expect(res.body).toEqual({ synced: 0, pending: 0 });
    expect(calendar.createCalls).toHaveLength(0);
  });

  it("reports rows still pending when the write keeps failing", async () => {
    calendar.failCreate = true;
    await seedCompletion({ status: "PENDING", googleEventId: null });

    const res = await request(app.getHttpServer())
      .post("/api/v1/block-instances/sync")
      .set("Cookie", cookieFor(token))
      .expect(201);

    expect(res.body).toEqual({ synced: 0, pending: 1 });
    expect(calendar.createCalls).toHaveLength(1);
  });

  it("rejects an unauthenticated Sync now", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/block-instances/sync")
      .expect(401);
  });
});
