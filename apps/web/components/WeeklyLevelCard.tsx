import { Card, Progress } from "@heroui/react";
import { Progress as WeeklyProgress } from "../lib/api";

export function WeeklyLevelCard({ progress }: { progress: WeeklyProgress }) {
  const value = Math.max(0, Math.min(progress.progressPercentage, 100));

  return (
    <Card className="bg-gradient-to-r from-sky-900/40 to-violet-900/30">
      <Card.Header className="flex-col items-start gap-1">
        <p className="text-sm text-slate-300">Weekly summary</p>
        <h2 className="text-2xl font-semibold">Weekly Level {progress.weeklyLevel}</h2>
      </Card.Header>
      <Card.Content className="pt-0">
        <p className="text-slate-200">
          {progress.totalCompletedBlocks}/{progress.totalTargetBlocks} blocks completed
        </p>
        <Progress className="mt-4" value={value} maxValue={100} label="Target completion" showValueLabel />
      </Card.Content>
    </Card>
  );
}
