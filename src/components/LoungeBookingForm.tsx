"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useMockAuth";
import { formatPln, LOUNGE_DEPOSIT_RATE } from "@/lib/lounges";
import { formatEventDateTimePl } from "@/lib/datetime";

type Lounge = {
  id: number;
  name: string;
  levelName: string;
  price: number;
  depositAmount: number;
  available: boolean;
};

type EventOption = {
  id: number;
  title: string;
  startsAt: string;
};

export type LoungeBookingPreset = {
  id: number;
  title: string;
  startsAt?: string;
};

function formatEventLabel(event: EventOption) {
  try {
    return `${event.title} · ${formatEventDateTimePl(event.startsAt)}`;
  } catch {
    return event.title;
  }
}

export function LoungeBookingForm({
  presetEvent,
  compact,
}: {
  presetEvent?: LoungeBookingPreset;
  /** Ukrywa krok wyboru eventu (np. na stronie eventu). */
  compact?: boolean;
} = {}) {
  const locked = !!presetEvent;
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(locked ? 2 : 1);
  const [events, setEvents] = useState<EventOption[]>(
    presetEvent
      ? [
          {
            id: presetEvent.id,
            title: presetEvent.title,
            startsAt: presetEvent.startsAt ?? "",
          },
        ]
      : [],
  );
  const [eventId, setEventId] = useState(presetEvent ? String(presetEvent.id) : "");
  const [lounges, setLounges] = useState<Lounge[]>([]);
  const [loungeId, setLoungeId] = useState<number | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(!locked);
  const [loadingLounges, setLoadingLounges] = useState(!!locked);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = lounges.find((l) => l.id === loungeId);

  useEffect(() => {
    if (locked) return;
    void (async () => {
      setLoadingEvents(true);
      try {
        const res = await fetch("/api/events");
        if (!res.ok) throw new Error("events");
        const data = await res.json();
        const opts = (data.events ?? []).map(
          (e: { id: number; title: string; startsAt: string }) => ({
            id: e.id,
            title: e.title,
            startsAt: e.startsAt,
          }),
        );
        setEvents(opts);
      } catch {
        setError("Nie udało się pobrać eventów.");
      } finally {
        setLoadingEvents(false);
      }
    })();
  }, [locked]);

  async function loadAvailability(selectedEventId: string) {
    setLoadingLounges(true);
    setError(null);
    setLoungeId(null);
    try {
      const res = await fetch(`/api/lounges?eventId=${selectedEventId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Błąd lóż");
      setLounges(
        (data.lounges ?? []).map(
          (l: Lounge & { price: number | string; depositAmount?: number }) => {
            const price = Number(l.price);
            return {
              ...l,
              price,
              depositAmount: l.depositAmount ?? price * LOUNGE_DEPOSIT_RATE,
            };
          },
        ),
      );
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nie udało się sprawdzić dostępności.");
      setLounges([]);
    } finally {
      setLoadingLounges(false);
    }
  }

  useEffect(() => {
    if (!presetEvent) return;
    setEventId(String(presetEvent.id));
    setEvents([
      {
        id: presetEvent.id,
        title: presetEvent.title,
        startsAt: presetEvent.startsAt ?? "",
      },
    ]);
    void loadAvailability(String(presetEvent.id));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per preset event
  }, [presetEvent?.id]);

  async function reserve() {
    setError(null);
    if (!user) {
      setError("Zaloguj się, aby złożyć rezerwację.");
      return;
    }
    if (!eventId || !loungeId) {
      setError("Wybierz event i wolną lożę.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/lounges/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          loungeId,
          eventId: Number(eventId),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Rezerwacja nie powiodła się.");
        await loadAvailability(eventId);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      setError("Brak URL płatności zaliczki.");
    } catch {
      setError("Baza / API niedostępne.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {!compact && !locked ? (
        <div className="flex gap-3 text-xs tracking-wider uppercase">
          <span className={step === 1 ? "text-galaxy-pink" : "text-galaxy-muted"}>
            1. Event
          </span>
          <span className="text-white/20">/</span>
          <span className={step === 2 ? "text-galaxy-pink" : "text-galaxy-muted"}>
            2. Loża + zaliczka
          </span>
        </div>
      ) : null}

      <div className="space-y-2 text-sm text-galaxy-muted">
        <p>
          Rezerwacja wymaga wpłaty zaliczki{" "}
          <span className="text-white">{Math.round(LOUNGE_DEPOSIT_RATE * 100)}%</span> ceny
          loży (Stripe).
        </p>
        <p>
          Loża obejmuje <span className="text-white">darmowe wejście</span> dla gości loży.
          Cała kwota loży to saldo do wykorzystania <span className="text-white">na barze</span>{" "}
          w trakcie eventu.
        </p>
      </div>

      {!user ? (
        <p className="text-sm text-galaxy-muted">
          Musisz być{" "}
          <Link href="/konto" className="text-galaxy-pink hover:underline">
            zalogowany
          </Link>
          , żeby dokończyć rezerwację.
        </p>
      ) : null}

      {step === 1 && !locked ? (
        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-galaxy-muted">Wybierz event</span>
            <select
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={loadingEvents}
              className="border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta"
            >
              <option value="">
                {loadingEvents ? "Ładowanie…" : "— wybierz —"}
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {formatEventLabel(event)}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="button"
            disabled={!eventId || loadingLounges}
            onClick={() => void loadAvailability(eventId)}
            className="galaxy-glow bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink disabled:opacity-60"
          >
            {loadingLounges ? "Sprawdzam loże…" : "Pokaż wolne loże"}
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="space-y-6">
          {!locked ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-galaxy-muted">
                Event:{" "}
                <span className="text-white">
                  {events.find((e) => String(e.id) === eventId)?.title ?? eventId}
                </span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setLoungeId(null);
                  setError(null);
                }}
                className="text-xs tracking-wider text-galaxy-pink hover:underline"
              >
                ← Zmień event
              </button>
            </div>
          ) : null}

          {loadingLounges ? (
            <p className="text-sm text-galaxy-muted">Ładowanie dostępności…</p>
          ) : lounges.length === 0 ? (
            <p className="text-sm text-galaxy-muted">Brak lóż w bazie.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {lounges.map((lounge) => {
                const isSelected = loungeId === lounge.id;
                const disabled = !lounge.available;
                return (
                  <button
                    key={lounge.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => setLoungeId(lounge.id)}
                    className={`border px-5 py-5 text-left transition ${
                      disabled
                        ? "cursor-not-allowed border-white/5 opacity-40"
                        : isSelected
                          ? "border-galaxy-magenta galaxy-glow"
                          : "border-white/10 hover:border-white/30"
                    }`}
                  >
                    <p className="font-[family-name:var(--font-display)] tracking-wide text-white">
                      {lounge.name}
                    </p>
                    <p className="mt-1 text-xs text-galaxy-muted">{lounge.levelName}</p>
                    <p className="mt-3 text-sm text-white">{formatPln(lounge.price)}</p>
                    <p className="mt-1 text-xs text-galaxy-muted">
                      Zaliczka {Math.round(LOUNGE_DEPOSIT_RATE * 100)}%:{" "}
                      {formatPln(lounge.depositAmount)}
                    </p>
                    <p
                      className={`mt-3 text-xs tracking-wider uppercase ${
                        lounge.available ? "text-galaxy-pink" : "text-galaxy-muted"
                      }`}
                    >
                      {lounge.available ? "Wolna" : "Zajęta"}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {selected ? (
            <p className="text-sm text-galaxy-muted">
              Do zapłaty teraz:{" "}
              <span className="text-white">{formatPln(selected.depositAmount)}</span>
              . Cała kwota loży ({formatPln(selected.price)}) = saldo na barze +
              darmowe wejście.
            </p>
          ) : null}

          {lounges.every((l) => !l.available) && lounges.length > 0 ? (
            <p className="text-sm text-galaxy-muted">
              Wszystkie loże na ten event są już zarezerwowane.
            </p>
          ) : null}

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <button
            type="button"
            disabled={!loungeId || submitting || !user}
            onClick={() => void reserve()}
            className="galaxy-glow bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink disabled:opacity-60"
          >
            {submitting
              ? "Przekierowuję do płatności…"
              : selected
                ? `Zapłać zaliczkę ${formatPln(selected.depositAmount)}`
                : "Zapłać zaliczkę i zarezerwuj"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
