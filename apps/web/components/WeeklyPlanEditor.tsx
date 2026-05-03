'use client';
import { useState } from 'react';
import { BlockType, WeeklyPlanItem } from '../lib/api';

export function WeeklyPlanEditor({ blockTypes, initialItems, onSave }: { blockTypes: BlockType[]; initialItems: WeeklyPlanItem[]; onSave: (items: WeeklyPlanItem[]) => Promise<void>; }) {
  const [values, setValues] = useState<Record<string, number>>(() => Object.fromEntries(blockTypes.map(b => [b.id, initialItems.find(i => i.blockTypeId === b.id)?.targetCount ?? 0])));
  const [error, setError] = useState('');
  async function save() { setError(''); for (const v of Object.values(values)) if (!Number.isInteger(v) || v < 0) return setError('Target count must be a non-negative integer.'); await onSave(Object.entries(values).filter(([,v])=>v>0).map(([blockTypeId,targetCount])=>({blockTypeId,targetCount}))); }
  return <section className="rounded-lg border border-slate-700 p-4"><h2 className="font-semibold mb-3">Weekly targets</h2>{error && <p className="text-red-400 text-sm">{error}</p>}<div className="space-y-2">{blockTypes.map(bt => <div key={bt.id} className="flex items-center justify-between gap-4"><span>{bt.name}</span><input type="number" min={0} value={values[bt.id] ?? 0} onChange={e=>setValues(s=>({...s,[bt.id]:Number(e.target.value)}))} className="w-20 rounded bg-slate-900 border border-slate-700 p-1"/></div>)}</div><button onClick={save} className="mt-4 rounded bg-sky-500 px-4 py-2 text-slate-950 font-medium">Save targets</button></section>;
}
