"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useMockAuth";
import { PromoterQrCard } from "@/components/PromoterQrCard";

type Dashboard = {
  walletId: number;
  code: string;
  balance: number;
  bankAccount: string | null;
  bankAccountHolder: string | null;
  checkIns: number;
  referrals: number;
  commissionPercent: number;
  recentTickets: Array<{
    id: number;
    number: string;
    price: string;
    isRealized: boolean;
    createdAt: string;
    eventId: number;
  }>;
  recentPayouts: Array<{
    id: number;
    amount: number;
    bankAccount: string;
    status: string;
    createdAt: string;
  }>;
};

export function PromoterDashboard() {
  const { user, refresh } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [salesUrl, setSalesUrl] = useState("");
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.roles.includes("Promotor")) {
      setDashboard(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promoters/me", { credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Błąd pobierania panelu.");
        setDashboard(null);
      } else {
        const dash = data.dashboard as Dashboard;
        setDashboard(dash);
        if (dash.bankAccount) setBankAccount(dash.bankAccount);
        if (dash.bankAccountHolder) setBankHolder(dash.bankAccountHolder);
        if (!payoutAmount && dash.balance > 0) {
          setPayoutAmount(dash.balance.toFixed(2));
        }
      }
    } catch {
      setError("Baza / API niedostępne.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (dashboard?.code) {
      setSalesUrl(`${window.location.origin}/p/${dashboard.code}`);
    }
  }, [dashboard?.code]);

  async function activate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/promoters/me", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się aktywować.");
      } else {
        setDashboard(data.dashboard as Dashboard);
        await refresh();
      }
    } catch {
      setError("Baza / API niedostępne.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    if (!salesUrl) return;
    try {
      await navigator.clipboard.writeText(salesUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  async function submitPayout() {
    setPayoutMsg(null);
    setError(null);
    const amount = Number(payoutAmount.replace(",", "."));
    if (!(amount > 0)) {
      setError("Podaj kwotę wypłaty.");
      return;
    }
    if (!bankAccount.trim()) {
      setError("Podaj numer konta bankowego / IBAN.");
      return;
    }

    setPayoutBusy(true);
    try {
      const res = await fetch("/api/promoters/payout", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          bankAccount,
          bankAccountHolder: bankHolder || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Wypłata nie powiodła się.");
        return;
      }
      setPayoutMsg(
        data.message ??
          "Wniosek przyjęty. Środki trafią na konto w ciągu 3 dni roboczych.",
      );
      setPayoutOpen(false);
      await load();
    } catch {
      setError("Baza / API niedostępne.");
    } finally {
      setPayoutBusy(false);
    }
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="text-galaxy-muted">
          Zaloguj się, aby wygenerować QR sprzedaży i otworzyć portfel promotora.
        </p>
        <Link
          href="/konto"
          className="galaxy-glow mt-6 inline-block bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black"
        >
          Przejdź do konta
        </Link>
      </div>
    );
  }

  if (!user.roles.includes("Promotor")) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="text-galaxy-muted">
          Aktywacja tworzy unikalny kod, QR do druku i portfel. Po sprzedaży biletów
          z Twojego QR dostajesz prowizję procentową.
        </p>
        {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        <button
          type="button"
          onClick={() => void activate()}
          disabled={loading}
          className="galaxy-glow mt-6 bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black disabled:opacity-60"
        >
          {loading ? "Aktywacja…" : "Aktywuj i wygeneruj QR"}
        </button>
      </div>
    );
  }

  if (loading && !dashboard) {
    return <p className="text-sm text-galaxy-muted">Ładowanie panelu…</p>;
  }

  if (!dashboard) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="text-galaxy-muted">{error ?? "Brak danych portfela."}</p>
        <button
          type="button"
          onClick={() => void activate()}
          className="galaxy-glow mt-6 bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black"
        >
          Utwórz portfel i QR
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Panel promotora</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-wide">
        {user.email}
      </h2>
      <p className="mt-2 text-sm text-galaxy-muted">
        Prowizja: {dashboard.commissionPercent}% od każdej udanej sprzedaży z Twoim QR /
        kodem.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {[
          { label: "Saldo (PLN)", value: dashboard.balance.toFixed(2) },
          { label: "Wejścia", value: dashboard.checkIns },
          { label: "Sprzedaże", value: dashboard.referrals },
        ].map((stat) => (
          <div key={stat.label} className="border border-white/10 px-5 py-6">
            <p className="text-xs tracking-wider text-galaxy-muted uppercase">{stat.label}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-3xl text-white">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 border border-white/10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-wider text-galaxy-muted uppercase">Portfel</p>
            <p className="mt-2 text-sm text-galaxy-muted">
              Wypłata na konto bankowe — środki w ciągu{" "}
              <span className="text-white">3 dni roboczych</span>.
            </p>
          </div>
          <button
            type="button"
            disabled={dashboard.balance <= 0}
            onClick={() => {
              setPayoutOpen((v) => !v);
              setError(null);
              setPayoutMsg(null);
              if (!payoutAmount && dashboard.balance > 0) {
                setPayoutAmount(dashboard.balance.toFixed(2));
              }
            }}
            className="galaxy-glow bg-white px-5 py-2.5 text-sm font-semibold tracking-wider text-black disabled:opacity-40"
          >
            {payoutOpen ? "Anuluj" : "Wypłać"}
          </button>
        </div>

        {payoutMsg ? (
          <p className="mt-4 text-sm text-galaxy-pink">{payoutMsg}</p>
        ) : null}

        {payoutOpen ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm sm:col-span-1">
              <span className="text-galaxy-muted">Kwota (PLN)</span>
              <input
                type="number"
                min={0.01}
                step="0.01"
                max={dashboard.balance}
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-galaxy-muted">Imię i nazwisko / nazwa na koncie</span>
              <input
                value={bankHolder}
                onChange={(e) => setBankHolder(e.target.value)}
                className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
                placeholder="Jan Kowalski"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm sm:col-span-2">
              <span className="text-galaxy-muted">Numer konta / IBAN</span>
              <input
                required
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
                placeholder="PL00 0000 0000 0000 0000 0000 0000"
              />
            </label>
            <p className="sm:col-span-2 text-xs text-galaxy-muted">
              Po zatwierdzeniu saldo zostanie pomniejszone. Przelew realizujemy w ciągu 3
              dni roboczych na podane konto.
            </p>
            <button
              type="button"
              disabled={payoutBusy}
              onClick={() => void submitPayout()}
              className="galaxy-glow w-fit bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black disabled:opacity-60"
            >
              {payoutBusy ? "Wysyłanie…" : "Zatwierdź wypłatę"}
            </button>
          </div>
        ) : null}

        {dashboard.recentPayouts?.length ? (
          <ul className="mt-6 divide-y divide-white/10 border-t border-white/10">
            {dashboard.recentPayouts.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap justify-between gap-2 py-3 text-sm text-galaxy-muted"
              >
                <span>
                  #{p.id} · {p.amount.toFixed(2)} PLN · {p.bankAccount}
                </span>
                <span className="uppercase tracking-wider text-galaxy-pink">
                  {p.status}
                </span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="mt-10 border border-white/10 p-6">
        <p className="text-xs tracking-wider text-galaxy-muted uppercase">Twój kod</p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-[0.3em] text-galaxy-pink">
          {dashboard.code}
        </p>
        <p className="mt-4 break-all text-sm text-galaxy-muted">{salesUrl || `/p/${dashboard.code}`}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void copyLink()}
            disabled={!salesUrl}
            className="border border-white/20 px-4 py-2 text-sm tracking-wider transition hover:border-galaxy-magenta hover:text-galaxy-pink disabled:opacity-50"
          >
            {copied ? "Skopiowano" : "Kopiuj link sprzedaży"}
          </button>
          {salesUrl ? (
            <Link
              href={salesUrl}
              target="_blank"
              className="border border-white/20 px-4 py-2 text-sm tracking-wider transition hover:border-galaxy-magenta hover:text-galaxy-pink"
            >
              Otwórz landing
            </Link>
          ) : null}
        </div>
      </div>

      {salesUrl ? (
        <div className="mt-10">
          <PromoterQrCard
            code={dashboard.code}
            salesUrl={salesUrl}
            commissionPercent={dashboard.commissionPercent}
          />
        </div>
      ) : null}

      <div className="mt-10">
        <h3 className="font-[family-name:var(--font-display)] text-lg tracking-wide">
          Bilety sprzedane z Twoim kodem
        </h3>
        <ul className="mt-4 divide-y divide-white/10 border-t border-white/10">
          {dashboard.recentTickets.length === 0 ? (
            <li className="py-4 text-sm text-galaxy-muted">
              Brak sprzedaży — wydrukuj QR i udostępnij go gościom.
            </li>
          ) : (
            dashboard.recentTickets.map((ticket) => (
              <li key={ticket.id} className="flex justify-between gap-4 py-4 text-sm">
                <span>{ticket.number}</span>
                <span className="text-galaxy-muted">
                  event #{ticket.eventId} · {ticket.price} zł
                  {ticket.isRealized ? " · zrealizowany" : ""}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
