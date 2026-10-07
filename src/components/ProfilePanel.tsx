"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useMockAuth";
import { formatEventDateTimePl } from "@/lib/datetime";

type Reservation = {
  id: number;
  loungeName: string;
  levelName: string;
  eventId: number;
  eventTitle: string;
  eventStartsAt: string;
  status: string;
  fullPrice: number | null;
  depositAmount: number | null;
  depositPaid: boolean;
  createdAt: string;
};

type ActiveTicket = {
  id: number;
  number: string;
  price: string;
  ticketType: string;
  eventId: number;
  eventTitle: string;
  eventStartsAt: string;
  createdAt: string;
};

function formatWhen(iso: string) {
  if (!iso) return "—";
  try {
    return formatEventDateTimePl(iso);
  } catch {
    return "—";
  }
}

export function ProfilePanel() {
  const { user, logout, refresh } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeTickets, setActiveTickets] = useState<ActiveTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newsletter, setNewsletter] = useState(false);
  const [newsletterSaving, setNewsletterSaving] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setNewsletter(Boolean(user.isNewsletterMember));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/me/overview", { credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Nie udało się pobrać danych.");
          return;
        }
        setReservations(data.reservations ?? []);
        setActiveTickets(data.activeTickets ?? []);
      } catch {
        setError("Baza / API niedostępne.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  async function toggleNewsletter(next: boolean) {
    setNewsletterSaving(true);
    setNewsletterMsg(null);
    try {
      const res = await fetch("/api/me/newsletter", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ subscribed: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setNewsletterMsg(data.error ?? "Nie udało się zapisać.");
        return;
      }
      setNewsletter(Boolean(data.isNewsletterMember));
      setNewsletterMsg(
        next
          ? "Zapisano — otrzymasz materiały promocyjne."
          : "Wypisano z newslettera.",
      );
      await refresh();
    } catch {
      setNewsletterMsg("Błąd połączenia.");
    } finally {
      setNewsletterSaving(false);
    }
  }

  if (!user) return null;

  const isPromoter = user.roles.includes("Promotor");

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Twój profil</p>
      <h2 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-wide">
        {user.email}
      </h2>

      <dl className="mt-8 space-y-4 border-t border-white/10 pt-6 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-galaxy-muted">ID</dt>
          <dd>{user.id}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-galaxy-muted">Role</dt>
          <dd>{user.roles.length ? user.roles.join(", ") : "Brak"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-galaxy-muted">Status</dt>
          <dd>{isPromoter ? "Promotor" : "Customer"}</dd>
        </div>
      </dl>

      <div className="mt-8 border border-white/10 p-5">
        <p className="text-xs tracking-[0.25em] text-galaxy-pink uppercase">
          Newsletter
        </p>
        <p className="mt-2 text-sm text-galaxy-muted">
          Zapis = zgoda na materiały promocyjne. Możesz wypisać się w każdej chwili
          (zgodnie z regulaminem).
        </p>
        <label className="mt-4 flex items-center gap-3 text-sm text-white">
          <input
            type="checkbox"
            checked={newsletter}
            disabled={newsletterSaving}
            onChange={(e) => void toggleNewsletter(e.target.checked)}
            className="size-4 accent-galaxy-magenta"
          />
          {newsletter ? "Jesteś zapisany/a do newslettera" : "Nie jesteś w newsletterze"}
        </label>
        {newsletterMsg ? (
          <p className="mt-2 text-xs text-galaxy-muted">{newsletterMsg}</p>
        ) : null}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href="/promotorzy"
          className="border border-white/20 px-5 py-3 text-sm tracking-wider text-white transition hover:border-galaxy-magenta hover:text-galaxy-pink"
        >
          {isPromoter ? "Panel promotora" : "Dołącz do programu promotorskiego"}
        </Link>
        <button
          type="button"
          onClick={() => void logout()}
          className="border border-white/20 px-5 py-3 text-sm tracking-wider text-galaxy-muted transition hover:border-white/40 hover:text-white"
        >
          Wyloguj
        </button>
      </div>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Bilety</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-wide">
              Aktywne bilety
            </h2>
          </div>
          <Link href="/eventy" className="text-xs tracking-wider text-galaxy-muted hover:text-white">
            Eventy →
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-galaxy-muted">Ładowanie…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-rose-300">{error}</p>
        ) : activeTickets.length === 0 ? (
          <p className="mt-4 text-sm text-galaxy-muted">
            Brak aktywnych biletów (niewykorzystanych i nieanulowanych).
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {activeTickets.map((ticket) => (
              <li key={ticket.id} className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-[family-name:var(--font-display)] tracking-wide text-white">
                    {ticket.eventTitle}
                  </p>
                  <p className="mt-1 text-sm text-galaxy-muted">
                    {ticket.ticketType} · {ticket.number}
                  </p>
                </div>
                <div className="text-sm text-galaxy-muted sm:text-right">
                  <p>{formatWhen(ticket.eventStartsAt)}</p>
                  <p className="text-galaxy-pink">{ticket.price} zł</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-14">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Loże</p>
            <h2 className="mt-2 font-[family-name:var(--font-display)] text-xl tracking-wide">
              Twoje rezerwacje
            </h2>
          </div>
          <Link href="/eventy" className="text-xs tracking-wider text-galaxy-muted hover:text-white">
            Zarezerwuj →
          </Link>
        </div>

        {loading ? (
          <p className="mt-4 text-sm text-galaxy-muted">Ładowanie…</p>
        ) : error ? (
          <p className="mt-4 text-sm text-rose-300">{error}</p>
        ) : reservations.length === 0 ? (
          <p className="mt-4 text-sm text-galaxy-muted">
            Brak rezerwacji lóż. Rezerwację złożysz na stronie wybranego eventu.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
            {reservations.map((reservation) => (
              <li
                key={reservation.id}
                className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-[family-name:var(--font-display)] tracking-wide text-white">
                    {reservation.loungeName}
                  </p>
                  <p className="mt-1 text-sm text-galaxy-muted">
                    {reservation.levelName} · {reservation.eventTitle}
                  </p>
                </div>
                <div className="text-sm text-galaxy-muted sm:text-right">
                  <p>{formatWhen(reservation.eventStartsAt)}</p>
                  <p className="uppercase tracking-wider text-galaxy-pink">
                    {reservation.status}
                  </p>
                  {reservation.depositAmount != null ? (
                    <p className="mt-1 text-xs">
                      Zaliczka {reservation.depositAmount.toLocaleString("pl-PL")} zł
                      {reservation.depositPaid ? " · opłacona" : " · oczekuje"}
                      {reservation.fullPrice != null
                        ? ` / ${reservation.fullPrice.toLocaleString("pl-PL")} zł`
                        : ""}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
