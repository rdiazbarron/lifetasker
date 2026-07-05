import "reflect-metadata";
import "dotenv/config";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end coverage for user-owned categories (#24), exercising the real HTTP
 * boundary of the API:
 *   1. unauthenticated requests are rejected (401)
 *   2. categories are per-user — two users can each own a "Study" independently,
 *      and neither sees the other's
 *   3. weight is validated to 0..100 and color is persisted
 *   4. a user cannot edit another user's category
 *
 * Sessions are seeded directly into the shared Session table (as in
 * auth.e2e-spec.ts); the auth guard resolves them exactly as for a real cookie.
 */
const TAG = "e2e-categories";

// The API only reads the token before the dot; the signature is irrelevant.
const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

describe("User-owned categories (e2e)", () => {
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
    // Mirror main.ts so routes and validation behave identically.
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
    // Categories cascade when their owning users are deleted.
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await app.close();
  });

  it("rejects an unauthenticated request to categories", async () => {
    await request(app.getHttpServer()).get("/api/v1/categories").expect(401);
  });

  it("lets two users each own a 'Study' category independently, with weight & color", async () => {
    const createdA = await request(app.getHttpServer())
      .post("/api/v1/categories")
      .set("Cookie", cookieFor(tokenA))
      .send({ name: "Study", weightPercent: 20, color: "#123abc" })
      .expect(201);
    expect(createdA.body.userId).toBe(userIds[0]);
    expect(createdA.body.weightPercent).toBe(20);
    expect(createdA.body.color).toBe("#123abc");

    // Same name for a different user must succeed (per-user key uniqueness).
    const createdB = await request(app.getHttpServer())
      .post("/api/v1/categories")
      .set("Cookie", cookieFor(tokenB))
      .send({ name: "Study", weightPercent: 5, color: "#abcdef" })
      .expect(201);
    expect(createdB.body.userId).toBe(userIds[1]);

    // Each user sees only their own category.
    const asA = await request(app.getHttpServer())
      .get("/api/v1/categories")
      .set("Cookie", cookieFor(tokenA))
      .expect(200);
    expect(asA.body).toHaveLength(1);
    expect(asA.body[0].name).toBe("Study");
    expect(asA.body[0].weightPercent).toBe(20);

    const asB = await request(app.getHttpServer())
      .get("/api/v1/categories")
      .set("Cookie", cookieFor(tokenB))
      .expect(200);
    expect(asB.body).toHaveLength(1);
    expect(asB.body[0].weightPercent).toBe(5);
  });

  it("rejects an out-of-range weight", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/categories")
      .set("Cookie", cookieFor(tokenA))
      .send({ name: "Too Heavy", weightPercent: 150 })
      .expect(400);

    await request(app.getHttpServer())
      .post("/api/v1/categories")
      .set("Cookie", cookieFor(tokenA))
      .send({ name: "Negative", weightPercent: -10 })
      .expect(400);
  });

  it("rejects a malformed color", async () => {
    await request(app.getHttpServer())
      .post("/api/v1/categories")
      .set("Cookie", cookieFor(tokenA))
      .send({ name: "Bad Color", color: "not-a-hex" })
      .expect(400);
  });

  it("does not let a user edit another user's category", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/categories")
      .set("Cookie", cookieFor(tokenA))
      .send({ name: "Private", weightPercent: 10, color: "#000000" })
      .expect(201);

    // User B trying to edit A's category resolves to not-found.
    await request(app.getHttpServer())
      .patch(`/api/v1/categories/${created.body.id}`)
      .set("Cookie", cookieFor(tokenB))
      .send({ weightPercent: 100 })
      .expect(404);

    // The owner can edit it, and the new values round-trip.
    const edited = await request(app.getHttpServer())
      .patch(`/api/v1/categories/${created.body.id}`)
      .set("Cookie", cookieFor(tokenA))
      .send({ weightPercent: 80, color: "#ffffff" })
      .expect(200);
    expect(edited.body.weightPercent).toBe(80);
    expect(edited.body.color).toBe("#ffffff");
  });
});
