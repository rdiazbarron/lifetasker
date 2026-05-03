"use client";
import { useEffect, useState } from "react";
import { api, BlockType, Category } from "../../lib/api";
import { BlockTypeForm } from "../../components/BlockTypeForm";
import { BlockTypeList } from "../../components/BlockTypeList";

export default function BlockTypesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const load = async () => {
    try {
      setError("");
      const [c, b] = await Promise.all([
        api.getCategories(),
        api.getBlockTypes(),
      ]);
      setCategories(c);
      setBlockTypes(b);
    } catch (e) {
      setError((e as Error).message);
    }
  };
  useEffect(() => {
    load();
  }, []);
  return (
    <main className="mx-auto max-w-6xl p-6 text-slate-100 space-y-6">
      <h1 className="text-3xl font-semibold">Block types</h1>
      {error && (
        <p className="rounded border border-red-500/40 bg-red-500/10 p-3 text-red-300">
          {error}
        </p>
      )}
      {status && (
        <p className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-emerald-300">
          {status}
        </p>
      )}
      <div className="grid gap-4 lg:grid-cols-[1fr,2fr]">
        <BlockTypeForm
          categories={categories}
          onSubmit={async (d) => {
            await api.createBlockType(d);
            setStatus("Block type created.");
            await load();
          }}
        />
        <BlockTypeList
          blockTypes={blockTypes}
          categories={categories}
          onUpdate={async (id, data) => {
            await api.updateBlockType(id, data);
            setStatus("Block type updated.");
            await load();
          }}
          onDelete={async (id) => {
            await api.deleteBlockType(id);
            setStatus("Block type deleted.");
            await load();
          }}
        />
      </div>
    </main>
  );
}
