import "reflect-metadata";
import "dotenv/config";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end coverage for emblems (#29): earned status is derived purely from
 * stored history, so seeding a user's past completions and plan makes the
 * matching emblems light up retroactively with no events having fired.
 */
const TAG = "e2e-emblems";

const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

describe("Emblems (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userIds: string[] = [];
  let token: string;

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
      data: { email: `${TAG}-${stamp}@test.local`, name: "User" },
    });
    userIds.push(user.id);

    const category = await prisma.category.create({
      data: {
        key: `${TAG}-study-${stamp}`,
        name: "Study",
        color: "#0ea5e9",
        userId: user.id,
      },
    });
    const blockType = await prisma.blockType.create({
      data: {
        name: "Study block",
        durationMinutes: 60,
        userId: user.id,
        categoryId: category.id,
      },
    });

    // 10 completions on 10 consecutive days, 70 points each:
    //   -> Study x10 (category tier), 10-day streak (>=7), 700 points (level 5).
    for (let i = 0; i < 10; i++) {
      await prisma.blockInstance.create({
        data: {
          userId: user.id,
          blockTypeId: blockType.id,
          points: 70,
          completedAt: new Date(Date.UTC(2026, 5, 1 + i, 12, 0, 0)),
        },
      });
    }

    // A plan whose week brackets those days, target 1 -> a perfect week.
    const plan = await prisma.weeklyPlan.create({
      data: {
        userId: user.id,
        weekStart: new Date(Date.UTC(2026, 5, 1, 0, 0, 0)),
        weekEnd: new Date(Date.UTC(2026, 5, 10, 23, 59, 59)),
      },
    });
    await prisma.weeklyPlanItem.create({
      data: { weeklyPlanId: plan.id, blockTypeId: blockType.id, targetCount: 1 },
    });

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    token = `${TAG}-token-${stamp}`;
    await prisma.session.create({
      data: { token, userId: user.id, expiresAt },
    });
  });

  afterAll(async () => {
    if (!prisma) return;
    await prisma.blockInstance.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.weeklyPlan.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.blockType.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it("requires a valid session", async () => {
    await request(app.getHttpServer()).get("/api/v1/emblems").expect(401);
  });

  it("retroactively reports emblems earned from existing history", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/emblems")
      .set("Cookie", cookieFor(token))
      .expect(200);

    const byKey = new Map<string, any>(
      res.body.emblems.map((e: any) => [e.key, e]),
    );
    const studyCat = res.body.emblems.find((e: any) =>
      e.key.startsWith("category:"),
    );

    // Category x10 earned, x50 not (count is 10).
    expect(studyCat.earned).toBe(true);
    expect(byKey.get(studyCat.key.replace(":10", ":50")).earned).toBe(false);

    // 10-day streak -> streak:7 earned, streak:30 not.
    expect(byKey.get("streak:7").earned).toBe(true);
    expect(byKey.get("streak:30").earned).toBe(false);

    // 700 points -> lifetime level 5 -> level:5 earned, level:10 not.
    expect(byKey.get("level:5").earned).toBe(true);
    expect(byKey.get("level:10").earned).toBe(false);

    // One perfect week -> perfect-week:1 earned, perfect-week:4 not.
    expect(byKey.get("perfect-week:1").earned).toBe(true);
    expect(byKey.get("perfect-week:4").earned).toBe(false);

    expect(res.body.earnedCount).toBeGreaterThanOrEqual(4);
  });

  it("carries art and color per emblem", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/emblems")
      .set("Cookie", cookieFor(token))
      .expect(200);

    // Every emblem has an art key of the form `${group}-${rank}`.
    for (const e of res.body.emblems) {
      expect(e.art).toMatch(/^(category|streak|level|perfect-week)-[123]$/);
    }

    // Category emblems carry the seeded category color; other groups are null.
    const studyCat = res.body.emblems.find((e: any) =>
      e.key.startsWith("category:"),
    );
    expect(studyCat.color).toBe("#0ea5e9");
    expect(
      res.body.emblems.find((e: any) => e.key === "streak:7").color,
    ).toBeNull();
  });
});
