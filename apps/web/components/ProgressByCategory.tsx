import { Card, ProgressBar } from "@heroui/react";
import { Progress as WeeklyProgress } from "../lib/api";

export function ProgressByCategory({
  progress,
}: {
  progress: WeeklyProgress;
}) {
  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
      <div className="mb-5">
        <h3 className="font-semibold text-slate-100">Progress by category</h3>
        <p className="mt-1 text-sm text-slate-400">
          Weekly completion grouped by category.
        </p>
      </div>

      {progress.progressByCategory.length === 0 ? (
        <p className="rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-400">
          No category targets yet for this week.
        </p>
      ) : (
        <ul className="space-y-4">
          {progress.progressByCategory.map((item) => {
            const pct =
              item.target > 0 ? (item.completed / item.target) * 100 : 0;

            const value = Math.max(0, Math.min(pct, 100));

            return (
              <li
                key={item.categoryId}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="w-fit rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
                    {item.categoryName}
                  </span>

                  <span className="text-sm font-medium text-slate-300">
                    {item.completed}/{item.target}
                  </span>
                </div>

                <ProgressBar
                  aria-label={`${item.categoryName} progress`}
                  value={value}
                  maxValue={100}
                  className="w-full"
                >
                  <ProgressBar.Track className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <ProgressBar.Fill className="h-full rounded-full bg-gradient-to-r from-violet-400 to-sky-400 transition-all" />
                  </ProgressBar.Track>
                </ProgressBar>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}