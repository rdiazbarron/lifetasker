"use client";
import { BlockType, CATEGORY_STYLES, Category } from "../lib/api";

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
  if (!blockTypes.length)
    return (
      <p className="rounded border border-slate-700 p-4 text-slate-300">
        No block types yet. Add your first weekly block type.
      </p>
    );
  return (
    <div className="space-y-3">
      {blockTypes.map((bt, idx) => (
        <div
          key={bt.id}
          className="rounded border border-slate-700 p-3 bg-slate-900/30"
        >
          <div className="flex justify-between gap-2">
            <div>
              <p className="font-medium">{bt.name}</p>
              <p className="text-sm text-slate-400">
                <span
                  className={`mr-2 rounded border px-2 py-0.5 text-xs ${CATEGORY_STYLES[idx % CATEGORY_STYLES.length]}`}
                >
                  {bt.category?.name ?? "Uncategorized"}
                </span>
                {bt.durationMinutes} min
              </p>
            </div>
            <button className="text-red-400" onClick={() => onDelete(bt.id)}>
              Delete
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <select
              defaultValue={bt.categoryId}
              className="rounded bg-slate-900 border border-slate-700 p-1"
              onChange={(e) => onUpdate(bt.id, { categoryId: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              className="rounded border border-slate-600 px-2"
              onClick={() => onUpdate(bt.id, { name: bt.name })}
            >
              Save
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
