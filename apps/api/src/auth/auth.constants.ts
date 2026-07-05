// Better Auth sets the session cookie under this name (plus the __Secure- prefix
// once secure cookies are enabled in production). The cookie value is
// `<token>.<hmac-signature>`; the token before the dot is what lands in the
// shared Session table, so that is what we look up.
export const SESSION_COOKIE_NAMES = [
  "better-auth.session_token",
  "__Secure-better-auth.session_token",
];

// Metadata key marking a route as reachable without authentication.
export const IS_PUBLIC_KEY = "isPublic";

/**
 * Request augmented by the auth guard with the resolved user id.
 */
export interface AuthenticatedRequest {
  headers: { cookie?: string };
  userId?: string;
}

/**
 * Pulls the Better Auth session token out of a raw Cookie header. Returns the
 * token portion (before the HMAC signature) or null if no session cookie is
 * present. The token is high-entropy base64url, so it never contains a dot.
 */
export function extractSessionToken(cookieHeader?: string): string | null {
  if (!cookieHeader) return null;

  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    cookies[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
  }

  for (const name of SESSION_COOKIE_NAMES) {
    const raw = cookies[name];
    if (raw) return decodeURIComponent(raw).split(".")[0];
  }
  return null;
}
