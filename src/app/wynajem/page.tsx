import type { Metadata } from "next";
import Link from "next/link";
import { VenueInquiryForm } from "@/components/VenueInquiryForm";
import { venuePackages } from "@/data/venue";
import { INSTAGRAM_URL } from "@/data/social";

export const metadata: Metadata = {
  title: "Wynajmij salę imprezową w sercu Gdańska",
  description:
    "Wynajem sali imprezowej Galaxy Music Club w Gdańsku — urodziny, firmówki i prywatne imprezy. Tkacka 9/10.",
  alternates: { canonical: "/wynajem" },
};

export default function VenueRentalPage() {
  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
          Galaxy · Gdańsk
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
          Wynajmij salę imprezową w sercu Gdańska
        </h1>
        <p className="mt-4 max-w-2xl text-galaxy-muted">
          Zarezerwuj Galaxy na imprezę specjalną — prywatną, firmową lub zamknięty
          event. Lokal: Tkacka 9/10, Gdańsk.
        </p>

        <div className="mt-12 grid gap-4 sm:grid-cols-3">
          {venuePackages.map((pack) => (
            <article key={pack.id} className="border border-white/10 px-5 py-6">
              <h2 className="font-[family-name:var(--font-display)] text-lg tracking-wide">
                {pack.title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-galaxy-muted">
                {pack.description}
              </p>
              <p className="mt-4 text-xs tracking-wider text-galaxy-pink uppercase">
                {pack.capacity}
              </p>
              <p className="mt-1 text-sm text-galaxy-muted">{pack.fromPrice}</p>
            </article>
          ))}
        </div>

        <section className="mt-16 border-y border-white/10 py-12">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
            Co możesz dostać
          </h2>
          <ul className="mt-6 grid gap-3 text-sm text-galaxy-muted sm:grid-cols-2">
            {[
              "System audio i oświetlenie klubowe",
              "Obsługa baru / open bar (opcjonalnie)",
              "Ochrona i recepcja",
              "Koordynacja techniczna eventu",
              "Możliwość brandingu przestrzeni",
              "Loże VIP w pakiecie (w zależności od daty)",
            ].map((item) => (
              <li key={item} className="border-l border-white/15 pl-4">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-16">
          <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
            Zapytanie o rezerwację
          </h2>
          <p className="mt-3 max-w-xl text-sm text-galaxy-muted">
            Podaj termin i typ imprezy — odezwiemy się z dostępnością i wyceną.
            Loże na regularne eventy klubowe rezerwujesz na stronie konkretnego{" "}
            <Link href="/eventy" className="text-galaxy-pink hover:underline">
              eventu
            </Link>
            .
          </p>
          <div className="mt-8 max-w-2xl">
            <VenueInquiryForm />
          </div>
          <p className="mt-6 text-sm text-galaxy-muted">
            Szybki kontakt:{" "}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-galaxy-pink hover:underline"
            >
              Instagram @galaxymusicclub
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
