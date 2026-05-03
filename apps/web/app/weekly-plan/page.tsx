'use client';
import { useEffect, useState } from 'react';
import { WeeklyPlanEditor } from '../../components/WeeklyPlanEditor';
import { api, BlockType, WeeklyPlan } from '../../lib/api';

export default function WeeklyPlanPage() {
  const [plan, setPlan] = useState<WeeklyPlan | null>(null); const [blockTypes, setBlockTypes] = useState<BlockType[]>([]); const [error, setError] = useState('');
  const load = async () => { try { setError(''); const [p,b] = await Promise.all([api.getCurrentWeeklyPlan(), api.getBlockTypes()]); setPlan(p); setBlockTypes(b); } catch (e) { setError((e as Error).message); } };
  useEffect(()=>{load();},[]);
  const weekStartDate = new Date().toISOString().slice(0,10);
  const canCreate = !plan?.id;
  return <main className="mx-auto max-w-5xl p-6 text-slate-100 space-y-6"><h1 className="text-3xl font-semibold">Weekly plan</h1>{error&&<p className="text-red-400">{error}</p>}{plan?.message&&<p className="text-slate-400">{plan.message}</p>}{canCreate&&<button className="rounded bg-sky-500 px-4 py-2 text-slate-950" onClick={async()=>{await api.createWeeklyPlan({weekStartDate,items:[]}); await load();}}>Create current weekly plan</button>}{blockTypes.length===0?<p className="text-slate-400">No block types yet.</p>:plan?.id?<WeeklyPlanEditor blockTypes={blockTypes} initialItems={plan.planItems} onSave={async(items)=>{await api.updateWeeklyPlanItems(plan.id!,{items}); await load();}}/>:<p className="text-slate-400">Create a weekly plan to set targets.</p>}</main>;
}
