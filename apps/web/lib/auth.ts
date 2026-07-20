import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { GOOGLE_CALENDAR_SCOPES, GOOGLE_PROVIDER_ID } from "./google-calendar";

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

// Google is ADDITIVE: it is only wired up when its OAuth credentials are
// present, so the app still boots (and every existing email/password account
// keeps working) in dev, CI, or any environment without them. Calendar sync
// is delivered incrementally on top of this connection (#35, #36).
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
const googleEnabled = Boolean(googleClientId && googleClientSecret);

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
  // Add "Sign in with Google" / "Connect Google Calendar" alongside — never
  // instead of — email/password. Only registered when credentials exist.
  ...(googleEnabled
    ? {
        socialProviders: {
          [GOOGLE_PROVIDER_ID]: {
            clientId: googleClientId as string,
            clientSecret: googleClientSecret as string,
            // Request Calendar access at connect time so #35 can create the
            // dedicated "LifeTasker" calendar and write events to it.
            scope: GOOGLE_CALENDAR_SCOPES,
            // `offline` + `consent` make Google issue a refresh token, which
            // Better Auth uses to refresh the access token silently in the
            // background. The user is only sent back through consent if that
            // refresh actually fails (surfaced as "reconnect" in the UI).
            accessType: "offline",
            prompt: "consent",
          },
        },
      }
    : {}),
  user: { modelName: "User" },
  session: { modelName: "Session" },
  account: {
    modelName: "Account",
    // Let an existing email/password user attach Google to their SAME account
    // instead of spawning a second identity. Google is trusted, and its email
    // may differ from the address they signed up with.
    accountLinking: {
      enabled: true,
      trustedProviders: [GOOGLE_PROVIDER_ID],
      allowDifferentEmails: true,
    },
  },
  verification: { modelName: "Verification" },
  advanced: {
    // Cookies must survive http in local dev and be secure in production.
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  // Must remain the last plugin so it can flush Set-Cookie headers from
  // server actions / route handlers.
  plugins: [nextCookies()],
});
