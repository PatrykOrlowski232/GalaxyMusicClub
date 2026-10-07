"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useMockAuth";

type Mode = "login" | "register";

export function AuthForm() {
  const { login, register } = useAuth();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newsletter, setNewsletter] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const googleError = searchParams.get("google_error");
    if (googleError) setError(googleError);
  }, [searchParams]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result =
      mode === "login"
        ? await login(email, password)
        : await register(email, password, newsletter);

    setLoading(false);
    if (!result.ok) setError(result.error);
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 flex gap-6 border-b border-white/10">
        {(["login", "register"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setMode(tab);
              setError(null);
            }}
            className={`pb-3 text-sm tracking-wider uppercase transition ${
              mode === tab
                ? "border-b-2 border-galaxy-magenta text-white"
                : "text-galaxy-muted hover:text-white"
            }`}
          >
            {tab === "login" ? "Logowanie" : "Rejestracja"}
          </button>
        ))}
      </div>

      <a
        href="/api/auth/google"
        className="flex w-full items-center justify-center gap-3 border border-white/15 bg-black/40 px-6 py-3 text-sm tracking-wider text-white transition hover:border-galaxy-magenta hover:text-galaxy-pink"
      >
        <GoogleIcon />
        Kontynuuj z Google
      </a>

      <div className="my-6 flex items-center gap-3 text-xs tracking-wider text-galaxy-muted uppercase">
        <span className="h-px flex-1 bg-white/10" />
        lub e-mail
        <span className="h-px flex-1 bg-white/10" />
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">E-mail</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
            placeholder="ty@email.com"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">Hasło</span>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
            placeholder="••••••••"
          />
        </label>

        {mode === "register" ? (
          <label className="flex items-start gap-3 text-sm text-galaxy-muted">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="mt-0.5 size-4 accent-galaxy-magenta"
            />
            <span>
              Chcę newsletter Galaxy — zapis jest zgodą na otrzymywanie materiałów
              promocyjnych (można wypisać się później w koncie).
            </span>
          </label>
        ) : null}

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <button
          type="submit"
          disabled={loading}
          className="galaxy-glow mt-2 bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink disabled:opacity-60"
        >
          {loading
            ? "Proszę czekać…"
            : mode === "login"
              ? "Zaloguj się"
              : "Utwórz konto"}
        </button>
      </form>

      <p className="mt-6 text-xs text-galaxy-muted">
        Konta zapisują się w Galaxy DB. Hasła: Argon2id · Google OAuth łączy konto po
        e-mailu.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.2 5.2C39.2 37.2 44 32 44 24c0-1.3-.1-2.5-.4-3.5z"
      />
    </svg>
  );
}
