import { INSTAGRAM_URL } from "@/data/social";
import type { ClubEvent } from "@/data/events";
import {
  DEFAULT_OG_IMAGE,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_FULL,
} from "@/lib/site";

const VENUE_ADDRESS = {
  "@type": "PostalAddress" as const,
  streetAddress: "Tkacka 9/10",
  addressLocality: "Gdańsk",
  addressCountry: "PL",
};

export function organizationJsonLd() {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "NightClub",
    name: SITE_NAME_FULL,
    alternateName: SITE_NAME,
    url: base,
    description: SITE_DESCRIPTION,
    image: `${base}${DEFAULT_OG_IMAGE}`,
    address: VENUE_ADDRESS,
    sameAs: [INSTAGRAM_URL],
  };
}

function eventStartIso(event: ClubEvent): string {
  if (event.startsAt) return event.startsAt;
  const time = event.time?.length === 5 ? `${event.time}:00` : event.time || "00:00:00";
  return `${event.date}T${time}`;
}

export function eventJsonLd(event: ClubEvent) {
  const base = getSiteUrl();
  const url = `${base}/eventy/${event.slug}`;
  const image = event.graphicUrl
    ? event.graphicUrl.startsWith("http")
      ? event.graphicUrl
      : `${base}${event.graphicUrl}`
    : `${base}${DEFAULT_OG_IMAGE}`;

  const offers =
    event.ticketLevels
      ?.filter((t) => t.price != null && t.price !== "")
      .map((t) => ({
        "@type": "Offer" as const,
        name: t.ticketType,
        price: String(t.price),
        priceCurrency: "PLN",
        url,
        availability:
          event.status === "wyprzedane"
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
      })) ?? [];

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description:
      event.description?.trim() ||
      `${event.title} w Galaxy Music Club Gdańsk`,
    startDate: eventStartIso(event),
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    url,
    image: [image],
    location: {
      "@type": "Place",
      name: SITE_NAME_FULL,
      address: VENUE_ADDRESS,
    },
    organizer: {
      "@type": "NightClub",
      name: SITE_NAME_FULL,
      url: base,
    },
    ...(offers.length ? { offers } : {}),
    ...(event.artists?.length
      ? {
          performer: event.artists.map((a) => ({
            "@type": "MusicGroup" as const,
            name: a.name,
          })),
        }
      : event.lineup?.length
        ? {
            performer: event.lineup.map((name) => ({
              "@type": "MusicGroup" as const,
              name,
            })),
          }
        : {}),
  };
}

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
) {
  const base = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${base}${item.path}`,
    })),
  };
}
