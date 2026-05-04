"use client";
import { Button, Card, Chip } from "@heroui/react";
import { BlockType, Category } from "../lib/api";

export function BlockTypeList({ blockTypes, categories, onUpdate, onDelete }: { blockTypes: BlockType[]; categories: Category[]; onUpdate: (id: string, data: Partial<BlockType>) => Promise<void>; onDelete: (id: string) => Promise<void>; }) {
  if (!blockTypes.length) return <Card><Card.Content><p className="text-slate-400">No block types yet. Add your first weekly block type.</p></Card.Content></Card>;
  return <div className="space-y-3">{blockTypes.map((bt)=><Card key={bt.id}><Card.Header className="flex justify-between gap-2"><div><p className="font-medium">{bt.name}</p><p className="text-sm text-slate-400">{bt.durationMinutes} min</p></div><Chip color="secondary" variant="flat">{bt.category?.name ?? "Uncategorized"}</Chip></Card.Header><Card.Content className="pt-0"><div className="flex flex-wrap items-center gap-3"><label className="text-sm">Category<select className="mt-1 rounded-md border border-default-200 bg-transparent p-2" value={bt.categoryId} onChange={(e)=>onUpdate(bt.id,{categoryId:e.target.value})}>{categories.map((c)=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label><Button color="danger" variant="light" onPress={()=>onDelete(bt.id)}>Delete</Button></div></Card.Content></Card>)}</div>;
}
