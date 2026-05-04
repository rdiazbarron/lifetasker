"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";
import { CompleteBlockButton } from "../../components/CompleteBlockButton";
import { ProgressByBlockType } from "../../components/ProgressByBlockType";
import { ProgressByCategory } from "../../components/ProgressByCategory";
import { WeeklyLevelCard } from "../../components/WeeklyLevelCard";
import { api, BlockInstance, BlockType, Progress } from "../../lib/api";

const empty: Progress = { totalTargetBlocks: 0, totalCompletedBlocks: 0, progressPercentage: 0, progressByBlockType: [], progressByCategory: [], weeklyLevel: 1 };

export default function DashboardPage() {
  const [progress, setProgress] = useState<Progress>(empty);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [completions, setCompletions] = useState<BlockInstance[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setError("");
      const [p, b, c] = await Promise.all([
        api.getCurrentProgress(),
        api.getBlockTypes(),
        api.getCurrentWeekCompletions(),
      ]);
      setProgress(p);
      setBlockTypes(b);
      setCompletions(c);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const completionCountsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    completions.forEach((c) => {
      counts[c.blockTypeId] = (counts[c.blockTypeId] || 0) + 1;
    });
    return counts;
  }, [completions]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-semibold text-slate-100">Dashboard</h1>
        <span className="w-fit rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          Weekly-flex progress overview
        </span>
      </div>
      {error && <Card className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</Card>}
      {status && <Card className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">{status}</Card>}
      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : <>
        <WeeklyLevelCard progress={progress} />
        <div className="grid gap-4 md:grid-cols-2">
          <ProgressByCategory progress={progress} />
          <ProgressByBlockType progress={progress} />
        </div>
        <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
          <h3 className="font-semibold text-slate-100">Quick complete</h3>
          <p className="mb-4 mt-2 text-sm text-slate-400">Log finished blocks and instantly refresh weekly progress.</p>
          {blockTypes.length === 0 ? <p className="text-slate-400">No block types yet. Create one in Block Types first.</p> : (
            <ul className="space-y-2">
              {blockTypes.map((bt) => (
                <li key={bt.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/60 p-2">
                  <div>
                    <p className="text-slate-100">{bt.name}</p>
                    <p className="text-xs text-slate-400">{bt.durationMinutes} minutes • {completionCountsByType[bt.id] || 0} completed this week</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      isDisabled={!completionCountsByType[bt.id]}
                      onPress={async () => {
                        await api.undoLastCompletedBlock(bt.id);
                        setStatus(`Undid last ${bt.name} completion.`);
                        await load();
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 transition hover:border-slate-600"
                    >
                      Undo
                    </Button>
                    <CompleteBlockButton onClick={async () => { await api.completeBlock({ blockTypeId: bt.id }); setStatus(`Completed one ${bt.name} block.`); await load(); }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </>}
    </main>
  );
}
