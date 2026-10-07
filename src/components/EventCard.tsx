import Link from "next/link";
import {
  formatEventDate,
  statusLabel,
  type ClubEvent,
} from "@/data/events";

const statusStyles: Record<ClubEvent["status"], string> = {
  bilety: "text-galaxy-pink border-galaxy-magenta/40",
  guestlist: "text-sky-300 border-sky-400/40",
  wyprzedane: "text-galaxy-muted border-white/15",
};

export function EventCard({ event }: { event: ClubEvent }) {
  const floors = event.floors ?? [];
  const floorsCount = event.floorsCount ?? floors.length;

  return (
    <article className="group border-b border-white/10 py-8 first:border-t">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.25em] text-galaxy-muted uppercase">
            {formatEventDate(event.date)} · {event.time}
            {floorsCount > 0 ? ` · ${floorsCount} ${floorsCount === 1 ? "piętro" : "piętra"}` : ""}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide text-white sm:text-3xl">
            <Link href={`/eventy/${event.slug}`} className="transition hover:text-galaxy-pink">
              {event.title}
            </Link>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-galaxy-muted">{event.lineup.join(" · ")}</p>
          {floors.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-galaxy-muted">
              {floors.map((floor) => (
                <li key={floor.levelId}>
                  <span className="text-galaxy-pink">{floor.levelName}</span>
                  {floor.musicType ? (
                    <span> · {floor.musicType}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : event.musicType ? (
            <p className="mt-3 text-xs text-galaxy-muted">Styl: {event.musicType}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`border px-3 py-1 text-xs tracking-wider uppercase ${statusStyles[event.status]}`}
          >
            {statusLabel(event.status)}
          </span>
          <Link
            href={`/eventy/${event.slug}`}
            className="galaxy-glow bg-white px-5 py-2.5 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink"
          >
            {event.status === "wyprzedane" ? "Szczegóły" : "Kup bilet"}
          </Link>
        </div>
      </div>
    </article>
  );
}
