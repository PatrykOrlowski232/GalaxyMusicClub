import type { Metadata } from "next";
import { PromoterDashboard } from "@/components/PromoterDashboard";
import { PromoterRanking } from "@/components/PromoterRanking";
import { getPromoterCommissionPercent } from "@/lib/promoter";

export const metadata: Metadata = {
  title: "Promotorzy",
  description:
    "Program promotorski Galaxy Music Club — własny link i QR, sprzedaż biletów oraz prowizja na portfel.",
  alternates: { canonical: "/promotorzy" },
};

export default function PromotersPage() {
  const pct = getPromoterCommissionPercent();

  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
          Program
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-wide">
          System promotorski
        </h1>
        <p className="mt-4 max-w-2xl text-galaxy-muted">
          Wygeneruj QR, wydrukuj go i prowadź sprzedaż biletów. Po udanej płatności
          dostajesz {pct}% na swoje konto promotora.
        </p>

        <div className="mt-10 grid gap-4 border border-white/10 p-6 text-sm text-galaxy-muted sm:grid-cols-3">
          <p>
            <span className="block text-white">1. QR</span>
            Twój unikalny kod i kod QR do druku.
          </p>
          <p>
            <span className="block text-white">2. Sprzedaż</span>
            Skan → wybór eventu → Stripe Checkout z Twoim ID.
          </p>
          <p>
            <span className="block text-white">3. Prowizja</span>
            {pct}% trafia na portfel po udanej transakcji.
          </p>
        </div>

        <div className="mt-16">
          <PromoterRanking />
        </div>

        <div className="mt-20">
          <PromoterDashboard />
        </div>
      </div>
    </div>
  );
}
