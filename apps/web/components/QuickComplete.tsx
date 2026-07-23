"use client";

import { Button } from "@heroui/react";
import { useEffect, useRef, useState } from "react";
import { ModalShell } from "./ModalShell";

// How long the "Completed ✓" confirmation lingers on the trigger before it
// resets to idle — mirrors the old CompleteBlockButton so completing still
// gives the same unmissable feedback.
const DONE_MS = 1800;

type Phase = "idle" | "saving" | "done";

// Quick-complete control for one block type. Pressing "Complete" opens a small
// dialog asking (optionally) what you did — e.g. "learned about event sourcing"
// — so a month later the history view can show more than a checkmark. The note
// is optional: "Skip" completes with none, "Complete" completes with whatever
// was typed (empty text is treated as no note).
export function QuickComplete({
  blockTypeName,
  onComplete,
}: {
  blockTypeName: string;
  onComplete: (notes?: string) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    };
  }, []);

  // Focus the note field when the dialog opens so the user can just start typing.
  useEffect(() => {
    if (open) textareaRef.current?.focus();
  }, [open]);

  function openDialog() {
    if (phase === "saving") return;
    if (resetTimer.current) clearTimeout(resetTimer.current);
    setNote("");
    setError("");
    setPhase("idle");
    setOpen(true);
  }

  async function submit() {
    if (phase === "saving") return;
    const trimmed = note.trim();
    setPhase("saving");
    setError("");
    try {
      await onComplete(trimmed ? trimmed : undefined);
      setOpen(false);
      setPhase("done");
      resetTimer.current = setTimeout(() => setPhase("idle"), DONE_MS);
    } catch {
      // Keep the dialog open so the note isn't lost; let the user retry.
      setPhase("idle");
      setError("Couldn't save that completion. Try again.");
    }
  }

  const isDone = phase === "done";
  const isSaving = phase === "saving";

  return (
    <>
      <Button
        type="button"
        size="sm"
        isDisabled={isSaving}
        onPress={openDialog}
        className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition duration-200 ease-out ${
          isDone
            ? "scale-105 border-emerald-400/40 bg-emerald-500/20 text-emerald-200"
            : "scale-100 border-slate-700 bg-slate-950 text-slate-200 hover:border-slate-600"
        }`}
      >
        {isDone ? "Completed ✓" : "Complete"}
      </Button>

      {open && (
        <ModalShell
          title={`Complete ${blockTypeName}`}
          subtitle="Add a note about what you did (optional) — you'll thank yourself when reviewing your history."
          onClose={() => !isSaving && setOpen(false)}
          footer={
            <>
              <Button
                type="button"
                size="sm"
                isDisabled={isSaving}
                onPress={submit}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:border-slate-600 disabled:opacity-60"
              >
                Skip
              </Button>
              <Button
                type="button"
                size="sm"
                isDisabled={isSaving}
                onPress={submit}
                className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-sm font-medium text-emerald-200 transition hover:bg-emerald-500/30 disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Complete"}
              </Button>
            </>
          }
        >
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              // Cmd/Ctrl+Enter is a quick "save" from within the textarea.
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            rows={3}
            maxLength={2000}
            placeholder="e.g. learned about event sourcing"
            className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500"
          />
          {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        </ModalShell>
      )}
    </>
  );
}
