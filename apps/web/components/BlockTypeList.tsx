"use client";

import { Button, Card, Label, ListBox, Select } from "@heroui/react";
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
    return (
      <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20">
        <p className="text-sm text-slate-400">
          No block types yet. Add your first weekly block type.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {blockTypes.map((bt) => {
        const selectedCategory =
          categories.find((category) => category.id === bt.categoryId) ??
          bt.category;

        return (
          <Card
            key={bt.id}
            className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-black/20 transition hover:border-slate-700"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="font-semibold text-slate-100">{bt.name}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {bt.durationMinutes} min
                </p>
              </div>

              <span className="w-fit rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
                {bt.category?.name ?? "Uncategorized"}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="w-full max-w-xs space-y-2">
                <Label className="text-sm font-medium text-slate-300">
                  Category
                </Label>

                <Select
                  selectedKey={bt.categoryId || null}
                  onSelectionChange={(key) => {
                    const categoryId = key ? String(key) : bt.categoryId;

                    if (categoryId && categoryId !== bt.categoryId) {
                      onUpdate(bt.id, { categoryId });
                    }
                  }}
                  className="relative"
                >
                  <Select.Trigger className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-left text-slate-100 outline-none transition hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20">
                    <Select.Value>
                      {selectedCategory?.name ?? "Select a category"}
                    </Select.Value>
                  </Select.Trigger>

                  <Select.Popover className="z-50 mt-2 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 p-1 shadow-xl">
                    <ListBox className="max-h-60 overflow-auto outline-none">
                      {categories.map((category) => (
                        <ListBox.Item
                          key={category.id}
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

              <Button
                type="button"
                onPress={() => onDelete(bt.id)}
                className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20"
              >
                Delete
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}