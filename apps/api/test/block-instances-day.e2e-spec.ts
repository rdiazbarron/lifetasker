import "reflect-metadata";
import "dotenv/config";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end coverage for the day-history endpoint (GET /block-instances/day):
 *   1. returns every completion on a UTC calendar day, oldest first, with its
 *      block type, category, and note
 *   2. buckets by UTC day (a completion just past midnight UTC lands on the
 *      next day, matching the heatmap)
 *   3. rejects a malformed date and unauthenticated callers
 *   4. is scoped to the calling user
 */
const TAG = "e2e-day";

const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

// A fixed day well in the past so the query date is stable and unrelated to now.
const DAY = "2026-03-15";

describe("Block instances — day history (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userIds: string[] = [];
  let tokenA: string;
  let tokenB: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    const userA = await prisma.user.create({
      data: { email: `${TAG}-a-${stamp}@test.local`, name: "User A" },
    });
    const userB = await prisma.user.create({
      data: { email: `${TAG}-b-${stamp}@test.local`, name: "User B" },
    });
    userIds.push(userA.id, userB.id);

    const study = await prisma.category.create({
      data: {
        key: `${TAG}-study-${stamp}`,
        name: "Study",
        color: "#3b82f6",
        userId: userA.id,
      },
    });
    const studyBt = await prisma.blockType.create({
      data: {
        name: "Study block",
        durationMinutes: 60,
        userId: userA.id,
        categoryId: study.id,
      },
    });

    // Two completions on DAY (morning with a note, evening without), plus one
    // just after midnight UTC the next day that must NOT show up for DAY.
    await prisma.blockInstance.create({
      data: {
        userId: userA.id,
        blockTypeId: studyBt.id,
        completedAt: new Date(`${DAY}T08:00:00.000Z`),
        notes: "learned about event sourcing",
      },
    });
    await prisma.blockInstance.create({
      data: {
        userId: userA.id,
        blockTypeId: studyBt.id,
        completedAt: new Date(`${DAY}T20:00:00.000Z`),
      },
    });
    await prisma.blockInstance.create({
      data: {
        userId: userA.id,
        blockTypeId: studyBt.id,
        completedAt: new Date("2026-03-16T00:30:00.000Z"),
        notes: "spills into the next UTC day",
      },
    });

    // User B: a completion on the same day that must never leak into A's view.
    const catB = await prisma.category.create({
      data: { key: `${TAG}-b-${stamp}`, name: "Study", userId: userB.id },
    });
    const btB = await prisma.blockType.create({
      data: {
        name: "B block",
        durationMinutes: 60,
        userId: userB.id,
        categoryId: catB.id,
      },
    });
    await prisma.blockInstance.create({
      data: {
        userId: userB.id,
        blockTypeId: btB.id,
        completedAt: new Date(`${DAY}T10:00:00.000Z`),
        notes: "user B's private note",
      },
    });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    tokenA = `${TAG}-token-a-${stamp}`;
    tokenB = `${TAG}-token-b-${stamp}`;
    await prisma.session.create({
      data: { token: tokenA, userId: userA.id, expiresAt },
    });
    await prisma.session.create({
      data: { token: tokenB, userId: userB.id, expiresAt },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.blockInstance.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.blockType.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.category.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it("rejects unauthenticated requests", async () => {
    await request(app.getHttpServer())
      .get(`/api/v1/block-instances/day?date=${DAY}`)
      .expect(401);
  });

  it("returns the day's completions, oldest first, with block type and notes", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/block-instances/day?date=${DAY}`)
      .set("Cookie", cookieFor(tokenA))
      .expect(200);

    // The two DAY completions only — the 00:30 next-UTC-day row is excluded.
    expect(res.body).toHaveLength(2);

    const [first, second] = res.body;
    // Oldest first: 08:00 before 20:00.
    expect(first.completedAt).toBe(new Date(`${DAY}T08:00:00.000Z`).toISOString());
    expect(first.notes).toBe("learned about event sourcing");
    expect(first.blockType.name).toBe("Study block");
    expect(first.blockType.durationMinutes).toBe(60);
    expect(first.blockType.category.name).toBe("Study");
    expect(first.blockType.category.color).toBe("#3b82f6");

    // The note is optional: the evening completion has none.
    expect(second.notes).toBeNull();
  });

  it("rejects a malformed date", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/block-instances/day?date=15-03-2026")
      .set("Cookie", cookieFor(tokenA))
      .expect(400);
  });

  it("scopes the day to the calling user", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/block-instances/day?date=${DAY}`)
      .set("Cookie", cookieFor(tokenB))
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].notes).toBe("user B's private note");
  });
});
