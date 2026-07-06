import { Card, Label, ProgressBar } from "@heroui/react";
import { Progress as WeeklyProgress } from "../lib/api";

export function WeeklyLevelCard({ progress }: { progress: WeeklyProgress }) {
  const value = Math.max(0, Math.min(progress.progressPercentage, 100));

  return (
    <Card className="rounded-2xl border border-sky-400/20 bg-gradient-to-r from-sky-950/80 to-violet-950/70 p-6 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-slate-300">Weekly summary</p>

          <h2 className="text-2xl font-semibold text-slate-100">
            Weekly Level {progress.weeklyLevel}
          </h2>
        </div>

        <div className="text-right">
          <p className="text-sm text-slate-300">Points this week</p>
          <p className="text-2xl font-semibold text-amber-300">
            {progress.pointsThisWeek}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="text-sm text-slate-200">
          {progress.totalCompletedBlocks}/{progress.totalTargetBlocks} blocks
          completed
        </p>

        <ProgressBar
          aria-label="Target completion"
          className="mt-4 w-full space-y-2"
          value={value}
          maxValue={100}
        >
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm font-medium text-slate-300">
              Target completion
            </Label>

            <ProgressBar.Output className="text-sm font-medium text-slate-300" />
          </div>

          <ProgressBar.Track className="h-3 overflow-hidden rounded-full bg-slate-800">
            <ProgressBar.Fill className="h-full rounded-full bg-gradient-to-r from-sky-400 to-violet-400 transition-all" />
          </ProgressBar.Track>
        </ProgressBar>
      </div>
    </Card>
  );
}