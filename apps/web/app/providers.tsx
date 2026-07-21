"use client";

import { EmblemsProvider } from "../lib/emblems-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return <EmblemsProvider>{children}</EmblemsProvider>;
}
