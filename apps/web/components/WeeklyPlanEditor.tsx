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

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="font-semibold">Weekly targets</h2>
        <p className="text-xs text-slate-400">
          Set flexible total counts for this week.
        </p>
      </div>

      <div className="border-t border-slate-200 pt-4">
        <div className="space-y-3">
          {blockTypes.map((blockType) => (
            <div
              key={blockType.id}
              className="flex items-center justify-between gap-4"
            >
              <span>{blockType.name}</span>

              <Input
                type="number"
                min={0}
                className="w-24"
                value={String(values[blockType.id] ?? 0)}
                onChange={(event) => {
                  const rawValue = event.target.value;
                  const nextValue = rawValue === "" ? 0 : Number(rawValue);

                  setValues((currentValues) => ({
                    ...currentValues,
                    [blockType.id]: Number.isFinite(nextValue)
                      ? nextValue
                      : 0,
                  }));
                }}
              />
            </div>
          ))}

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </div>

      <div className="mt-5">
        <Button type="button" isDisabled={isSaving} onPress={save}>
          {isSaving ? "Saving..." : "Save weekly targets"}
        </Button>
      </div>
    </Card>
  );
}