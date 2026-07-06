"use client";

import { Button, Card, Input, Label, Spinner, TextField } from "@heroui/react";
import { FormEvent, useState } from "react";
import { api } from "../../lib/api";
import { useQuery } from "../../lib/useQuery";

export default function CategoriesPage() {
  const {
    data,
    loading,
    error,
    reload,
    setError,
  } = useQuery(() => api.getCategories());
  const categories = data ?? [];
  const DEFAULT_COLOR = "#6366f1";
  const [newName, setNewName] = useState("");
  const [newWeight, setNewWeight] = useState(0);
  const [newColor, setNewColor] = useState(DEFAULT_COLOR);
  const [editingId, setEditingId] = useState("");
  const [editingName, setEditingName] = useState("");
  const [editingWeight, setEditingWeight] = useState(0);
  const [editingColor, setEditingColor] = useState(DEFAULT_COLOR);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("");

  // Weight is a 0–100 bonus percent; clamp so out-of-range never reaches the API.
  const clampWeight = (value: number) =>
    Number.isNaN(value) ? 0 : Math.min(100, Math.max(0, Math.round(value)));

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");
    const cleanName = newName.trim();

    if (!cleanName) {
      setError("Category name is required.");
      return;
    }

    setIsCreating(true);

    try {
      await api.createCategory({
        name: cleanName,
        weightPercent: clampWeight(newWeight),
        color: newColor,
      });
      setNewName("");
      setNewWeight(0);
      setNewColor(DEFAULT_COLOR);
      setStatus("Category created.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create category.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveEdit = async () => {
    setError("");
    setStatus("");
    const cleanName = editingName.trim();

    if (!cleanName) {
      setError("Category name is required.");
      return;
    }

    setIsSaving(true);

    try {
      await api.updateCategory(editingId, {
        name: cleanName,
        weightPercent: clampWeight(editingWeight),
        color: editingColor,
      });
      setEditingId("");
      setEditingName("");
      setStatus("Category updated.");
      await reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update category.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold text-slate-100">Categories</h1>

      {error && <Card className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</Card>}
      {status && <Card className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">{status}</Card>}

      <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-100">Create category</h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={handleCreate}>
          <TextField className="w-full space-y-2">
            <Label className="text-sm font-medium text-slate-300">Name</Label>
            <Input
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Health"
            />
          </TextField>
          <TextField className="space-y-2 sm:w-36">
            <Label className="text-sm font-medium text-slate-300">Bonus %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              value={String(newWeight)}
              onChange={(e) => setNewWeight(clampWeight(Number(e.target.value)))}
            />
          </TextField>
          <div className="space-y-2">
            <Label className="text-sm font-medium text-slate-300">Color</Label>
            <input
              type="color"
              aria-label="Category color"
              className="h-11 w-14 cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-1"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
            />
          </div>
          <Button type="submit" isDisabled={isCreating} className="rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
            {isCreating ? "Saving..." : "Add category"}
          </Button>
        </form>
      </Card>

      <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <h2 className="text-lg font-semibold text-slate-100">Existing categories</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : categories.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No categories yet. Create your first one above.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {categories.map((category) => {
              const isEditing = editingId === category.id;

              return (
                <li key={category.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                        <TextField className="w-full space-y-2">
                          <Label className="text-sm font-medium text-slate-300">Category name</Label>
                          <Input
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                          />
                        </TextField>
                        <TextField className="space-y-2 sm:w-36">
                          <Label className="text-sm font-medium text-slate-300">Bonus %</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                            value={String(editingWeight)}
                            onChange={(e) => setEditingWeight(clampWeight(Number(e.target.value)))}
                          />
                        </TextField>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-300">Color</Label>
                          <input
                            type="color"
                            aria-label="Category color"
                            className="h-11 w-14 cursor-pointer rounded-xl border border-slate-700 bg-slate-950 p-1"
                            value={editingColor}
                            onChange={(e) => setEditingColor(e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" isDisabled={isSaving} onPress={handleSaveEdit} className="rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60">
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button type="button" isDisabled={isSaving} onPress={() => { setEditingId(""); setEditingName(""); }} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-200 transition hover:border-slate-600">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="h-5 w-5 shrink-0 rounded-full border border-slate-700" style={{ backgroundColor: category.color }} aria-hidden />
                        <span className="text-slate-100">{category.name}</span>
                        {category.weightPercent > 0 && (
                          <span className="rounded-full border border-indigo-400/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-medium text-indigo-300">
                            +{category.weightPercent}%
                          </span>
                        )}
                      </div>
                      <Button type="button" onPress={() => { setEditingId(category.id); setEditingName(category.name); setEditingWeight(category.weightPercent); setEditingColor(category.color); }} className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-600">
                        Edit
                      </Button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </main>
  );
}
