import "reflect-metadata";
import "dotenv/config";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end coverage for weighted, frozen points (#25):
 *   1. completing a block stores points computed from the block's duration and
 *      its category weight at that moment
 *   2. editing the category weight afterward does NOT change points already
 *      earned (frozen history)
 *   3. the weekly progress response reports points earned this week
 *   4. completing requires a valid session
 *
 * Sessions are seeded directly into the shared Session table (as in the other
 * e2e specs); the auth guard resolves them exactly as for a real cookie.
 */
const TAG = "e2e-points";

const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

describe("Weighted, frozen points (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userIds: string[] = [];
  let token: string;
  let categoryId: string;
  let blockTypeId: string;

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
    const user = await prisma.user.create({
      data: { email: `${TAG}-${stamp}@test.local`, name: "Points User" },
    });
    userIds.push(user.id);

    // Study: +20% bonus. A 60-minute block => 4 base points * 1.2 = 4.8 -> 5.
    const category = await prisma.category.create({
      data: {
        key: `${TAG}-cat-${stamp}`,
        name: "Study",
        weightPercent: 20,
        userId: user.id,
      },
    });
    categoryId = category.id;

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
    // Delete owned rows in FK order, then the user (cascades category + session).
    await prisma.blockInstance.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.blockType.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it("rejects an unauthenticated completion", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/block-instances/complete")
      .send({ blockTypeId })
      .expect(401);
  });

  it("stores points from the category weight in effect at completion, and freezes them", async () => {
    // First completion at +20%: 60 min -> 5 points.
    const first = await request(app.getHttpServer())
      .post("/api/v1/block-instances/complete")
      .set("Cookie", cookieFor(token))
      .send({ blockTypeId })
      .expect(201);
    expect(first.body.points).toBe(5);
    const firstId = first.body.id;

    // Bump the category weight to +100%.
    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${categoryId}`)
      .set("Cookie", cookieFor(token))
      .send({ weightPercent: 100 })
      .expect(200);

    // A new completion is scored at the new weight: 60 min -> 4 * 2 = 8.
    const second = await request(app.getHttpServer())
      .post("/api/v1/block-instances/complete")
      .set("Cookie", cookieFor(token))
      .send({ blockTypeId })
      .expect(201);
    expect(second.body.points).toBe(8);

    // The earlier completion's points are unchanged — history is frozen.
    const stored = await prisma.blockInstance.findUnique({
      where: { id: firstId },
    });
    expect(stored?.points).toBe(5);
  });

  it("reports points earned this week in the progress response", async () => {
    const progress = await request(app.getHttpServer())
      .get("/api/v1/progress/current-week")
      .set("Cookie", cookieFor(token))
      .expect(200);
    // The two completions above (5 + 8) fall in the current week.
    expect(progress.body.pointsThisWeek).toBe(13);
  });
});
