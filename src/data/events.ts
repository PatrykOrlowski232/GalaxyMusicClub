import { nowWallClock } from "@/lib/datetime";

export type EventStatus = "bilety" | "guestlist" | "wyprzedane";

export type EventArtist = {
  id: number;
  name: string;
  info: string | null;
  photoUrl?: string | null;
};

export type EventFloor = {
  levelId: number;
  levelName: string;
  musicType: string | null;
  lineup: string[];
};

export type ClubEvent = {
  slug: string;
  title: string;
  date: string;
  time: string;
  lineup: string[];
  artists?: EventArtist[];
  description: string;
  status: EventStatus;
  venue: string;
  featured?: boolean;
  id?: number;
  startsAt?: string;
  graphicUrl?: string | null;
  floors?: EventFloor[];
  floorsCount?: number;
  musicType?: string | null;
  ticketLevels?: Array<{
    id: number;
    ticketType: string;
    price: string;
    quantity: number | null;
  }>;
};

export const events: ClubEvent[] = [
  {
    slug: "neon-orbit",
    title: "Neon Orbit",
    date: "2026-10-11",
    time: "22:00",
    lineup: ["DJ Pulsar", "Luna Wave", "Kosmowave"],
    description:
      "Otwarcie sezonu jesiennego. Techno i progressive w kosmicznej scenerii — pełny system świetlny i late night sety.",
    status: "bilety",
    venue: "Galaxy Music Club, Gdańsk",
    featured: true,
  },
  {
    slug: "void-session",
    title: "Void Session",
    date: "2026-10-18",
    time: "23:00",
    lineup: ["Deep Drift", "Aether", "Night Frequency"],
    description:
      "Głębokie, hipnotyczne brzmienia. Minimal, deep techno i długie przejścia — noc dla tych, którzy zostają do końca.",
    status: "guestlist",
    venue: "Galaxy Music Club, Gdańsk",
  },
  {
    slug: "magenta-nights",
    title: "Magenta Nights",
    date: "2026-10-25",
    time: "22:30",
    lineup: ["Violet Circuit", "Nova", "Pulse Theory"],
    description:
      "House i melodic techno. Magenta lighting, laser show i specjalny guest z Berlina.",
    status: "bilety",
    venue: "Galaxy Music Club, Gdańsk",
  },
  {
    slug: "stellar-bass",
    title: "Stellar Bass",
    date: "2026-11-01",
    time: "22:00",
    lineup: ["Bass Nova", "Gravity", "Orbit Crew"],
    description:
      "Bass-heavy night: breaks, UK garage i club electronics. System audio podkręcony pod niskie częstotliwości.",
    status: "guestlist",
    venue: "Galaxy Music Club, Gdańsk",
  },
  {
    slug: "eclipse-party",
    title: "Eclipse Party",
    date: "2026-11-08",
    time: "21:00",
    lineup: ["Solar Flare", "Dark Matter", "Resonance"],
    description:
      "Halloween afterparty vibe — dark disco, electro i niespodzianki na parkiecie. Dress code: black & neon.",
    status: "wyprzedane",
    venue: "Galaxy Music Club, Gdańsk",
  },
  {
    slug: "galaxy-anniversary",
    title: "Galaxy Anniversary",
    date: "2026-11-15",
    time: "22:00",
    lineup: ["All Residents", "Special Guests"],
    description:
      "Urodziny klubu. Całonocny lineup residentów, open bar do północy dla early birds i niespodziewani goście.",
    status: "bilety",
    venue: "Galaxy Music Club, Gdańsk",
    featured: true,
  },
];

export function getEventBySlug(slug: string): ClubEvent | undefined {
  return events.find((event) => event.slug === slug);
}

export function getFeaturedEvent(): ClubEvent {
  const now = nowWallClock().getTime();
  const ranked = events
    .map((e) => ({
      event: e,
      at: e.startsAt
        ? new Date(e.startsAt).getTime()
        : new Date(`${e.date}T${e.time || "00:00"}:00Z`).getTime(),
    }))
    .sort((a, b) => a.at - b.at);
  const upcoming = ranked.filter((x) => x.at >= now);
  return upcoming[0]?.event ?? ranked[0]?.event ?? events[0];
}

export function formatEventDate(isoDate: string): string {
  // isoDate = YYYY-MM-DD (dzień ścienny eventu)
  return new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

export function statusLabel(status: EventStatus): string {
  switch (status) {
    case "bilety":
      return "Bilety";
    case "guestlist":
      return "Guestlist";
    case "wyprzedane":
      return "Wyprzedane";
  }
}
