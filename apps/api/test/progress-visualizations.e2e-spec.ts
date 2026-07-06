import "reflect-metadata";
import "dotenv/config";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end coverage for the progress visualizations (#27 overview grid, #28
 * heatmap):
 *   1. overview returns per-category counts per week from first activity to now,
 *      newest-first, with empty weeks zero-filled
 *   2. heatmap returns per-day counts over the trailing year, keyed on
 *      completedAt, for a single category and for "all"
 *   3. completing with an explicit past completedAt lands on that day
 *   4. both are scoped to the calling user
 */
const TAG = "e2e-viz";

const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;
const day = (d: Date) => d.toISOString().slice(0, 10);

describe("Progress visualizations (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userIds: string[] = [];
  let tokenA: string;
  let tokenB: string;
  let studyId: string;
  let sportId: string;
  let studyBlockA: string;

  // A fixed "now" so week/day math in the test matches what the service sees.
  const now = new Date();
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * 86_400_000);

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
      data: { key: `${TAG}-study-${stamp}`, name: "Study", userId: userA.id },
    });
    const sport = await prisma.category.create({
      data: { key: `${TAG}-sport-${stamp}`, name: "Sport", userId: userA.id },
    });
    studyId = study.id;
    sportId = sport.id;

    const studyBt = await prisma.blockType.create({
      data: {
        name: "Study block",
        durationMinutes: 60,
        userId: userA.id,
        categoryId: study.id,
      },
    });
    const sportBt = await prisma.blockType.create({
      data: {
        name: "Sport block",
        durationMinutes: 30,
        userId: userA.id,
        categoryId: sport.id,
      },
    });
    studyBlockA = studyBt.id;

    // Seed completions across weeks, leaving the 2-weeks-ago week empty (a gap):
    //   3 weeks ago: 2 Study + 1 Sport
    //   1 week ago:  1 Sport
    //   this week:   3 Study
    const seed = async (blockTypeId: string, daysAgo: number, times: number) => {
      for (let i = 0; i < times; i++) {
        await prisma.blockInstance.create({
          data: { userId: userA.id, blockTypeId, completedAt: at(daysAgo) },
        });
      }
    };
    await seed(studyBt.id, 21, 2);
    await seed(sportBt.id, 21, 1);
    await seed(sportBt.id, 7, 1);
    await seed(studyBt.id, 0, 3);

    // User B: independent data, must never leak into A's views.
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
      data: { userId: userB.id, blockTypeId: btB.id, completedAt: at(0) },
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
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it("rejects unauthenticated requests to the visualizations", async () => {
    await request(app.getHttpServer()).get("/api/v1/progress/overview").expect(401);
    await request(app.getHttpServer()).get("/api/v1/progress/heatmap").expect(401);
  });

  it("returns a week x category overview from first activity to now, newest-first, zero-filled", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/progress/overview")
      .set("Cookie", cookieFor(tokenA))
      .expect(200);

    // Only User A's categories are columns.
    expect(res.body.categories.map((c: any) => c.name).sort()).toEqual([
      "Sport",
      "Study",
    ]);

    // 3 weeks ago -> now inclusive = 4 rows, newest first.
    expect(res.body.weeks).toHaveLength(4);
    const [thisWeek, lastWeek, gapWeek, oldest] = res.body.weeks;

    expect(thisWeek.counts[studyId]).toBe(3);
    expect(thisWeek.counts[sportId]).toBe(0);

    expect(lastWeek.counts[studyId]).toBe(0);
    expect(lastWeek.counts[sportId]).toBe(1);

    // The empty week is present as a row of zeros, not skipped.
    expect(gapWeek.counts[studyId]).toBe(0);
    expect(gapWeek.counts[sportId]).toBe(0);

    expect(oldest.counts[studyId]).toBe(2);
    expect(oldest.counts[sportId]).toBe(1);
  });

  it("returns per-day counts for all activity, keyed on completedAt", async () => {
    const res = await request(app.getHttpServer())
      .get("/api/v1/progress/heatmap")
      .set("Cookie", cookieFor(tokenA))
      .expect(200);

    const byDate = new Map<string, number>(
      res.body.days.map((d: any) => [d.date, d.count]),
    );
    expect(byDate.get(day(at(0)))).toBe(3); // 3 study today
    expect(byDate.get(day(at(7)))).toBe(1); // 1 sport last week
    expect(byDate.get(day(at(21)))).toBe(3); // 2 study + 1 sport
    expect(byDate.has(day(at(14)))).toBe(false); // gap day absent
  });

  it("filters the heatmap to a single category", async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/progress/heatmap?categoryId=${studyId}`)
      .set("Cookie", cookieFor(tokenA))
      .expect(200);

    const byDate = new Map<string, number>(
      res.body.days.map((d: any) => [d.date, d.count]),
    );
    expect(byDate.get(day(at(0)))).toBe(3); // study today
    expect(byDate.get(day(at(21)))).toBe(2); // study 3 weeks ago
    expect(byDate.has(day(at(7)))).toBe(false); // that week was sport only
  });

  it("scopes both views to the calling user", async () => {
    const overview = await request(app.getHttpServer())
      .get("/api/v1/progress/overview")
      .set("Cookie", cookieFor(tokenB))
      .expect(200);
    // B has one category and a single week of its own.
    expect(overview.body.categories).toHaveLength(1);
    expect(overview.body.weeks).toHaveLength(1);
  });

  it("places a completion logged with a past completedAt on the correct day", async () => {
    const past = at(45);
    await request(app.getHttpServer())
      .post("/api/v1/block-instances/complete")
      .set("Cookie", cookieFor(tokenA))
      .send({ blockTypeId: studyBlockA, completedAt: past.toISOString() })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get(`/api/v1/progress/heatmap?categoryId=${studyId}`)
      .set("Cookie", cookieFor(tokenA))
      .expect(200);
    const byDate = new Map<string, number>(
      res.body.days.map((d: any) => [d.date, d.count]),
    );
    expect(byDate.get(day(past))).toBe(1);
  });
});
