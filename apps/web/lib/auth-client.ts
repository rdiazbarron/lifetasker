"use client";

import { createAuthClient } from "better-auth/react";

/**
 * Browser-side auth client. Talks to the Better Auth route handler on the web
 * origin (/api/auth/*), so no baseURL is needed — same origin as the app.
 */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
