"use client";

import { EmblemUnlockToastHost } from "../components/EmblemUnlockToast";
import { EmblemsProvider } from "../lib/emblems-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <EmblemsProvider>
      {children}
      <EmblemUnlockToastHost />
    </EmblemsProvider>
  );
}
