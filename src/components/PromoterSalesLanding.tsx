"use client";

import { useEffect } from "react";
import Link from "next/link";
import { PROMOTER_REF_STORAGE_KEY } from "@/lib/promoter";

type EventCard = {
  slug: string;
  title: string;
  date: string;
  time: string;
  status: string;
};

export function PromoterSalesLanding({
  code,
  events,
}: {
  code: string;
  events: EventCard[];
}) {
  useEffect(() => {
    try {
      localStorage.setItem(PROMOTER_REF_STORAGE_KEY, code.toUpperCase());
    } catch {
      // ignore
    }
  }, [code]);

  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto w-full max-w-2xl text-center">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
          Sprzedaż z kodem promotora
        </p>
        <h1 className="mt-5 font-[family-name:var(--font-display)] text-4xl tracking-[0.35em] text-galaxy-pink">
          {code}
        </h1>
        <p className="mx-auto mt-6 max-w-md text-galaxy-muted">
          Wybierz event i kup bilet — z tym kodem dostaniesz specjalną zniżkę.
        </p>

        <div className="mt-12 divide-y divide-white/10 border-y border-white/10 text-left">
          {events.length === 0 ? (
            <p className="py-6 text-sm text-galaxy-muted">Brak nadchodzących eventów.</p>
          ) : (
            events.map((event) => (
              <div
                key={event.slug}
                className="flex flex-col gap-3 py-6 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl tracking-wide">
                    {event.title}
                  </p>
                  <p className="mt-1 text-sm text-galaxy-muted">
                    {event.date} · {event.time}
                  </p>
                </div>
                <Link
                  href={`/eventy/${event.slug}?ref=${encodeURIComponent(code)}`}
                  className="galaxy-glow inline-block bg-white px-5 py-3 text-center text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink"
                >
                  Kup ze zniżką
                </Link>
              </div>
            ))
          )}
        </div>

        <p className="mt-8 text-xs text-galaxy-muted">
          Kod zapisujemy w tej przeglądarce, żeby zakup na eventach też był przypisany.
        </p>
      </div>
    </div>
  );
}
