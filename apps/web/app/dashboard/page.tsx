'use client';
import { useEffect, useState } from 'react';
import { CompleteBlockButton } from '../../components/CompleteBlockButton';
import { ProgressByBlockType } from '../../components/ProgressByBlockType';
import { ProgressByCategory } from '../../components/ProgressByCategory';
import { WeeklyLevelCard } from '../../components/WeeklyLevelCard';
import { api, BlockType, Progress } from '../../lib/api';

const empty: Progress = { totalTargetBlocks: 0, totalCompletedBlocks: 0, progressPercentage: 0, progressByBlockType: [], progressByCategory: [], weeklyLevel: 1 };

export default function DashboardPage() {
  const [progress, setProgress] = useState<Progress>(empty);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setError('');
      const [p, b] = await Promise.all([api.getCurrentProgress(), api.getBlockTypes()]);
      setProgress(p);
      setBlockTypes(b);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  useEffect(() => { load(); }, []);

  return <main className="mx-auto max-w-6xl p-6 text-slate-100 space-y-6">
    <div className="flex items-end justify-between"><h1 className="text-3xl font-semibold">Dashboard</h1><p className="text-sm text-slate-400">Weekly-flex progress overview</p></div>
    {error && <p className="rounded border border-red-500/40 bg-red-500/10 p-3 text-red-300">{error}</p>}
    {status && <p className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-300">{status}</p>}

    <WeeklyLevelCard progress={progress} />

    <div className="grid gap-4 md:grid-cols-2">
      <ProgressByCategory progress={progress} />
      <ProgressByBlockType progress={progress} />
    </div>

    <section className="rounded-lg border border-slate-700 p-4">
      <h3 className="font-semibold mb-1">Quick complete</h3>
      <p className="text-sm text-slate-400 mb-3">Log finished blocks and instantly refresh weekly progress.</p>
      {blockTypes.length === 0 ? <p className="rounded bg-slate-800/60 p-3 text-slate-300">No block types yet. Create one in Block Types first.</p> : <ul className="space-y-2">{blockTypes.map(bt => <li key={bt.id} className="flex items-center justify-between rounded bg-slate-800/40 p-2"><span>{bt.name}</span><CompleteBlockButton onClick={async () => { await api.completeBlock({ blockTypeId: bt.id }); setStatus(`Completed one ${bt.name} block.`); await load(); }} /></li>)}</ul>}
    </section>
  </main>;
}
