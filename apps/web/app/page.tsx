import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-16 text-slate-100">
      <p className="mb-3 text-sm uppercase tracking-[0.2em] text-sky-300">LifeTasker</p>
      <h1 className="text-4xl font-semibold leading-tight md:text-5xl">Plan your week by flexible progress blocks.</h1>
      <p className="mt-6 max-w-2xl text-lg text-slate-300">
        MVP focused on weekly planning, block completion, and progress visibility without turning your week into a
        daily to-do checklist.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link className="rounded-md bg-sky-500 px-4 py-2 font-medium text-slate-950 hover:bg-sky-400" href="/dashboard">Dashboard</Link>
        <Link className="rounded-md border border-slate-600 px-4 py-2 hover:bg-slate-800" href="/block-types">Block types</Link>
        <Link className="rounded-md border border-slate-600 px-4 py-2 hover:bg-slate-800" href="/weekly-plan">Weekly plan</Link>
      </div>
    </main>
  );
}
