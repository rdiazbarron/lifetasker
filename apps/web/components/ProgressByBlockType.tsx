import { Progress } from "../lib/api";
export function ProgressByBlockType({ progress }: { progress: Progress }) {
  return (
    <section className="rounded-lg border border-slate-700 p-4">
      <h3 className="font-semibold mb-3">Progress by block type</h3>
      {progress.progressByBlockType.length === 0 ? (
        <p className="text-slate-400">No targets yet for this week.</p>
      ) : (
        <ul className="space-y-2">
          {progress.progressByBlockType.map((i) => (
            <li
              key={i.blockTypeId}
              className="rounded bg-slate-800/40 p-2 text-sm flex justify-between"
            >
              <span>{i.blockTypeName}</span>
              <span>
                {i.completed}/{i.target}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
