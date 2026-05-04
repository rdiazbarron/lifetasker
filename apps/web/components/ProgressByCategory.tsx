import { Card, CardBody, CardHeader, Chip, Progress } from "@heroui/react";
import { Progress as WeeklyProgress } from "../lib/api";

export function ProgressByCategory({ progress }: { progress: WeeklyProgress }) {
  return (
    <Card>
      <CardHeader>
        <h3 className="font-semibold">Progress by category</h3>
      </CardHeader>
      <CardBody className="pt-0">
        {progress.progressByCategory.length === 0 ? (
          <p className="text-slate-400">No category targets yet for this week.</p>
        ) : (
          <ul className="space-y-3">
            {progress.progressByCategory.map((item) => {
              const pct = item.target > 0 ? (item.completed / item.target) * 100 : 0;
              return (
                <li key={item.categoryId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Chip variant="flat" color="secondary">{item.categoryName}</Chip>
                    <span className="text-sm text-slate-300">{item.completed}/{item.target}</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(pct, 100))} maxValue={100} size="sm" />
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
