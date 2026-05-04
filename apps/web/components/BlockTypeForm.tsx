"use client";

import { Button, Card, Input } from "@heroui/react";
import { FormEvent, useState } from "react";
import { Category } from "../lib/api";

export function BlockTypeForm({ categories, onSubmit }: { categories: Category[]; onSubmit: (data: { name: string; durationMinutes: number; categoryId: string; description?: string; }) => Promise<void>; }) {
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!name.trim()) return setError("Block type name is required.");
    if (!categoryId) return setError("Category is required.");
    setIsSaving(true);
    try { await onSubmit({ name: name.trim(), durationMinutes, categoryId, description: description.trim() || undefined }); setName(""); setDescription(""); }
    finally { setIsSaving(false); }
  }

  return <Card><Card.Header><h2 className="text-lg font-semibold">Create block type</h2></Card.Header><Card.Content><form onSubmit={handleSubmit} className="space-y-4"><Input label="Name" value={name} onValueChange={setName} isRequired /><Input type="number" min={1} label="Duration (minutes)" value={String(durationMinutes)} onValueChange={(v)=>setDurationMinutes(Number(v)||1)} /><label className="text-sm">Category<select className="mt-1 w-full rounded-md border border-default-200 bg-transparent p-2" value={categoryId} onChange={(e)=>setCategoryId(e.target.value)}><option value="">Select category</option>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><Input label="Description" value={description} onValueChange={setDescription} />{error && <p className="text-sm text-danger">{error}</p>}<Button color="primary" type="submit" isLoading={isSaving}>Save block type</Button></form></Card.Content></Card>;
}
