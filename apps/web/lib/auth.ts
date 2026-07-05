import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

/**
 * Better Auth server instance. It lives in the web app but persists into the
 * SAME PostgreSQL database the NestJS API uses. The model names below are
 * PascalCase so Better Auth reads/writes the Prisma-managed tables (`User`,
 * `Session`, `Account`, `Verification`) rather than creating a parallel set —
 * there is exactly one `User` identity across the whole system.
 *
 * Prisma owns the schema and migrations for those tables; Better Auth only
 * reads and writes rows. The API authenticates requests by looking up the
 * `Session` row this instance creates (see the API auth guard).
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for authentication.");
}

const secret = process.env.BETTER_AUTH_SECRET;
if (!secret) {
  throw new Error("BETTER_AUTH_SECRET is required for authentication.");
}

export const auth = betterAuth({
  database: new Pool({ connectionString }),
  secret,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  trustedOrigins: (process.env.CORS_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  emailAndPassword: {
    enabled: true,
    // No email verification flow in this slice (out of scope for #19).
    requireEmailVerification: false,
  },
  user: { modelName: "User" },
  session: { modelName: "Session" },
  account: { modelName: "Account" },
  verification: { modelName: "Verification" },
  advanced: {
    // Cookies must survive http in local dev and be secure in production.
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  // Must remain the last plugin so it can flush Set-Cookie headers from
  // server actions / route handlers.
  plugins: [nextCookies()],
});
