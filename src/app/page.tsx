import type { Metadata } from "next";
import Link from "next/link";
import { Hero } from "@/components/Hero";
import { SmartImage } from "@/components/SmartImage";
import { formatEventDate, getFeaturedEvent } from "@/data/events";
import { allowMockFallback, fetchClubEvents, getNearestUpcomingEvent } from "@/lib/events";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/social";
import { SITE_DESCRIPTION } from "@/lib/site";

export const metadata: Metadata = {
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const events = await fetchClubEvents();
  const featured =
    getNearestUpcomingEvent(events) ?? (allowMockFallback ? getFeaturedEvent() : null);

  return (
    <>
      <Hero />

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <h2 className="max-w-3xl font-[family-name:var(--font-condensed)] text-[clamp(2.75rem,8vw,5.25rem)] leading-[0.92] tracking-[0.02em] text-white uppercase">
          Dwa poziomy. Dwa
          <br />
          brzmienia. Jedna
          <br />
          noc na Starówce.
        </h2>
        <p className="mt-8 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          Wychodzisz z ekipą, a każdy słucha czegoś innego? W sobotę nie musicie
          się dogadywać — na dole dyskoteka i przeboje, na górze elektronika,
          wejście to samo. W czwartek i piątek gra sam parter. Tkacka 9/10, od
          21:30.
        </p>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block text-sm tracking-wider text-galaxy-pink transition hover:text-white"
        >
          Śledź nas na Instagramie · {INSTAGRAM_HANDLE} →
        </a>
      </section>

      {!featured ? (
        <section className="border-y border-white/10 bg-galaxy-void/80">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
              Najbliższy event
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
              Nowe eventy już wkrótce
            </h2>
            <Link
              href="/eventy"
              className="mt-8 inline-block border border-white/20 px-6 py-3 text-sm tracking-wider text-white transition hover:border-galaxy-magenta hover:text-galaxy-pink"
            >
              Kalendarz eventów
            </Link>
          </div>
        </section>
      ) : (
      <section className="border-y border-white/10 bg-galaxy-void/80">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
              Najbliższy event
            </p>
            <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl tracking-wide sm:text-4xl">
              {featured.title}
            </h2>
            <p className="mt-3 text-sm text-galaxy-muted">
              {formatEventDate(featured.date)} · {featured.time}
            </p>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-galaxy-muted">
              {featured.description}
            </p>
            <Link
              href={`/eventy/${featured.slug}`}
              className="galaxy-glow mt-8 inline-block bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink"
            >
              Kup bilet
            </Link>
          </div>
          {featured.graphicUrl ? (
            <div className="relative overflow-hidden border border-white/10 bg-[#0a0614]">
              <SmartImage
                src={featured.graphicUrl}
                alt={featured.title}
                width={1200}
                height={900}
                className="block h-auto w-full"
                sizes="(max-width: 768px) 100vw, 560px"
                preload
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 to-transparent p-6">
                <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.25em] text-white/80">
                  {featured.lineup.slice(0, 2).join(" · ")}
                </p>
              </div>
            </div>
          ) : (
            <div
              className="relative min-h-56 overflow-hidden border border-white/10"
              style={{
                background:
                  "radial-gradient(circle at 40% 40%, rgba(233,30,140,0.35), transparent 55%), radial-gradient(circle at 70% 60%, rgba(43,76,255,0.3), transparent 50%), #0a0614",
              }}
            >
              <div className="absolute inset-0 flex items-end p-6">
                <p className="font-[family-name:var(--font-display)] text-sm tracking-[0.25em] text-white/80">
                  {featured.lineup.slice(0, 2).join(" · ")}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Dołącz</p>
        <h2 className="mt-4 max-w-2xl font-[family-name:var(--font-display)] text-3xl tracking-wide">
          Konto gościa i program promotorski
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-galaxy-muted">
          Załóż konto, śledź eventy i — jeśli chcesz — zarabiaj za
          zaproszonych gości w systemie promotorskim.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/konto"
            className="galaxy-glow bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink"
          >
            Załóż konto
          </Link>
          <Link
            href="/promotorzy"
            className="border border-white/20 px-6 py-3 text-sm tracking-wider text-white transition hover:border-galaxy-magenta hover:text-galaxy-pink"
          >
            Program promotorski
          </Link>
        </div>
      </section>
    </>
  );
}
