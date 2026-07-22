"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

// How long the "Completed ✓" confirmation lingers before the button resets to
// its idle state and can be pressed again. Short enough to feel responsive,
// long enough to be unmissable (the previous version reverted so fast a fast
// completion looked like nothing happened).
const DONE_MS = 1800;

type State = "idle" | "loading" | "done";

export function CompleteBlockButton({
  onClick,
}: {
  onClick: () => Promise<void>;
}) {
  const [state, setState] = useState<State>("idle");
  // Track the reset timer so we can clear it if the component unmounts (or the
  // button is pressed again) before it fires — avoids setting state on an
  // unmounted component.
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  async function handleComplete() {
    if (state === "loading") return;
    if (resetTimer.current) clearTimeout(resetTimer.current);

    setState("loading");
    try {
      await onClick();
      setState("done");
      resetTimer.current = setTimeout(() => setState("idle"), DONE_MS);
    } catch {
      // Let the parent surface the error banner; just return to idle so the
      // user can retry.
      setState("idle");
    }
  }

  const isLoading = state === "loading";
  const isDone = state === "done";

  return (
    <Button
      type="button"
      size="sm"
      isDisabled={isLoading}
      onPress={handleComplete}
      // Colour is driven by className (this Button has no `color` prop). On
      // success it turns emerald and gives a little `scale-105` pop, then
      // settles back to the neutral idle style.
      className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition duration-200 ease-out ${
        isDone
          ? "scale-105 border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
          : "scale-100 border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-600"
      }`}
    >
      {isLoading ? "Completing..." : isDone ? "Completed ✓" : "Complete"}
    </Button>
  );
}
