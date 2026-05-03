"use client";
import { useEffect, useState } from "react";
import { WeeklyPlanEditor } from "../../components/WeeklyPlanEditor";
import { api, BlockType, WeeklyPlan, formatWeekRange } from "../../lib/api";

export default function WeeklyPlanPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const load = async () => {
    try {
      setError("");
      const [p, b] = await Promise.all([
        api.getCurrentWeeklyPlan(),
        api.getBlockTypes(),
      ]);
      setPlan(p);
      setBlockTypes(b);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <main className="mx-auto max-w-5xl p-6 text-slate-100 space-y-6">
      <h1 className="text-3xl font-semibold">Weekly plan</h1>
      {plan && (
        <p className="text-slate-300">
          Current week:{" "}
          <span className="font-medium">
            {formatWeekRange(plan.weekStart, plan.weekEnd)}
          </span>
        </p>
      )}
      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 p-3 text-red-300">
          {error}
        </p>
      )}
      {status && (
        <p className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-300">
          {status}
        </p>
      )}
      {blockTypes.length === 0 ? (
        <p className="rounded border border-slate-700 p-4 text-slate-300">
          No block types yet. Create block types first, then set weekly targets.
        </p>
      ) : plan ? (
        <WeeklyPlanEditor
          blockTypes={blockTypes}
          initialItems={plan.planItems}
          onSave={async (items) => {
            await api.updateWeeklyPlanItems(plan.id, { items });
            setStatus("Weekly targets saved.");
            await load();
          }}
        />
      ) : (
        <p className="text-slate-400">Loading weekly plan…</p>
      )}
    </main>
  );
}
