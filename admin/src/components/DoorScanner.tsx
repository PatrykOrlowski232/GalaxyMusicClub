"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useMockAuth";
import { hasDoorRole } from "@/lib/roles";

type Result = {
  message: string;
  alreadyRealized?: boolean;
  ticket?: {
    number: string;
    eventId: number;
    id: number;
  };
};

export function DoorScanner() {
  const { user, ready, login } = useAuth();
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const canScan = hasDoorRole(user);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    setError(null);
    setResult(null);
    const code = number.trim();
    if (!code) {
      setError("Wpisz lub wklej numer biletu.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/door/check-in", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: code }),
      });
      const data = (await res.json()) as {
        error?: string;
        message?: string;
        ticket?: Result["ticket"] & { alreadyRealized?: boolean };
      };
      if (!res.ok) {
        setError(data.error ?? "Błąd skanowania.");
        return;
      }
      setResult({
        message: data.message ?? "OK",
        alreadyRealized: data.ticket?.alreadyRealized,
        ticket: data.ticket,
      });
      setNumber("");
    } catch {
      setError("Brak połączenia.");
    } finally {
      setBusy(false);
    }
  }

  async function onLogin(e: FormEvent) {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError(null);
    const resultLogin = await login(email.trim(), password);
    setLoginBusy(false);
    if (!resultLogin.ok) setLoginError(resultLogin.error);
  }

  if (!ready) {
    return <p className="text-sm text-galaxy-muted">Ładowanie…</p>;
  }

  if (!user) {
    return (
      <form onSubmit={onLogin} className="mx-auto max-w-md space-y-4">
        <p className="text-sm text-galaxy-muted">
          Zaloguj się kontem staff (Admin, Owner, Barman lub Manager).
        </p>
        <label className="flex flex-col gap-1 text-xs text-galaxy-muted">
          E-mail
          <input
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-galaxy-magenta"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-galaxy-muted">
          Hasło
          <input
            className="border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-galaxy-magenta"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {loginError ? <p className="text-sm text-rose-300">{loginError}</p> : null}
        <button
          type="submit"
          disabled={loginBusy}
          className="galaxy-glow w-full bg-white px-4 py-3 text-sm font-semibold tracking-wider text-black disabled:opacity-50"
        >
          {loginBusy ? "Logowanie…" : "Zaloguj"}
        </button>
      </form>
    );
  }

  if (!canScan) {
    return (
      <p className="text-sm text-galaxy-muted">
        Brak uprawnień skanera (wymagane: Admin, Owner, Barman lub Manager).
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <form onSubmit={(e) => void submit(e)} className="space-y-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">Numer biletu</span>
          <input
            autoFocus
            value={number}
            onChange={(e) => setNumber(e.target.value.toUpperCase())}
            placeholder="GLX-…"
            className="border border-white/15 bg-black/40 px-4 py-4 font-[family-name:var(--font-display)] text-xl tracking-wider text-white outline-none focus:border-galaxy-magenta"
            autoComplete="off"
            inputMode="text"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="galaxy-glow w-full bg-white px-6 py-4 text-sm font-semibold tracking-wider text-black disabled:opacity-50"
        >
          {busy ? "Sprawdzanie…" : "Zrealizuj wejście"}
        </button>
      </form>

      {error ? (
        <p className="mt-6 border border-rose-400/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </p>
      ) : null}

      {result ? (
        <div
          className={[
            "mt-6 border px-4 py-4 text-sm",
            result.alreadyRealized
              ? "border-amber-400/40 bg-amber-500/10 text-amber-100"
              : "border-emerald-400/40 bg-emerald-500/10 text-emerald-100",
          ].join(" ")}
        >
          <p className="font-semibold tracking-wider uppercase">
            {result.alreadyRealized ? "Już zrealizowany" : "Wejście OK"}
          </p>
          <p className="mt-2">{result.message}</p>
          {result.ticket ? (
            <p className="mt-2 text-xs opacity-80">
              {result.ticket.number} · event #{result.ticket.eventId} · ticket #
              {result.ticket.id}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
