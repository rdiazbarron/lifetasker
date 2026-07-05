import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "../../../../lib/auth";

// Serves every Better Auth endpoint (sign-up, sign-in, sign-out, get-session,
// ...) under /api/auth/* on the web origin.
export const { GET, POST } = toNextJsHandler(auth);
