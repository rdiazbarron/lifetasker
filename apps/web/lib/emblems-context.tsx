"use client";

import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api, Emblems } from "./api";
import { useSession } from "./auth-client";

const emptyEmblems: Emblems = { emblems: [], earnedCount: 0, total: 0 };

type EmblemsContextValue = {
  // The whole emblem catalog for the current user (list + earned/total).
  catalog: Emblems;
  // Re-fetch the catalog — call after an action that can earn emblems
  // (e.g. completing a block) so the collection and celebrations stay fresh.
  reload: () => Promise<void>;
};

const EmblemsContext = createContext<EmblemsContextValue | null>(null);

/**
 * Owns the single, canonical `/emblems` fetch for the app. Gated on an
 * authenticated session so it never fires on the login/marketing routes, and
 * exposed via context so the dashboard, the showcase, and the unlock toast all
 * read the same data instead of each issuing their own request.
 */
export function EmblemsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const authed = !!session?.user;
  const [catalog, setCatalog] = useState<Emblems>(emptyEmblems);

  const reload = useCallback(async () => {
    if (!authed) return;
    try {
      setCatalog(await api.getEmblems());
    } catch {
      // A failed fetch just leaves the last-known catalog in place; the shared
      // request helper already redirects to login on a 401.
    }
  }, [authed]);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <EmblemsContext.Provider value={{ catalog, reload }}>
      {children}
    </EmblemsContext.Provider>
  );
}

export function useEmblems(): EmblemsContextValue {
  const ctx = useContext(EmblemsContext);
  if (!ctx) {
    throw new Error("useEmblems must be used within an EmblemsProvider");
  }
  return ctx;
}
