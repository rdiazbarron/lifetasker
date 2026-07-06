import { Card } from "@heroui/react";
import { Overview, formatWeekRange, hexWithAlpha } from "../lib/api";

// Cell shading: zero is barely visible; more completions read as more saturated.
function cellAlpha(count: number) {
  if (count <= 0) return 0.05;
  return Math.min(1, 0.3 + count * 0.18);
}

export function WeekOverviewGrid({ overview }: { overview: Overview }) {
  const { categories, weeks } = overview;

  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <h3 className="font-semibold text-slate-100">Weekly overview</h3>
      <p className="mb-4 mt-2 text-sm text-slate-400">
        Every week since you started, by category.
      </p>

      {weeks.length === 0 ? (
        <p className="text-sm text-slate-400">
          No activity yet. Complete a block to start your history.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-slate-900/70 px-3 py-2 text-left font-medium text-slate-400">
                  Week
                </th>
                {categories.map((category) => (
                  <th
                    key={category.id}
                    className="px-3 py-2 text-center font-medium text-slate-300"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: category.color }}
                        aria-hidden
                      />
                      {category.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week) => (
                <tr key={week.weekStart} className="border-t border-slate-800">
                  <td className="sticky left-0 z-10 whitespace-nowrap bg-slate-900/70 px-3 py-2 text-slate-400">
                    {formatWeekRange(week.weekStart, week.weekEnd)}
                  </td>
                  {categories.map((category) => {
                    const count = week.counts[category.id] ?? 0;
                    return (
                      <td
                        key={category.id}
                        className="px-3 py-2 text-center font-medium text-slate-100"
                        style={{
                          backgroundColor: hexWithAlpha(
                            category.color,
                            cellAlpha(count),
                          ),
                        }}
                      >
                        {count > 0 ? count : ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
