"use client";

import { useCallback, useEffect, useState } from "react";

type RankRow = {
  rank: number;
  userId: number;
  code: string;
  ticketsSold: number;
  ticketsValue: number;
  earnings: number;
};

type Period = "month" | "year";

function money(n: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
  }).format(n);
}

export function PromoterRanking() {
  const [period, setPeriod] = useState<Period>("month");
  const [label, setLabel] = useState("");
  const [rows, setRows] = useState<RankRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/promoters/ranking?period=${p}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Błąd rankingu.");
        setRows([]);
        return;
      }
      setRows(data.rows ?? []);
      setLabel(data.label ?? "");
    } catch {
      setError("Nie udało się pobrać rankingu.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(period);
  }, [load, period]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
            Ranking
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide">
            Ranking promotorów
          </h2>
          <p className="mt-2 text-sm text-galaxy-muted">
            {label ? `Okres: ${label}` : "Sprzedane bilety, kod i zarobiona prowizja."}
          </p>
        </div>

        <div className="flex gap-1 border border-white/15 p-1">
          {(
            [
              { id: "month" as const, label: "Miesiąc" },
              { id: "year" as const, label: "Rok" },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setPeriod(tab.id)}
              className={`px-4 py-1.5 text-xs tracking-wider uppercase transition ${
                period === tab.id
                  ? "bg-white text-black"
                  : "text-galaxy-muted hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-galaxy-muted">Ładowanie rankingu…</p>
      ) : error ? (
        <p className="mt-8 text-sm text-rose-300">{error}</p>
      ) : rows.length === 0 ? (
        <p className="mt-8 text-sm text-galaxy-muted">
          Brak sprzedaży w tym okresie.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto border-y border-white/10">
          <table className="w-full min-w-[32rem] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs tracking-wider text-galaxy-muted uppercase">
                <th className="py-3 pr-4 font-normal">#</th>
                <th className="py-3 pr-4 font-normal">Kod</th>
                <th className="py-3 pr-4 font-normal">Bilety</th>
                <th className="py-3 pr-4 font-normal">Obrót</th>
                <th className="py-3 font-normal">Zarobek</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.userId} className="border-b border-white/5">
                  <td className="py-4 pr-4 font-[family-name:var(--font-display)] text-galaxy-pink">
                    {row.rank}
                  </td>
                  <td className="py-4 pr-4 tracking-[0.2em] text-white">
                    {row.code}
                  </td>
                  <td className="py-4 pr-4 text-white">{row.ticketsSold}</td>
                  <td className="py-4 pr-4 text-galaxy-muted">
                    {money(row.ticketsValue)}
                  </td>
                  <td className="py-4 text-galaxy-pink">{money(row.earnings)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-4 text-xs text-galaxy-muted">
        Zarobek = prowizja zapisana na portfelu. Obrót = suma cen sprzedanych biletów.
        Sortowanie: liczba biletów, potem zarobek.
      </p>
    </div>
  );
}
