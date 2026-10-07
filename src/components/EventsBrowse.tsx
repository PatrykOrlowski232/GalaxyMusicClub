"use client";

import { useMemo, useState } from "react";
import { EventCard } from "@/components/EventCard";
import type { ClubEvent } from "@/data/events";
import { nowWallClock } from "@/lib/datetime";

const WEEKDAYS = ["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"] as const;

function eventDayKey(event: ClubEvent): string {
  return event.date; // YYYY-MM-DD
}

function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat("pl-PL", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month, 1)));
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** 0=Mon … 6=Sun */
function mondayFirstWeekday(year: number, month: number, day: number): number {
  const sun0 = new Date(Date.UTC(year, month, day)).getUTCDay();
  return (sun0 + 6) % 7;
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

function initialMonth(events: ClubEvent[]): { year: number; month: number } {
  const now = nowWallClock();
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const hasThisMonth = events.some((e) => {
    const [ey, em] = e.date.split("-").map(Number);
    return ey === y && em === m + 1;
  });
  if (hasThisMonth || !events.length) return { year: y, month: m };

  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = sorted.find((e) => e.date >= toKey(y, m, now.getUTCDate()));
  const pick = upcoming ?? sorted[sorted.length - 1]!;
  const [ey, em] = pick.date.split("-").map(Number);
  return { year: ey!, month: em! - 1 };
}

export function EventsBrowse({ events }: { events: ClubEvent[] }) {
  const start = initialMonth(events);
  const [year, setYear] = useState(start.year);
  const [month, setMonth] = useState(start.month);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const byDay = useMemo(() => {
    const map = new Map<string, ClubEvent[]>();
    for (const event of events) {
      const key = eventDayKey(event);
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const monthEvents = useMemo(() => {
    const prefix = `${year}-${pad2(month + 1)}-`;
    return events
      .filter((e) => e.date.startsWith(prefix))
      .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  }, [events, year, month]);

  const visible = useMemo(() => {
    if (!selectedDay) return monthEvents;
    return monthEvents.filter((e) => e.date === selectedDay);
  }, [monthEvents, selectedDay]);

  const totalDays = daysInMonth(year, month);
  const lead = mondayFirstWeekday(year, month, 1);
  const cells: Array<{ day: number | null; key: string | null }> = [];
  for (let i = 0; i < lead; i++) cells.push({ day: null, key: null });
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, key: toKey(year, month, d) });
  }
  while (cells.length % 7 !== 0) cells.push({ day: null, key: null });

  function shiftMonth(delta: number) {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
    setSelectedDay(null);
  }

  function onDayClick(key: string) {
    const has = byDay.has(key);
    if (!has) {
      setSelectedDay(null);
      return;
    }
    setSelectedDay((prev) => (prev === key ? null : key));
  }

  const todayKey = (() => {
    const n = nowWallClock();
    return toKey(n.getUTCFullYear(), n.getUTCMonth(), n.getUTCDate());
  })();

  return (
    <div>
      <div className="mt-10 border border-white/10 bg-black/40 p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => shiftMonth(-1)}
            className="border border-white/20 px-3 py-2 text-sm tracking-wider text-white transition hover:border-galaxy-magenta hover:text-galaxy-pink"
            aria-label="Poprzedni miesiąc"
          >
            ←
          </button>
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-lg tracking-wide capitalize sm:text-xl">
              {monthLabel(year, month)}
            </p>
            <p className="mt-1 text-xs tracking-wider text-galaxy-muted uppercase">
              {monthEvents.length === 0
                ? "Brak eventów"
                : `${monthEvents.length} ${
                    monthEvents.length === 1
                      ? "event"
                      : monthEvents.length < 5
                        ? "eventy"
                        : "eventów"
                  }`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => shiftMonth(1)}
            className="border border-white/20 px-3 py-2 text-sm tracking-wider text-white transition hover:border-galaxy-magenta hover:text-galaxy-pink"
            aria-label="Następny miesiąc"
          >
            →
          </button>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-1 text-center text-[11px] tracking-wider text-galaxy-muted uppercase sm:gap-2 sm:text-xs">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((cell, i) => {
            if (cell.day == null || !cell.key) {
              return <div key={`e-${i}`} className="aspect-square" />;
            }
            const dayEvents = byDay.get(cell.key) ?? [];
            const hasEvent = dayEvents.length > 0;
            const selected = selectedDay === cell.key;
            const isToday = cell.key === todayKey;

            return (
              <button
                key={cell.key}
                type="button"
                onClick={() => onDayClick(cell.key!)}
                disabled={!hasEvent}
                title={
                  hasEvent
                    ? dayEvents.map((e) => e.title).join(", ")
                    : undefined
                }
                className={[
                  "relative flex aspect-square flex-col items-center justify-center text-sm transition",
                  hasEvent
                    ? "cursor-pointer text-white hover:bg-galaxy-magenta/25"
                    : "cursor-default text-galaxy-muted/40",
                  selected
                    ? "bg-galaxy-magenta text-black hover:bg-galaxy-magenta"
                    : hasEvent
                      ? "bg-white/5"
                      : "",
                  isToday && !selected ? "ring-1 ring-galaxy-pink/60" : "",
                ].join(" ")}
              >
                <span className="font-[family-name:var(--font-display)] tabular-nums">
                  {cell.day}
                </span>
                {hasEvent ? (
                  <span
                    className={[
                      "mt-0.5 flex gap-0.5",
                      selected ? "opacity-90" : "",
                    ].join(" ")}
                    aria-hidden
                  >
                    {dayEvents.slice(0, 3).map((e) => (
                      <span
                        key={e.slug}
                        className={[
                          "size-1 rounded-full",
                          selected ? "bg-black" : "bg-galaxy-magenta",
                        ].join(" ")}
                      />
                    ))}
                  </span>
                ) : (
                  <span className="mt-0.5 size-1" aria-hidden />
                )}
              </button>
            );
          })}
        </div>

        {selectedDay ? (
          <p className="mt-4 text-center text-xs text-galaxy-muted">
            Filtr dnia:{" "}
            <span className="text-galaxy-pink">{selectedDay}</span>
            {" · "}
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className="underline transition hover:text-white"
            >
              pokaż cały miesiąc
            </button>
          </p>
        ) : null}
      </div>

      <div className="mt-12">
        {visible.length === 0 ? (
          <p className="border-t border-white/10 py-10 text-sm text-galaxy-muted">
            Brak eventów w wybranym okresie.
          </p>
        ) : (
          visible.map((event) => <EventCard key={event.slug} event={event} />)
        )}
      </div>
    </div>
  );
}
