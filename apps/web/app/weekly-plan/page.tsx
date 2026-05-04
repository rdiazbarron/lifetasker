"use client";
import { Card, CardBody, Chip, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { WeeklyPlanEditor } from "../../components/WeeklyPlanEditor";
import { api, BlockType, WeeklyPlan, formatWeekRange } from "../../lib/api";

export default function WeeklyPlanPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setError("");
      const [p, b] = await Promise.all([api.getCurrentWeeklyPlan(), api.getBlockTypes()]);
      setPlan(p);
      setBlockTypes(b);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold">Weekly plan</h1>
      {plan && <Chip color="secondary" variant="flat">Current week: {formatWeekRange(plan.weekStart, plan.weekEnd)}</Chip>}
      {error && <Card><CardBody className="text-danger">{error}</CardBody></Card>}
      {status && <Card><CardBody className="text-success">{status}</CardBody></Card>}
      {loading ? <div className="flex justify-center py-20"><Spinner label="Loading weekly plan" /></div> : (
        blockTypes.length === 0 ? <Card><CardBody className="text-slate-400">No block types yet. Create block types first, then set weekly targets.</CardBody></Card> :
        plan ? <WeeklyPlanEditor blockTypes={blockTypes} initialItems={plan.planItems} onSave={async (items) => { await api.updateWeeklyPlanItems(plan.id, { items }); setStatus("Weekly targets saved."); await load(); }} /> :
        <Card><CardBody className="text-slate-400">No current weekly plan available.</CardBody></Card>
      )}
    </main>
  );
}
