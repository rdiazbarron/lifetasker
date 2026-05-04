"use client";

import { Button, Card, CardBody, CardHeader, Chip, Select, SelectItem } from "@heroui/react";
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
    return <Card><CardBody><p className="text-slate-400">No block types yet. Add your first weekly block type.</p></CardBody></Card>;
  }

  return (
    <div className="space-y-3">
      {blockTypes.map((bt) => (
        <Card key={bt.id}>
          <CardHeader className="flex justify-between gap-2">
            <div>
              <p className="font-medium">{bt.name}</p>
              <p className="text-sm text-slate-400">{bt.durationMinutes} min</p>
            </div>
            <Chip color="secondary" variant="flat">{bt.category?.name ?? "Uncategorized"}</Chip>
          </CardHeader>
          <CardBody className="pt-0">
            <div className="flex flex-wrap items-center gap-3">
              <Select
                label="Category"
                className="max-w-xs"
                selectedKeys={[bt.categoryId]}
                onSelectionChange={(keys) => onUpdate(bt.id, { categoryId: String(Array.from(keys)[0] ?? bt.categoryId) })}
              >
                {categories.map((c) => (
                  <SelectItem key={c.id}>{c.name}</SelectItem>
                ))}
              </Select>
              <Button color="danger" variant="light" onPress={() => onDelete(bt.id)}>Delete</Button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}
