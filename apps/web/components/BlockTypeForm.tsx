'use client';
import { FormEvent, useState } from 'react';
import { Category } from '../lib/api';

export function BlockTypeForm({ categories, onSubmit }: { categories: Category[]; onSubmit: (data: { name: string; durationMinutes: number; categoryId: string; description?: string }) => Promise<void>; }) {
  const [name, setName] = useState(''); const [durationMinutes, setDurationMinutes] = useState(30); const [categoryId, setCategoryId] = useState(''); const [description, setDescription] = useState(''); const [error, setError] = useState('');
  async function handleSubmit(e: FormEvent) { e.preventDefault(); setError(''); if (!name.trim()) return setError('Block type name is required.'); if (!categoryId) return setError('Category is required.'); await onSubmit({ name: name.trim(), durationMinutes, categoryId, description: description.trim() || undefined }); setName(''); setDescription(''); }
  return <form onSubmit={handleSubmit} className="rounded-lg border border-slate-700 p-4 space-y-3 bg-slate-900/40"><h2 className="text-lg font-semibold">Create block type</h2>{error && <p className="text-red-400 text-sm">{error}</p>}<label className="text-sm text-slate-300">Name<input className="mt-1 w-full rounded bg-slate-900 border border-slate-700 p-2" placeholder="Deep Work" value={name} onChange={e => setName(e.target.value)} /></label>
  <label className="text-sm text-slate-300">Duration (minutes)<input className="mt-1 w-full rounded bg-slate-900 border border-slate-700 p-2" type="number" min={1} value={durationMinutes} onChange={e => setDurationMinutes(Number(e.target.value))} /></label>
  <label className="text-sm text-slate-300">Category<select className="mt-1 w-full rounded bg-slate-900 border border-slate-700 p-2" value={categoryId} onChange={e => setCategoryId(e.target.value)}><option value="">Select category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  <label className="text-sm text-slate-300">Description<textarea className="mt-1 w-full rounded bg-slate-900 border border-slate-700 p-2" placeholder="Optional note" value={description} onChange={e => setDescription(e.target.value)} /></label>
  <button className="rounded bg-sky-500 px-4 py-2 text-slate-950 font-medium">Save block type</button></form>;
}
