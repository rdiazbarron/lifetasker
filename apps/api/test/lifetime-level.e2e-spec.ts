import "reflect-metadata";
import "dotenv/config";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end coverage for the lifetime level (#26): the progress response sums
 * every completion's frozen points into a lifetime total, maps it to a level on
 * the escalating curve, and reports progress toward the next level — scoped to
 * the calling user.
 */
const TAG = "e2e-lifetime";

const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

describe("Lifetime level (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userIds: string[] = [];
  let tokenA: string;

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

    const makeData = async (userId: string, pointValues: number[]) => {
      const category = await prisma.category.create({
        data: { key: `${TAG}-${userId}`, name: "Study", userId },
      });
      const blockType = await prisma.blockType.create({
        data: {
          name: "Block",
          durationMinutes: 60,
          userId,
          categoryId: category.id,
        },
      });
      for (const points of pointValues) {
        await prisma.blockInstance.create({
          data: {
            userId,
            blockTypeId: blockType.id,
            points,
            completedAt: new Date(),
          },
        });
      }
    };

    // User A: 100 + 75 = 175 total -> level 2 (floor 100), halfway to level 3.
    await makeData(userA.id, [100, 75]);
    // User B: a different total that must not bleed into A's figures.
    await makeData(userB.id, [10]);

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    tokenA = `${TAG}-token-a-${stamp}`;
    await prisma.session.create({
      data: { token: tokenA, userId: userA.id, expiresAt },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.blockInstance.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.blockType.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it("requires a valid session", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/progress/current-week")
      .expect(401);
  });

  it("sums only the caller's points into their lifetime level and next-level progress", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/progress/current-week")
      .set("Cookie", cookieFor(tokenA))
      .expect(200);

    const lifetime = res.body.lifetime;
    expect(lifetime.totalPoints).toBe(175); // User B's 10 points are excluded
    expect(lifetime.level).toBe(2);
    expect(lifetime.pointsIntoLevel).toBe(75);
    expect(lifetime.pointsForNextLevel).toBe(150);
    expect(lifetime.pointsToNextLevel).toBe(75);
    expect(lifetime.progressPercent).toBe(50);
  });
});
