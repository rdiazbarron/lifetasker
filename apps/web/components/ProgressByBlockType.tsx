import { Card, Chip, Progress } from "@heroui/react";
import { Progress as WeeklyProgress } from "../lib/api";

export function ProgressByBlockType({ progress }: { progress: WeeklyProgress }) {
  return (
    <Card>
      <Card.Header>
        <h3 className="font-semibold">Progress by block type</h3>
      </Card.Header>
      <Card.Content className="pt-0">
        {progress.progressByBlockType.length === 0 ? (
          <p className="text-slate-400">No block type targets yet for this week.</p>
        ) : (
          <ul className="space-y-3">
            {progress.progressByBlockType.map((item) => {
              const pct = item.target > 0 ? (item.completed / item.target) * 100 : 0;
              return (
                <li key={item.blockTypeId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Chip variant="flat" color="primary">{item.blockTypeName}</Chip>
                    <span className="text-sm text-slate-300">{item.completed}/{item.target}</span>
                  </div>
                  <Progress value={Math.max(0, Math.min(pct, 100))} maxValue={100} size="sm" />
                </li>
              );
            })}
          </ul>
        )}
      </Card.Content>
    </Card>
  );
}
