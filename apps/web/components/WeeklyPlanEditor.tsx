"use client";

import { Button, Card, Separator, Input } from "@heroui/react";
import { useState } from "react";
import { BlockType, WeeklyPlanItem } from "../lib/api";

export function WeeklyPlanEditor({
  blockTypes,
  initialItems,
  onSave,
}: {
  blockTypes: BlockType[];
  initialItems: WeeklyPlanItem[];
  onSave: (items: WeeklyPlanItem[]) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, number>>(() =>
    Object.fromEntries(
      blockTypes.map((b) => [b.id, initialItems.find((i) => i.blockTypeId === b.id)?.targetCount ?? 0]),
    ),
  );
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function save() {
    setError("");
    for (const v of Object.values(values)) {
      if (!Number.isInteger(v) || v < 0) return setError("Target count must be a non-negative integer.");
    }
    setIsSaving(true);
    try {
      await onSave(
        Object.entries(values)
          .filter(([, v]) => v > 0)
          .map(([blockTypeId, targetCount]) => ({ blockTypeId, targetCount })),
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <Card.Header className="flex-col items-start">
        <h2 className="font-semibold">Weekly targets</h2>
        <p className="text-xs text-slate-400">Set flexible total counts for this week.</p>
      </Card.Header>
      <Separator />
      <Card.Content className="space-y-3">
        {blockTypes.map((bt) => (
          <div key={bt.id} className="flex items-center justify-between gap-4">
            <span>{bt.name}</span>
            <Input
              type="number"
              min={0}
              className="w-24"
              value={String(values[bt.id] ?? 0)}
              onValueChange={(value) => setValues((s) => ({ ...s, [bt.id]: Number(value) || 0 }))}
            />
          </div>
        ))}
        {error && <p className="text-sm text-danger">{error}</p>}
      </Card.Content>
      <Card.Footer>
        <Button color="primary" onPress={save} isLoading={isSaving}>Save weekly targets</Button>
      </Card.Footer>
    </Card>
  );
}
