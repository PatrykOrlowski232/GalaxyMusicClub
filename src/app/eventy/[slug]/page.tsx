import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { formatEventDate, statusLabel } from "@/data/events";
import { fetchClubEvent, fetchClubEvents } from "@/lib/events";
import { LoungeBookingForm } from "@/components/LoungeBookingForm";
import { TicketPurchase } from "@/components/TicketPurchase";
import { JsonLd } from "@/components/JsonLd";
import { SmartImage } from "@/components/SmartImage";
import { breadcrumbJsonLd, eventJsonLd } from "@/lib/jsonld";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchClubEvent(slug);
  if (!event) {
    return { title: "Event" };
  }

  const description =
    event.description?.trim() ||
    `${event.title} — ${formatEventDate(event.date)} · Galaxy Music Club Gdańsk`;

  const images = event.graphicUrl
    ? [{ url: event.graphicUrl, alt: event.title }]
    : undefined;

  return {
    title: event.title,
    description,
    alternates: { canonical: `/eventy/${event.slug}` },
    openGraph: {
      type: "website",
      title: event.title,
      description,
      url: `/eventy/${event.slug}`,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description,
      images: event.graphicUrl ? [event.graphicUrl] : undefined,
    },
  };
}

export async function generateStaticParams() {
  try {
    const events = await fetchClubEvents();
    return events.map((event) => ({ slug: event.slug }));
  } catch {
    return [];
  }
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await fetchClubEvent(slug);
  if (!event) notFound();

  const startIso =
    event.startsAt ??
    `${event.date}T${event.time?.length === 5 ? `${event.time}:00` : event.time || "00:00:00"}`;

  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <JsonLd data={eventJsonLd(event)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Strona główna", path: "/" },
          { name: "Eventy", path: "/eventy" },
          { name: event.title, path: `/eventy/${event.slug}` },
        ])}
      />

      <article className="mx-auto max-w-3xl">
        <Link
          href="/eventy"
          className="text-sm tracking-wider text-galaxy-muted transition hover:text-white"
        >
          ← Wszystkie eventy
        </Link>

        <p className="mt-10 text-xs tracking-[0.3em] text-galaxy-pink uppercase">
          <time dateTime={startIso}>
            {formatEventDate(event.date)} · {event.time}
          </time>
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-wide sm:text-5xl">
          {event.title}
        </h1>

        {event.graphicUrl ? (
          <div className="mt-8 inline-block max-w-full overflow-hidden border border-white/10 bg-black/40">
            <SmartImage
              src={event.graphicUrl}
              alt={event.title}
              width={1200}
              height={1600}
              className="block h-auto max-h-[70vh] w-auto max-w-full"
              sizes="(max-width: 768px) 100vw, 768px"
              preload
            />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-4 text-sm">
          <span className="border border-galaxy-magenta/40 px-3 py-1 tracking-wider text-galaxy-pink uppercase">
            {statusLabel(event.status)}
          </span>
          <span className="text-galaxy-muted">{event.venue}</span>
          {(event.floorsCount ?? event.floors?.length ?? 0) > 0 ? (
            <span className="text-galaxy-muted">
              {event.floorsCount ?? event.floors?.length}{" "}
              {(event.floorsCount ?? event.floors?.length) === 1
                ? "dostępne piętro"
                : "dostępne piętra"}
            </span>
          ) : null}
        </div>

        <p className="mt-10 text-base leading-relaxed text-galaxy-muted">
          {event.description}
        </p>

        {event.floors && event.floors.length > 0 ? (
          <div className="mt-12 border-t border-white/10 pt-8">
            <h2 className="font-[family-name:var(--font-display)] text-lg tracking-wide">
              Piętra i styl muzyczny
            </h2>
            <ul className="mt-6 space-y-5">
              {event.floors.map((floor) => (
                <li key={floor.levelId} className="border-l border-white/15 pl-4">
                  <p className="text-sm tracking-wider text-galaxy-pink uppercase">
                    {floor.levelName}
                  </p>
                  <p className="mt-1 text-base text-white">
                    {floor.musicType ?? "Styl TBA"}
                  </p>
                  {floor.lineup.length > 0 ? (
                    <p className="mt-1 text-sm text-galaxy-muted">
                      {floor.lineup.join(" · ")}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-12 border-t border-white/10 pt-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg tracking-wide">
            Lineup
          </h2>
          <ul className="mt-4 space-y-6">
            {(event.artists && event.artists.length > 0
              ? event.artists
              : event.lineup.map((name, i) => ({
                  id: i,
                  name,
                  info: null as string | null,
                  photoUrl: null as string | null,
                }))
            ).map((artist) => (
              <li key={artist.id} className="flex gap-4">
                {artist.photoUrl ? (
                  <SmartImage
                    src={artist.photoUrl}
                    alt={artist.name}
                    width={96}
                    height={96}
                    className="h-20 w-20 shrink-0 object-cover sm:h-24 sm:w-24"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center bg-white/5 text-xs tracking-wider text-galaxy-muted uppercase sm:h-24 sm:w-24">
                    DJ
                  </div>
                )}
                <div className="min-w-0 pt-0.5">
                  <p className="text-lg text-white">{artist.name}</p>
                  {artist.info ? (
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-galaxy-muted">
                      {artist.info}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 space-y-6 border-t border-white/10 pt-8">
          <h2 className="font-[family-name:var(--font-display)] text-lg tracking-wide">
            Bilety
          </h2>
          <Suspense
            fallback={<p className="text-sm text-galaxy-muted">Ładowanie oferty…</p>}
          >
            <TicketPurchase
              levels={event.ticketLevels ?? []}
              soldOut={event.status === "wyprzedane"}
            />
          </Suspense>
          <Link
            href="/promotorzy"
            className="inline-block text-sm tracking-wider text-galaxy-muted transition hover:text-galaxy-pink"
          >
            Masz kod promotora? Wpisz go przy zakupie →
          </Link>
        </div>

        {event.id ? (
          <div className="mt-12 space-y-6 border-t border-white/10 pt-8">
            <div>
              <h2 className="font-[family-name:var(--font-display)] text-lg tracking-wide">
                Rezerwacja loży
              </h2>
              <p className="mt-2 text-sm text-galaxy-muted">
                Wybierz wolną lożę na ten event i opłać 20% zaliczki online. Loża
                obejmuje darmowe wejście — cała kwota jest do wykorzystania na barze.
              </p>
            </div>
            <LoungeBookingForm
              compact
              presetEvent={{
                id: event.id,
                title: event.title,
                startsAt: event.startsAt,
              }}
            />
          </div>
        ) : (
          <div className="mt-12 border-t border-white/10 pt-8">
            <Link
              href="/loze"
              className="text-sm tracking-wider text-galaxy-pink hover:underline"
            >
              Zarezerwuj lożę →
            </Link>
          </div>
        )}
      </article>
    </div>
  );
}
