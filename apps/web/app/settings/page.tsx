"use client";

import { Button, Card, Spinner } from "@heroui/react";
import { useCallback, useEffect, useState } from "react";
import { authClient, useSession } from "../../lib/auth-client";
import {
  GOOGLE_CALENDAR_SCOPES,
  GOOGLE_PROVIDER_ID,
  GOOGLE_UI_ENABLED,
  hasCalendarScope,
} from "../../lib/google-calendar";

type LinkedAccount = {
  providerId: string;
  accountId: string;
  scopes?: string[];
};

export default function SettingsPage() {
  // Route protection is centralised in RouteGuard (/settings is a protected
  // prefix); here we only need the session to gate the initial data load.
  const { data: session, isPending } = useSession();

  // null = not loaded yet; array (possibly empty) = loaded.
  const [accounts, setAccounts] = useState<LinkedAccount[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await authClient.listAccounts();
    if (result.error) {
      setError(result.error.message || "Could not load your connections.");
      setAccounts([]);
      return;
    }
    setError("");
    setAccounts((result.data ?? []) as LinkedAccount[]);
  }, []);

  useEffect(() => {
    if (session) load();
  }, [session, load]);

  // Sends the browser to Google's consent screen. Used both for the first
  // connect and to re-grant access if a silent token refresh has failed
  // ("Reconnect"). Only returns here if the redirect fails to start.
  async function handleConnect() {
    setBusy(true);
    setError("");
    const result = await authClient.linkSocial({
      provider: GOOGLE_PROVIDER_ID,
      callbackURL: "/settings",
      scopes: GOOGLE_CALENDAR_SCOPES,
    });
    if (result?.error) {
      setBusy(false);
      setError(result.error.message || "Could not connect Google.");
    }
  }

  async function handleDisconnect() {
    setBusy(true);
    setError("");
    const result = await authClient.unlinkAccount({
      providerId: GOOGLE_PROVIDER_ID,
    });
    setBusy(false);
    if (result?.error) {
      setError(result.error.message || "Could not disconnect Google.");
      return;
    }
    await load();
  }

  // Hold rendering until the auth guard resolves (it redirects if signed out).
  if (isPending || !session) {
    return (
      <main className="mx-auto flex max-w-6xl justify-center p-12">
        <Spinner />
      </main>
    );
  }

  const google = accounts?.find((a) => a.providerId === GOOGLE_PROVIDER_ID);
  const connected = Boolean(google);
  const calendarReady = hasCalendarScope(google?.scopes);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <h1 className="text-3xl font-semibold text-slate-100">Settings</h1>

      {error && (
        <Card className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-300">
          {error}
        </Card>
      )}

      <Card className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl shadow-black/20 backdrop-blur">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">
              Google Calendar
            </h2>
            <p className="mt-1 max-w-xl text-sm text-slate-400">
              Connect your Google account to automatically log completed
              activities to a dedicated &ldquo;LifeTasker&rdquo; calendar.
              Nothing is written until you complete a block, and your points and
              history never depend on Google being reachable.
            </p>
          </div>
          {connected && calendarReady && (
            <span className="shrink-0 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Connected
            </span>
          )}
        </div>

        <div className="mt-5">
          {!GOOGLE_UI_ENABLED ? (
            <p className="text-sm text-slate-500">
              Google Calendar isn&rsquo;t configured on this deployment.
            </p>
          ) : accounts === null ? (
            <Spinner />
          ) : !connected ? (
            <Button
              type="button"
              isDisabled={busy}
              onPress={handleConnect}
              className="rounded-xl bg-indigo-500 px-4 py-2.5 font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Redirecting..." : "Connect Google Calendar"}
            </Button>
          ) : (
            <div className="space-y-4">
              {!calendarReady && (
                <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300">
                  Your Google account is linked but hasn&rsquo;t granted
                  calendar access. Reconnect to enable sync.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  isDisabled={busy}
                  onPress={handleConnect}
                  className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Reconnect
                </Button>
                <Button
                  type="button"
                  isDisabled={busy}
                  onPress={handleDisconnect}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? "Working..." : "Disconnect"}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Reconnect re-grants access if calendar sync stops working;
                disconnecting stops all syncing.
              </p>
            </div>
          )}
        </div>
      </Card>
    </main>
  );
}
