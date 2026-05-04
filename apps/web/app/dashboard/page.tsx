"use client";
import { Button, Card, CardBody, CardHeader, Chip, Divider, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { CompleteBlockButton } from "../../components/CompleteBlockButton";
import { ProgressByBlockType } from "../../components/ProgressByBlockType";
import { ProgressByCategory } from "../../components/ProgressByCategory";
import { WeeklyLevelCard } from "../../components/WeeklyLevelCard";
import { api, BlockType, Progress } from "../../lib/api";

const empty: Progress = { totalTargetBlocks: 0, totalCompletedBlocks: 0, progressPercentage: 0, progressByBlockType: [], progressByCategory: [], weeklyLevel: 1 };

export default function DashboardPage() {
  const [progress, setProgress] = useState<Progress>(empty);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setError("");
      const [p, b] = await Promise.all([api.getCurrentProgress(), api.getBlockTypes()]);
      setProgress(p);
      setBlockTypes(b);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-end justify-between">
        <h1 className="text-3xl font-semibold">Dashboard</h1>
        <Chip variant="flat" color="primary">Weekly-flex progress overview</Chip>
      </div>
      {error && <Card><CardBody className="text-danger">{error}</CardBody></Card>}
      {status && <Card><CardBody className="text-success">{status}</CardBody></Card>}
      {loading ? <div className="flex justify-center py-20"><Spinner label="Loading dashboard" /></div> : <>
        <WeeklyLevelCard progress={progress} />
        <div className="grid gap-4 md:grid-cols-2">
          <ProgressByCategory progress={progress} />
          <ProgressByBlockType progress={progress} />
        </div>
        <Card>
          <CardHeader><h3 className="font-semibold">Quick complete</h3></CardHeader>
          <Divider />
          <CardBody>
            <p className="mb-4 text-sm text-slate-400">Log finished blocks and instantly refresh weekly progress.</p>
            {blockTypes.length === 0 ? <p className="text-slate-400">No block types yet. Create one in Block Types first.</p> : (
              <ul className="space-y-2">
                {blockTypes.map((bt) => (
                  <li key={bt.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/60 p-2">
                    <div>
                      <p>{bt.name}</p><p className="text-xs text-slate-400">{bt.durationMinutes} minutes</p>
                    </div>
                    <CompleteBlockButton onClick={async () => { await api.completeBlock({ blockTypeId: bt.id }); setStatus(`Completed one ${bt.name} block.`); await load(); }} />
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </>}
    </main>
  );
}
