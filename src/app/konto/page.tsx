"use client";

import { Suspense } from "react";
import { AuthForm } from "@/components/AuthForm";
import { ProfilePanel } from "@/components/ProfilePanel";
import { useMockAuth } from "@/hooks/useMockAuth";

function AccountBody() {
  const { user, ready } = useMockAuth();

  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Konto</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-wide">
          {user ? "Twój profil" : "Zaloguj się lub dołącz"}
        </h1>
        <p className="mt-4 max-w-xl text-galaxy-muted">
          {user
            ? "Rezerwacje lóż, aktywne bilety i program promotorski."
            : "Załóż konto gościa Galaxy — e-mail lub Google."}
        </p>

        <div className="mt-12">
          {!ready ? (
            <p className="text-sm text-galaxy-muted">Ładowanie…</p>
          ) : user ? (
            <ProfilePanel />
          ) : (
            <AuthForm />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
          <p className="text-sm text-galaxy-muted">Ładowanie…</p>
        </div>
      }
    >
      <AccountBody />
    </Suspense>
  );
}
