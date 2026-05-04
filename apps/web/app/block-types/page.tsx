"use client";
import { Card, Spinner } from "@heroui/react";
import { useEffect, useState } from "react";
import { BlockTypeForm } from "../../components/BlockTypeForm";
import { BlockTypeList } from "../../components/BlockTypeList";
import { api, BlockType, Category } from "../../lib/api";

export default function BlockTypesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setError("");
      const [c, b] = await Promise.all([api.getCategories(), api.getBlockTypes()]);
      setCategories(c);
      setBlockTypes(b);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold text-slate-100">Block types</h1>
      {error && <Card className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</Card>}
      {status && <Card className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">{status}</Card>}
      {loading ? <div className="flex justify-center py-20"><Spinner/></div> : (
        <div className="grid gap-4 lg:grid-cols-[1fr,2fr]">
          <BlockTypeForm categories={categories} onSubmit={async (d) => { await api.createBlockType(d); setStatus("Block type created."); await load(); }} />
          <BlockTypeList
            blockTypes={blockTypes}
            categories={categories}
            onUpdate={async (id, data) => { await api.updateBlockType(id, data); setStatus("Block type updated."); await load(); }}
            onDelete={async (id) => { await api.deleteBlockType(id); setStatus("Block type deleted."); await load(); }}
          />
        </div>
      )}
    </main>
  );
}
