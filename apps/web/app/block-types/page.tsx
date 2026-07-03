"use client";
import { Card, Spinner } from "@heroui/react";
import { useState } from "react";
import { BlockTypeForm } from "../../components/BlockTypeForm";
import { BlockTypeList } from "../../components/BlockTypeList";
import { api } from "../../lib/api";
import { useQuery } from "../../lib/useQuery";

export default function BlockTypesPage() {
  const { data, loading, error, reload } = useQuery(() =>
    Promise.all([api.getCategories(), api.getBlockTypes()]).then(
      ([categories, blockTypes]) => ({ categories, blockTypes }),
    ),
  );
  const categories = data?.categories ?? [];
  const blockTypes = data?.blockTypes ?? [];
  const [status, setStatus] = useState("");

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold text-slate-100">Block types</h1>
      {error && <Card className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">{error}</Card>}
      {status && <Card className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-300">{status}</Card>}
      {loading ? <div className="flex justify-center py-20"><Spinner/></div> : (
        <div className="grid gap-4 lg:grid-cols-[1fr,2fr]">
          <BlockTypeForm categories={categories} onSubmit={async (d) => { await api.createBlockType(d); setStatus("Block type created."); await reload(); }} />
          <BlockTypeList
            blockTypes={blockTypes}
            categories={categories}
            onUpdate={async (id, data) => { await api.updateBlockType(id, data); setStatus("Block type updated."); await reload(); }}
            onDelete={async (id) => { await api.deleteBlockType(id); setStatus("Block type deleted."); await reload(); }}
          />
        </div>
      )}
    </main>
  );
}
