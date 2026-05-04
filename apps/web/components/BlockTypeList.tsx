"use client";

import { Button, Card, Chip, Select } from "@heroui/react";
import { BlockType, Category } from "../lib/api";

export function BlockTypeList({
  blockTypes,
  categories,
  onUpdate,
  onDelete,
}: {
  blockTypes: BlockType[];
  categories: Category[];
  onUpdate: (id: string, data: Partial<BlockType>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  if (!blockTypes.length) {
    return <Card><Card.Content><p className="text-slate-400">No block types yet. Add your first weekly block type.</p></Card.Content></Card>;
  }

  return (
    <div className="space-y-3">
      {blockTypes.map((bt) => (
        <Card key={bt.id}>
          <Card.Header className="flex justify-between gap-2">
            <div>
              <p className="font-medium">{bt.name}</p>
              <p className="text-sm text-slate-400">{bt.durationMinutes} min</p>
            </div>
            <Chip color="secondary" variant="flat">{bt.category?.name ?? "Uncategorized"}</Chip>
          </Card.Header>
          <Card.Content className="pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                label="Category"
                className="max-w-xs"
                selectedKeys={[bt.categoryId]}
                onSelectionChange={(keys) => onUpdate(bt.id, { categoryId: String(Array.from(keys)[0] ?? bt.categoryId) })}
              >
                {categories.map((c) => (
                  <Select.Item key={c.id}>{c.name}</Select.Item>
                ))}
              </Select>
              <Button color="danger" variant="light" onPress={() => onDelete(bt.id)}>Delete</Button>
            </div>
          </Card.Content>
        </Card>
      ))}
    </div>
  );
}
