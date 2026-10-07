import type { Metadata } from "next";
import { EventsBrowse } from "@/components/EventsBrowse";
import { fetchClubEvents } from "@/lib/events";

export const metadata: Metadata = {
  title: "Eventy",
  description:
    "Kalendarz eventów Galaxy Music Club Gdańsk — techno, house i elektronika. Kup bilety online.",
  alternates: { canonical: "/eventy" },
};

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await fetchClubEvents();

  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
          Kalendarz
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-wide">
          Eventy
        </h1>
        <p className="mt-4 max-w-xl text-galaxy-muted">
          Wybierz miesiąc lub dzień z kalendarza, żeby zobaczyć noce w Galaxy.
        </p>

        <EventsBrowse events={events} />
      </div>
    </div>
  );
}
