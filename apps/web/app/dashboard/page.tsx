'use client';
import { useEffect, useState } from 'react';
import { CompleteBlockButton } from '../../components/CompleteBlockButton';
import { ProgressByBlockType } from '../../components/ProgressByBlockType';
import { ProgressByCategory } from '../../components/ProgressByCategory';
import { WeeklyLevelCard } from '../../components/WeeklyLevelCard';
import { api, BlockType, Progress } from '../../lib/api';

const empty: Progress = { totalTargetBlocks: 0, totalCompletedBlocks: 0, progressPercentage: 0, progressByBlockType: [], progressByCategory: [], weeklyLevel: 1 };
export default function DashboardPage() {
  const [progress, setProgress] = useState<Progress>(empty); const [blockTypes, setBlockTypes] = useState<BlockType[]>([]); const [error, setError] = useState('');
  const load = async () => { try { setError(''); const [p,b] = await Promise.all([api.getCurrentProgress(), api.getBlockTypes()]); setProgress(p); setBlockTypes(b); } catch (e) { setError((e as Error).message); } };
  useEffect(() => { load(); }, []);
  return <main className="mx-auto max-w-5xl p-6 text-slate-100 space-y-6"><h1 className="text-3xl font-semibold">Dashboard</h1>{error&&<p className="text-red-400">{error}</p>}<WeeklyLevelCard progress={progress}/><div className="grid gap-4 md:grid-cols-2"><ProgressByCategory progress={progress}/><ProgressByBlockType progress={progress}/></div><section className="rounded-lg border border-slate-700 p-4"><h3 className="font-semibold mb-2">Complete a block</h3>{blockTypes.length===0?<p className="text-slate-400">No block types yet.</p>:<ul className="space-y-2">{blockTypes.map(bt=><li key={bt.id} className="flex items-center justify-between"><span>{bt.name}</span><CompleteBlockButton onClick={async()=>{await api.completeBlock({blockTypeId:bt.id}); await load();}}/></li>)}</ul>}</section></main>;
}
