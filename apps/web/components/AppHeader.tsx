"use client";

import { Button } from "@heroui/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "../lib/auth-client";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/block-types", label: "Block Types" },
  { href: "/categories", label: "Categories" },
  { href: "/weekly-plan", label: "Weekly Plan" },
  { href: "/dashboard", label: "Progress" },
];

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const onAuthPage = pathname === "/login" || pathname === "/signup";
  const showAppChrome = !!session && !onAuthPage;

  async function handleSignOut() {
    await signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="text-lg font-bold text-slate-100">
          LifeTasker
        </Link>

        {/* Only signed-in users see the app navigation and account controls. */}
        {showAppChrome && (
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? "border border-indigo-400/30 bg-indigo-500/15 text-indigo-300"
                      : "text-slate-400 hover:bg-slate-900 hover:text-slate-100"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        {showAppChrome && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400" title={session.user.email}>
              {session.user.email}
            </span>
            <Button
              onClick={handleSignOut}
              className="rounded-xl border border-slate-700 px-3 py-2 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
            >
              Log out
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
