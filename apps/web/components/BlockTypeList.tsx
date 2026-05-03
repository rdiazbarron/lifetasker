'use client';
import { BlockType, Category } from '../lib/api';

export function BlockTypeList({ blockTypes, categories, onUpdate, onDelete }: { blockTypes: BlockType[]; categories: Category[]; onUpdate: (id: string, data: Partial<BlockType>) => Promise<void>; onDelete: (id: string) => Promise<void>; }) {
  if (!blockTypes.length) return <p className="text-slate-300">No block types yet.</p>;
  return <div className="space-y-3">{blockTypes.map(bt => <div key={bt.id} className="rounded border border-slate-700 p-3"><div className="flex justify-between gap-2"><div><p className="font-medium">{bt.name}</p><p className="text-sm text-slate-400">{bt.category?.name} · {bt.durationMinutes} min</p></div><button className="text-red-400" onClick={() => onDelete(bt.id)}>Delete</button></div><div className="mt-2 flex gap-2"><select defaultValue={bt.categoryId} className="rounded bg-slate-900 border border-slate-700 p-1" onChange={e => onUpdate(bt.id, { categoryId: e.target.value })}>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select><button className="rounded border border-slate-600 px-2" onClick={() => onUpdate(bt.id, { name: bt.name })}>Quick save</button></div></div>)}</div>;
}
