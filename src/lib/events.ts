import { listEvents, getEventById, type ApiEvent } from "@/server/queries";
import {
  events as mockEvents,
  getEventBySlug as getMockBySlug,
  type ClubEvent,
} from "@/data/events";
import { eventWallDate, eventWallTime, nowWallClock } from "@/lib/datetime";

function apiToClubEvent(event: ApiEvent): ClubEvent {
  const date = eventWallDate(event.startsAt);
  const time = eventWallTime(event.startsAt);

  return {
    slug: event.slug,
    title: event.title,
    date,
    time,
    lineup: event.lineup.length ? event.lineup : ["Lineup TBA"],
    artists: event.artists,
    description: event.description ?? "",
    status: event.status,
    venue: "Galaxy Music Club, Gdańsk · Tkacka 9/10",
    featured: false,
    id: event.id,
    startsAt: event.startsAt,
    graphicUrl: event.graphicUrl,
    floors: event.floors,
    floorsCount: event.floorsCount,
    musicType: event.musicType,
    ticketLevels: event.ticketLevels,
  };
}

/** Najbliższy nadchodzący event (po dacie startu). */
export function getNearestUpcomingEvent(events: ClubEvent[]): ClubEvent | null {
  if (!events.length) return null;
  const now = nowWallClock().getTime();

  const withTime = events
    .map((e) => ({
      event: e,
      at: e.startsAt
        ? new Date(e.startsAt).getTime()
        : e.date
          ? new Date(`${e.date}T${e.time || "00:00"}:00Z`).getTime()
          : NaN,
    }))
    .filter((x) => Number.isFinite(x.at));

  const upcoming = withTime
    .filter((x) => x.at >= now)
    .sort((a, b) => a.at - b.at);

  if (upcoming[0]) return upcoming[0].event;

  // Wszystkie w przeszłości — pokaż najpóźniejszy
  return withTime.sort((a, b) => b.at - a.at)[0]?.event ?? events[0] ?? null;
}

/** Dane demo tylko w dev — na produkcji awaria bazy nie może udawać prawdziwych eventów. */
export const allowMockFallback = process.env.NODE_ENV !== "production";

export async function fetchClubEvents(): Promise<ClubEvent[]> {
  try {
    const rows = await listEvents();
    if (rows.length || !allowMockFallback) return rows.map(apiToClubEvent);
  } catch (error) {
    if (!allowMockFallback) {
      console.error("fetchClubEvents:", error);
      return [];
    }
  }
  return mockEvents;
}

export async function fetchClubEvent(slug: string): Promise<ClubEvent | null> {
  const id = Number(slug);
  if (Number.isFinite(id) && id > 0) {
    try {
      const row = await getEventById(id);
      if (row) return apiToClubEvent(row);
    } catch (error) {
      if (!allowMockFallback) {
        console.error("fetchClubEvent:", error);
        return null;
      }
    }
  }
  return allowMockFallback ? (getMockBySlug(slug) ?? null) : null;
}
