"use client";

import { Button, Card, Input, Select } from "@heroui/react";
import { FormEvent, useState } from "react";
import { Category } from "../lib/api";

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
    try {
      await onSubmit({
        name: name.trim(),
        durationMinutes,
        categoryId,
        description: description.trim() || undefined,
      });
      setName("");
      setDescription("");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card>
      <Card.Header><h2 className="text-lg font-semibold">Create block type</h2></Card.Header>
      <Card.Content>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Name" placeholder="Deep Work" value={name} onValueChange={setName} isRequired />
          <Input
            type="number"
            min={1}
            label="Duration (minutes)"
            value={String(durationMinutes)}
            onValueChange={(value) => setDurationMinutes(Number(value) || 1)}
          />
          <Select
            label="Category"
            selectedKeys={categoryId ? [categoryId] : []}
            onSelectionChange={(keys) => setCategoryId(String(Array.from(keys)[0] ?? ""))}
          >
            {categories.map((c) => (
              <Select.Item key={c.id}>{c.name}</Select.Item>
            ))}
          </Select>
          <Input
            label="Description"
            placeholder="Optional note"
            value={description}
            onValueChange={setDescription}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button color="primary" type="submit" isLoading={isSaving}>Save block type</Button>
        </form>
      </Card.Content>
    </Card>
  );
}
