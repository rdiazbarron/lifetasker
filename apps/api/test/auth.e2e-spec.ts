import "reflect-metadata";
import "dotenv/config";
import { INestApplication, ValidationPipe, VersioningType } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";

/**
 * End-to-end coverage for the authentication tracer bullet (#19), exercising
 * the real HTTP boundary of the API:
 *   1. unauthenticated / invalid-session requests are rejected (401)
 *   2. block-types are scoped to the authenticated user, and creation attaches
 *      the caller as owner
 *
 * Sessions are seeded directly into the shared Session table (the same table
 * Better Auth writes to in the web app); the auth guard resolves them exactly
 * as it would for a real cookie.
 */
const TAG = "e2e-auth";

// The API only reads the token before the dot; the signature is irrelevant.
const cookieFor = (token: string) => `better-auth.session_token=${token}.sig`;

describe("Auth & per-user isolation (e2e)", () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userIds: string[] = [];
  const categoryIds: string[] = [];
  let tokenA: string;
  let tokenB: string;
  let categoryId: string;

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

    // Categories are user-owned; the block types created below belong to userA,
    // so this category must be owned by userA too.
    const category = await prisma.category.create({
      data: { key: `${TAG}-cat-${stamp}`, name: "Focus", userId: userA.id },
    });
    categoryId = category.id;
    categoryIds.push(category.id);

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
    // block-types reference the category (onDelete: Restrict), so remove them
    // before the category. Sessions cascade when the users are deleted.
    await prisma.blockType.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.category.deleteMany({ where: { id: { in: categoryIds } } });
    await app.close();
  });

  it("rejects an unauthenticated request to block-types", async () => {
    await request(app.getHttpServer()).get("/api/v1/block-types").expect(401);
  });

  it("rejects a request bearing an invalid session token", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/block-types")
      .set("Cookie", cookieFor("does-not-exist"))
      .expect(401);
  });

  it("attaches the caller as owner on create and scopes reads per user", async () => {
    const created = await request(app.getHttpServer())
      .post("/api/v1/block-types")
      .set("Cookie", cookieFor(tokenA))
      .send({ name: "Deep Work", durationMinutes: 90, categoryId })
      .expect(201);
    // Ownership was stamped by the scoped Prisma client, not by the request.
    expect(created.body.userId).toBe(userIds[0]);

    const asA = await request(app.getHttpServer())
      .get("/api/v1/block-types")
      .set("Cookie", cookieFor(tokenA))
      .expect(200);
    expect(asA.body).toHaveLength(1);
    expect(asA.body[0].name).toBe("Deep Work");

    // User B must not see User A's block types.
    const asB = await request(app.getHttpServer())
      .get("/api/v1/block-types")
      .set("Cookie", cookieFor(tokenB))
      .expect(200);
    expect(asB.body).toHaveLength(0);
  });
});
