"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { useMemo, useState } from "react";
import { ContributionHeatmap } from "../../components/ContributionHeatmap";
import { EmblemsCard } from "../../components/EmblemsCard";
import { ProgressByBlockType } from "../../components/ProgressByBlockType";
import { ProgressByCategory } from "../../components/ProgressByCategory";
import { QuickComplete } from "../../components/QuickComplete";
import { WeekOverviewGrid } from "../../components/WeekOverviewGrid";
import { WeeklyLevelCard } from "../../components/WeeklyLevelCard";
import { api, Overview, Progress } from "../../lib/api";
import { useEmblems } from "../../lib/emblems-context";
import { useQuery } from "../../lib/useQuery";

const emptyOverview: Overview = { categories: [], weeks: [] };

const empty: Progress = { totalTargetBlocks: 0, totalCompletedBlocks: 0, pointsThisWeek: 0, progressPercentage: 0, progressByBlockType: [], progressByCategory: [], weeklyLevel: 1, lifetime: { level: 1, totalPoints: 0, pointsIntoLevel: 0, pointsForNextLevel: 100, pointsToNextLevel: 100, progressPercent: 0 } };

export default function DashboardPage() {
  const { data, loading, error, reload } = useQuery(() =>
    Promise.all([
      api.getCurrentProgress(),
      api.getBlockTypes(),
      api.getCurrentWeekCompletions(),
      api.getOverview(),
    ]).then(([progress, blockTypes, completions, overview]) => ({
      progress,
      blockTypes,
      completions,
      overview,
    })),
  );
  const progress = data?.progress ?? empty;
  const blockTypes = data?.blockTypes ?? [];
  const completions = data?.completions ?? [];
  const overview = data?.overview ?? emptyOverview;
  // Emblems come from the shared context (single canonical fetch), not this
  // page's own request. Refresh them alongside progress after a completion so
  // a newly-earned emblem is picked up.
  const { catalog: emblems, reload: reloadEmblems } = useEmblems();
  const [status, setStatus] = useState("");
  const [syncing, setSyncing] = useState(false);

  // Completions still waiting to reach Google Calendar. Only connected users
  // ever have PENDING rows (others are NOT_APPLICABLE), so not-connected users
  // never see the badge below.
  const pendingCount = useMemo(
    () => completions.filter((c) => c.calendarSyncStatus === "PENDING").length,
    [completions],
  );

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
      {pendingCount > 0 && (
        <Card className="flex flex-row items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-amber-300">
            <span className="rounded-full border border-amber-400/40 bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium">
              Not synced
            </span>
            <span className="text-sm">
              {pendingCount} completion{pendingCount === 1 ? "" : "s"} haven&rsquo;t reached Google Calendar yet.
            </span>
          </div>
          <Button
            type="button"
            size="sm"
            isDisabled={syncing}
            onPress={async () => {
              setSyncing(true);
              try {
                const result = await api.syncCalendar();
                setStatus(
                  result.pending > 0
                    ? `Synced ${result.synced}; ${result.pending} still pending — will retry.`
                    : `Synced ${result.synced} completion${result.synced === 1 ? "" : "s"} to Google Calendar.`,
                );
                await reload();
              } catch {
                setStatus("Couldn't sync right now. We'll retry automatically.");
              } finally {
                setSyncing(false);
              }
            }}
            className="shrink-0 rounded-xl border border-amber-400/40 bg-amber-500/20 px-3 py-1.5 text-sm font-medium text-amber-200 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {syncing ? "Syncing..." : "Sync now"}
          </Button>
        </Card>
      )}
      {loading ? <div className="flex justify-center py-20"><Spinner /></div> : <>
        <WeeklyLevelCard progress={progress} />
        <div className="grid gap-4 md:grid-cols-2">
          <ProgressByCategory progress={progress} />
          <ProgressByBlockType progress={progress} />
        </div>
        <EmblemsCard emblems={emblems} />
        <ContributionHeatmap categories={overview.categories} />
        <WeekOverviewGrid overview={overview} />
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
                        await Promise.all([reload(), reloadEmblems()]);
                      }}
                      className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-1.5 text-slate-200 transition hover:border-slate-600"
                    >
                      Undo
                    </Button>
                    <QuickComplete blockTypeName={bt.name} onComplete={async (notes) => { await api.completeBlock({ blockTypeId: bt.id, notes }); setStatus(`Completed one ${bt.name} block.`); await Promise.all([reload(), reloadEmblems()]); }} />
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
