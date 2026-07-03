"use client";
import { Card, Chip, Spinner } from "@heroui/react";
import { useState } from "react";
import { WeeklyPlanEditor } from "../../components/WeeklyPlanEditor";
import { api, formatWeekRange } from "../../lib/api";
import { useQuery } from "../../lib/useQuery";

export default function WeeklyPlanPage() {
  const { data, loading, error, reload } = useQuery(() =>
    Promise.all([api.getCurrentWeeklyPlan(), api.getBlockTypes()]).then(
      ([plan, blockTypes]) => ({ plan, blockTypes }),
    ),
  );
  const plan = data?.plan ?? null;
  const blockTypes = data?.blockTypes ?? [];
  const [status, setStatus] = useState("");

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold">Weekly plan</h1>
      {plan && <Chip color="secondary" variant="flat">Current week: {formatWeekRange(plan.weekStart, plan.weekEnd)}</Chip>}
      {error && <Card><Card.Content className="text-danger">{error}</Card.Content></Card>}
      {status && <Card><Card.Content className="text-success">{status}</Card.Content></Card>}
      {loading ? <div className="flex justify-center py-20"><Spinner label="Loading weekly plan" /></div> : (
        blockTypes.length === 0 ? <Card><Card.Content className="text-slate-400">No block types yet. Create block types first, then set weekly targets.</Card.Content></Card> :
        plan ? <WeeklyPlanEditor blockTypes={blockTypes} initialItems={plan.planItems} onSave={async (items) => { await api.updateWeeklyPlanItems(plan.id, { items }); setStatus("Weekly targets saved."); await reload(); }} /> :
        <Card><Card.Content className="text-slate-400">No current weekly plan available.</Card.Content></Card>
      )}
    </main>
  );
}
