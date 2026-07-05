"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "./auth-client";

/**
 * Client-side route guard. Redirects to the login screen (remembering where the
 * user was headed) once we know there is no session. Pages use the returned
 * `isPending`/`session` to hold rendering until auth is resolved.
 *
 * This slice guards the block-types page; app-wide protection lands in #21.
 */
export function useRequireAuth() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      const next = encodeURIComponent(window.location.pathname);
      router.replace(`/login?next=${next}`);
    }
  }, [isPending, session, router]);

  return { session, isPending };
}
