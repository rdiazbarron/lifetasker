"use client";

import { Button, Card, Input } from "@heroui/react";
import { useState } from "react";
import { BlockType, WeeklyPlanItem } from "../lib/api";

type WeeklyPlanItemInput = {
  blockTypeId: string;
  targetCount: number;
};

export function WeeklyPlanEditor({
  blockTypes,
  initialItems,
  onSave,
}: {
  blockTypes: BlockType[];
  initialItems: WeeklyPlanItem[];
  onSave: (items: WeeklyPlanItemInput[]) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      blockTypes.map((blockType) => [
        blockType.id,
        initialItems.find((item) => item.blockTypeId === blockType.id)
          ?.targetCount ?? 0,
      ])
    )
  );

  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setError("");

    for (const value of Object.values(values)) {
      if (!Number.isInteger(value) || value < 0) {
        setError("Target count must be a non-negative integer.");
        return;
      }
    }

    setIsSaving(true);

    try {
      await onSave(
        Object.entries(values)
          .filter(([, targetCount]) => targetCount > 0)
          .map(([blockTypeId, targetCount]) => ({
            blockTypeId,
            targetCount,
          }))
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving weekly targets."
      );
    } finally {
      setIsSaving(false);
    }
  }

  const totalTargets = Object.values(values).reduce(
    (sum, value) => sum + value,
    0
  );

  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Weekly targets
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Set flexible total counts for this week.
          </p>
        </div>

        <span className="w-fit rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          {totalTargets} planned blocks
        </span>
      </div>

      {blockTypes.length === 0 ? (
        <div className="rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-5">
          <p className="text-sm text-slate-400">
            No block types available. Create a block type first.
          </p>
        </div>
      ) : (
        <div className="space-y-3 border-t border-slate-800 pt-5">
          {blockTypes.map((blockType) => {
            const value = values[blockType.id] ?? 0;

            return (
              <div
                key={blockType.id}
                className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition hover:border-slate-700 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-slate-100">
                    {blockType.name}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>
                      {blockType.durationMinutes} min per block
                    </span>

                    {blockType.category?.name && (
                      <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-2.5 py-0.5 font-medium text-violet-300">
                        {blockType.category.name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:justify-end">
                  <span className="text-sm text-slate-400">Target</span>

                  <Input
                    type="number"
                    min={0}
                    className="w-24 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-center text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={String(value)}
                    onChange={(event) => {
                      const rawValue = event.target.value;
                      const nextValue =
                        rawValue === "" ? 0 : Number(rawValue);

                      setValues((currentValues) => ({
                        ...currentValues,
                        [blockType.id]: Number.isFinite(nextValue)
                          ? Math.max(0, Math.trunc(nextValue))
                          : 0,
                      }));
                    }}
                  />
                </div>
              </div>
            );
          })}

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button
          type="button"
          isDisabled={isSaving || blockTypes.length === 0}
          onPress={save}
          className="rounded-xl bg-indigo-500 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save weekly targets"}
        </Button>
      </div>
    </Card>
  );
}