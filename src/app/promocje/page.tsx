import type { Metadata } from "next";
import { promotions } from "@/data/promotions";

export const metadata: Metadata = {
  title: "Promocje",
  description:
    "Aktualne promocje i zniżki na wejście do Galaxy Music Club Gdańsk.",
  alternates: { canonical: "/promocje" },
};

export default function PromotionsPage() {
  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Oferta</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-wide">
          Promocje
        </h1>
        <p className="mt-4 max-w-xl text-galaxy-muted">
          Aktualne zniżki i specjalne wejścia. Szczegóły na recepcji i przy zakupie
          biletu.
        </p>

        <div className="mt-12 divide-y divide-white/10 border-y border-white/10">
          {promotions.map((promo) => (
            <article key={promo.id} className="py-8">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
                  {promo.title}
                </h2>
                <span className="border border-galaxy-magenta/40 px-2 py-0.5 text-xs tracking-wider text-galaxy-pink uppercase">
                  {promo.badge}
                </span>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-galaxy-muted">
                {promo.description}
              </p>
              <p className="mt-4 text-xs tracking-wider text-galaxy-muted uppercase">
                Ważne do {promo.validUntil}
              </p>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
