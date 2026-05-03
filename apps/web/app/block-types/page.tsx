'use client';
import { useEffect, useState } from 'react';
import { api, BlockType, Category } from '../../lib/api';
import { BlockTypeForm } from '../../components/BlockTypeForm';
import { BlockTypeList } from '../../components/BlockTypeList';

export default function BlockTypesPage() {
  const [categories, setCategories] = useState<Category[]>([]); const [blockTypes, setBlockTypes] = useState<BlockType[]>([]); const [error, setError] = useState('');
  const load = async () => { try { setError(''); const [c,b] = await Promise.all([api.getCategories(), api.getBlockTypes()]); setCategories(c); setBlockTypes(b); } catch (e) { setError((e as Error).message); } };
  useEffect(() => { load(); }, []);
  return <main className="mx-auto max-w-5xl p-6 text-slate-100 space-y-6"><h1 className="text-3xl font-semibold">Block types</h1>{error&&<p className="text-red-400">{error}</p>}<BlockTypeForm categories={categories} onSubmit={async d=>{await api.createBlockType(d); await load();}}/><BlockTypeList blockTypes={blockTypes} categories={categories} onUpdate={async(id,data)=>{await api.updateBlockType(id,data); await load();}} onDelete={async(id)=>{await api.deleteBlockType(id); await load();}}/></main>;
}
