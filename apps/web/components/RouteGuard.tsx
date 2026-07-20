"use client";

import { Spinner } from "@heroui/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "../lib/auth-client";

/**
 * App-wide route protection (#21). A single client boundary in the root layout
 * that decides, per pathname, whether the current route may render:
 *
 * - **Protected data routes** require a session. Unauthenticated visitors are
 *   bounced to /login?next=<path> so they land back where they were headed.
 * - **Auth routes** (login/signup) are the inverse: an already-signed-in user is
 *   sent into the app instead of seeing the form again.
 * - Everything else (e.g. the public landing page) renders untouched.
 *
 * Centralising this here — rather than per page — means new data routes are
 * protected by adding one prefix below, and there is a single source of truth
 * for the redirect rules. A same-origin 401 is handled separately in the API
 * client, covering sessions that expire mid-visit.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/block-types",
  "/categories",
  "/weekly-plan",
  "/settings",
];
const AUTH_ROUTES = ["/login", "/signup"];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const onProtected = isProtectedPath(pathname);
  const onAuthRoute = AUTH_ROUTES.includes(pathname);

  useEffect(() => {
    if (isPending) return; // wait until we actually know the auth state
    if (onProtected && !session) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
    } else if (onAuthRoute && session) {
      router.replace("/dashboard");
    }
  }, [isPending, session, onProtected, onAuthRoute, pathname, router]);

  // Hold rendering while we resolve auth or the redirect above is in flight, so
  // a protected page never flashes for a logged-out user (and vice versa).
  const redirecting =
    (onProtected && (isPending || !session)) ||
    (onAuthRoute && !isPending && !!session);

  if (redirecting) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return <>{children}</>;
}
