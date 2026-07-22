"use client";

import { Button, Card, Input, Label, TextField } from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { signIn, signUp } from "../lib/auth-client";
import { GOOGLE_PROVIDER_ID, GOOGLE_UI_ENABLED } from "../lib/google-calendar";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20";

// Only the EMAIL is remembered here (never the password — that stays with the
// browser's own password manager). Prefilling it means a returning user whose
// session expired only re-enters their password, not both fields.
const REMEMBERED_EMAIL_KEY = "lifetasker:remembered-email";

function nextTarget(): string {
  if (typeof window === "undefined") return "/dashboard";
  return (
    new URLSearchParams(window.location.search).get("next") || "/dashboard"
  );
}

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const isSignup = mode === "signup";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // On the login page, prefill the last email the user chose to remember.
  useEffect(() => {
    if (isSignup) return;
    const saved = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (saved) setEmail(saved);
  }, [isSignup]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);

    const result = isSignup
      ? await signUp.email({ email, password, name: name.trim() || email })
      : await signIn.email({ email, password, rememberMe });

    setBusy(false);

    if (result.error) {
      setError(
        isSignup
          ? result.error.message || "Could not create the account."
          : // Deliberately generic: never reveal whether the email exists.
            "Invalid email or password.",
      );
      return;
    }

    // Remember (or forget) the email for next time — login only.
    if (!isSignup) {
      if (rememberMe) {
        window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
      } else {
        window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }
    }

    router.replace(nextTarget());
    router.refresh();
  }

  async function handleGoogle() {
    setError("");
    setBusy(true);
    // Redirects to Google on success; only returns here if it fails to start.
    const result = await signIn.social({
      provider: GOOGLE_PROVIDER_ID,
      callbackURL: nextTarget(),
    });
    if (result?.error) {
      setBusy(false);
      setError(result.error.message || "Could not sign in with Google.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6 py-16">
      <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 shadow-xl shadow-black/20 backdrop-blur">
        <h1 className="text-2xl font-semibold text-slate-100">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {isSignup
            ? "Sign up to start planning your week."
            : "Log in to your LifeTasker account."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {isSignup && (
            <TextField className="space-y-2">
              <Label className="text-sm font-medium text-slate-300">Name</Label>
              <Input
                className={INPUT_CLASS}
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </TextField>
          )}

          <TextField className="space-y-2">
            <Label className="text-sm font-medium text-slate-300">Email</Label>
            <Input
              className={INPUT_CLASS}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </TextField>

          <TextField className="space-y-2">
            <Label className="text-sm font-medium text-slate-300">
              Password
            </Label>
            <Input
              className={INPUT_CLASS}
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </TextField>

          {!isSignup && (
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 accent-indigo-500 focus:ring-indigo-500/20"
              />
              Keep me signed in on this device
            </label>
          )}

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button
            type="submit"
            isDisabled={busy}
            className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy
              ? "Please wait..."
              : isSignup
                ? "Create account"
                : "Log in"}
          </Button>
        </form>

        {GOOGLE_UI_ENABLED && (
          <>
            <div className="mt-6 flex items-center gap-3 text-xs text-slate-500">
              <span className="h-px flex-1 bg-slate-800" />
              or
              <span className="h-px flex-1 bg-slate-800" />
            </div>
            <Button
              type="button"
              isDisabled={busy}
              onPress={handleGoogle}
              className="mt-6 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 font-medium text-slate-100 transition hover:border-slate-600 hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Continue with Google
            </Button>
          </>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          {isSignup ? (
            <>
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-300 hover:text-indigo-200">
                Log in
              </Link>
            </>
          ) : (
            <>
              Need an account?{" "}
              <Link href="/signup" className="text-indigo-300 hover:text-indigo-200">
                Sign up
              </Link>
            </>
          )}
        </p>
      </Card>
    </main>
  );
}
