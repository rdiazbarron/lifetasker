"use client";

import {
  Button,
  Card,
  Input,
  Label,
  ListBox,
  Select,
  TextField,
} from "@heroui/react";
import { FormEvent, useState } from "react";
import { Category } from "../lib/api";

function normalizeSelectionKey(key: unknown): string {
  if (typeof key === "string" || typeof key === "number") return String(key);
  if (key && typeof key === "object" && "currentKey" in (key as Record<string, unknown>)) {
    const currentKey = (key as { currentKey?: string | number | null }).currentKey;
    return currentKey ? String(currentKey) : "";
  }
  return "";
}


export function BlockTypeForm({
  categories,
  onSubmit,
}: {
  categories: Category[];
  onSubmit: (data: {
    name: string;
    durationMinutes: number;
    categoryId: string;
    description?: string;
  }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("30");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanDescription = description.trim();
    const duration = Number(durationMinutes);

    if (!cleanName) {
      setError("Block type name is required.");
      return;
    }

    if (!Number.isFinite(duration) || duration < 1) {
      setError("Duration must be at least 1 minute.");
      return;
    }

    if (!categoryId) {
      setError("Category is required.");
      return;
    }

    setIsSaving(true);

    try {
      await onSubmit({
        name: cleanName,
        durationMinutes: duration,
        categoryId,
        description: cleanDescription || undefined,
      });

      setName("");
      setDurationMinutes("30");
      setCategoryId("");
      setDescription("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while saving the block type."
      );
    } finally {
      setIsSaving(false);
    }
  }
const selectedCategory = categories.find((c) => String(c.id) === categoryId);

  return (
    <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-100">
          Create block type
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Define reusable blocks for your weekly plan.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <TextField className="space-y-2">
          <Label className="text-sm font-medium text-slate-300">Name</Label>
          <Input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Deep Work"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </TextField>

        <TextField className="space-y-2">
          <Label className="text-sm font-medium text-slate-300">
            Duration minutes
          </Label>
          <Input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            type="number"
            min={1}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            required
          />
        </TextField>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-300">
            Category
          </Label>

          <Select
            selectedKey={categoryId || null}
            onSelectionChange={(key) => {
              setCategoryId(normalizeSelectionKey(key));
            }}
            className="relative"
          >
            <Select.Trigger className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-left text-slate-100 outline-none transition hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
              <Select.Value>
                <span
                  className={
                    selectedCategory ? "text-slate-100" : "text-slate-500"
                  }
                >
                  {selectedCategory?.name ?? "Select a category"}
                </span>
              </Select.Value>
            </Select.Trigger>

            <Select.Popover className="z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl">
              <ListBox className="max-h-60 overflow-auto outline-none">
                {categories.map((category) => (
                  <ListBox.Item key={category.id} id={category.id}
                    textValue={category.name}
                    className="cursor-pointer rounded-lg px-3 py-2 text-sm text-slate-100 outline-none transition hover:bg-slate-800 focus:bg-slate-800"
                  >
                    {category.name}
                  </ListBox.Item>
                ))}
              </ListBox>
            </Select.Popover>
          </Select>
        </div>

        <TextField className="space-y-2">
          <Label className="text-sm font-medium text-slate-300">
            Description
          </Label>
          <Input
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            placeholder="Optional note"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </TextField>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <Button
          type="submit"
          isDisabled={isSaving}
          className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save block type"}
        </Button>
      </form>
    </Card>
  );
}