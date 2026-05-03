'use client';
export function CompleteBlockButton({ onClick }: { onClick: () => Promise<void> }) { return <button onClick={() => onClick()} className="rounded bg-emerald-500 px-3 py-1 text-slate-950 font-medium">Complete</button>; }
