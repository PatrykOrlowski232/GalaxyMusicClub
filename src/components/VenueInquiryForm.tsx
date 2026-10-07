"use client";

import { useEffect, useState, type FormEvent } from "react";
import { venueEventTypes } from "@/data/venue";
import { useAuth } from "@/hooks/useMockAuth";

export function VenueInquiryForm() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [eventType, setEventType] = useState<string>(venueEventTypes[0]);
  const [eventDate, setEventDate] = useState("");
  const [guests, setGuests] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail((prev) => prev || user.email);
  }, [user?.email]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/venue-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          email,
          phone: phone || null,
          eventType,
          eventDate: eventDate || null,
          guests: guests ? Number(guests) : null,
          message: message || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Nie udało się wysłać zapytania.");
        return;
      }
      setSent(true);
    } catch {
      setError("Błąd połączenia.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="border border-galaxy-magenta/40 px-6 py-8">
        <p className="font-[family-name:var(--font-display)] text-xl tracking-wide">
          Zapytanie wysłane
        </p>
        <p className="mt-3 text-sm text-galaxy-muted">
          Odezwiemy się w sprawie dostępności i wyceny. Możesz też napisać na
          Instagramie @galaxymusicclub.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 text-sm tracking-wider text-galaxy-pink hover:underline"
        >
          Wyślij kolejne
        </button>
      </div>
    );
  }

  const inputClass =
    "border border-white/15 bg-black/40 px-4 py-3 text-white outline-none focus:border-galaxy-magenta";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">Imię i nazwisko / firma</span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">E-mail</span>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">Telefon</span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">Typ imprezy</span>
          <select
            required
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className={inputClass}
          >
            {venueEventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">Preferowana data</span>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm">
          <span className="text-galaxy-muted">Liczba gości (szac.)</span>
          <input
            type="number"
            min={1}
            max={2000}
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        <span className="text-galaxy-muted">Szczegóły / życzenia</span>
        <textarea
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className={`${inputClass} resize-y`}
          placeholder="Godziny, strefa, DJ, open bar, branding…"
        />
      </label>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="galaxy-glow mt-2 bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink disabled:opacity-60"
      >
        {loading ? "Wysyłanie…" : "Wyślij zapytanie o wynajem"}
      </button>
    </form>
  );
}
