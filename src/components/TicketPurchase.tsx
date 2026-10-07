"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useMockAuth";
import { PROMOTER_REF_STORAGE_KEY } from "@/lib/promoter";

export type PurchaseLevel = {
  id: number;
  ticketType: string;
  price: string;
  quantity: number | null;
};

export function TicketPurchase({
  levels,
  soldOut,
}: {
  levels: PurchaseLevel[];
  soldOut?: boolean;
}) {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const available = levels.filter((l) => l.quantity === null || l.quantity > 0);
  const [levelId, setLevelId] = useState(String(available[0]?.id ?? ""));
  const [quantity, setQuantity] = useState("1");
  const [promoterCode, setPromoterCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fromQuery = searchParams.get("ref")?.trim().toUpperCase();
    if (fromQuery) {
      setPromoterCode(fromQuery);
      try {
        localStorage.setItem(PROMOTER_REF_STORAGE_KEY, fromQuery);
      } catch {
        // ignore
      }
      return;
    }
    try {
      const stored = localStorage.getItem(PROMOTER_REF_STORAGE_KEY);
      if (stored) setPromoterCode(stored.toUpperCase());
    } catch {
      // ignore
    }
  }, [searchParams]);

  if (soldOut || available.length === 0) {
    return (
      <span className="border border-white/15 px-6 py-3 text-sm tracking-wider text-galaxy-muted">
        Wyprzedane
      </span>
    );
  }

  async function buy() {
    setError(null);
    if (!user) {
      setError("Zaloguj się, aby kupić bilet.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          eventTicketLevelId: Number(levelId),
          quantity: Number(quantity),
          promoterCode: promoterCode.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się rozpocząć płatności.");
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Brak URL płatności.");
    } catch {
      setError("Błąd połączenia z checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-4 border border-white/10 p-5">
      <p className="text-xs tracking-[0.25em] text-galaxy-pink uppercase">
        Stripe Checkout
      </p>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-galaxy-muted">Oferta</span>
        <select
          value={levelId}
          onChange={(e) => setLevelId(e.target.value)}
          className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
        >
          {available.map((level) => (
            <option key={level.id} value={level.id}>
              {level.ticketType} · {level.price} zł
              {level.quantity != null ? ` · ${level.quantity} szt.` : ""}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-galaxy-muted">Ilość</span>
        <input
          type="number"
          min={1}
          max={10}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
        />
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-galaxy-muted">Kod promotora</span>
        <input
          value={promoterCode}
          onChange={(e) => setPromoterCode(e.target.value.toUpperCase())}
          placeholder="12-znakowy kod"
          maxLength={12}
          autoComplete="off"
          className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
        />
        {promoterCode ? (
          <span className="text-xs text-galaxy-pink">
            Sprzedaż przypisana do: {promoterCode}
          </span>
        ) : null}
      </label>

      {!user ? (
        <p className="text-sm text-galaxy-muted">
          Musisz być{" "}
          <Link href="/konto" className="text-galaxy-pink hover:underline">
            zalogowany
          </Link>
          , żeby kupić bilet.
        </p>
      ) : null}

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="button"
        disabled={loading || !user}
        onClick={() => void buy()}
        className="galaxy-glow w-full bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink disabled:opacity-50"
      >
        {loading ? "Przekierowanie…" : "Kup bilet"}
      </button>
    </div>
  );
}
