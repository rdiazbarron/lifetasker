import { CATEGORY_STYLES, Progress } from '../lib/api';
export function ProgressByCategory({ progress }: { progress: Progress }) {
  return <section className="rounded-lg border border-slate-700 p-4"><h3 className="font-semibold mb-3">Progress by category</h3>{progress.progressByCategory.length===0?<p className="text-slate-400">No targets yet for this week.</p>:<ul className="space-y-2">{progress.progressByCategory.map((i,idx)=><li key={i.categoryId} className="rounded border border-slate-700 p-2"><div className="flex items-center justify-between"><span className={`rounded px-2 py-0.5 text-xs border ${CATEGORY_STYLES[idx % CATEGORY_STYLES.length]}`}>{i.categoryName}</span><span className="text-sm">{i.completed}/{i.target}</span></div></li>)}</ul>}</section>;
}
