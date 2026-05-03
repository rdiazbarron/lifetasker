import { Progress } from '../lib/api';
export function WeeklyLevelCard({ progress }: { progress: Progress }) {
  return <section className="rounded-lg border border-slate-700 bg-gradient-to-r from-sky-900/40 to-violet-900/30 p-5"><h2 className="text-2xl font-semibold">Weekly Level {progress.weeklyLevel}</h2><p className="text-slate-200 mt-1">{progress.totalCompletedBlocks}/{progress.totalTargetBlocks} blocks completed</p><div className="mt-3 h-2 w-full rounded bg-slate-800"><div className="h-2 rounded bg-sky-400" style={{width:`${Math.min(progress.progressPercentage,100)}%`}} /></div><p className="mt-1 text-sm text-slate-300">{progress.progressPercentage}% weekly target progress</p></section>;
}
