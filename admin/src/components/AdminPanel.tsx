"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/hooks/useMockAuth";
import { formatEventDateTimePl, joinEventDateAndTime, splitEventDateAndTime } from "@/lib/datetime";

type Tab =
  | "overview"
  | "events"
  | "lounges"
  | "reservations"
  | "tickets"
  | "ticketLevels"
  | "artists"
  | "users"
  | "reports"
  | "news"
  | "traffic";

async function api(path: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Błąd API");
  return data;
}

async function uploadEntityImage(
  entityType: "artist" | "event",
  entityId: number,
  file: File,
) {
  const form = new FormData();
  form.append("file", file);
  form.append("entityType", entityType);
  form.append("entityId", String(entityId));
  const res = await fetch("/api/admin/upload", {
    method: "POST",
    credentials: "include",
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Błąd uploadu");
  return data as { id: number; url: string };
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-galaxy-muted">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "border border-white/15 bg-black/40 px-3 py-2 text-sm text-white outline-none focus:border-galaxy-magenta";

function AdminLoginGate() {
  const { user, ready, login, logout } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await login(email.trim(), password);
    setBusy(false);
    if (!result.ok) setError(result.error);
  }

  if (!ready) {
    return <p className="mx-auto max-w-xl text-center text-sm text-galaxy-muted">Ładowanie…</p>;
  }

  if (user) {
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="text-galaxy-muted">
          Zalogowano jako <span className="text-white">{user.email}</span>, ale brak roli Admin/Owner.
        </p>
        <button
          type="button"
          onClick={() => void logout()}
          className="mt-6 border border-white/20 px-4 py-2 text-sm tracking-wider text-white hover:border-galaxy-magenta"
        >
          Wyloguj
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Staff</p>
      <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-wide">
        Logowanie Admin
      </h1>
      <p className="mt-3 text-sm text-galaxy-muted">
        To samo konto co na stronie klubu — wymagana rola Admin lub Owner.
      </p>
      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <Field label="E-mail">
          <input
            className={inputClass}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
        <Field label="Hasło">
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="galaxy-glow w-full bg-white px-4 py-3 text-sm font-semibold tracking-wider text-black disabled:opacity-50"
        >
          {busy ? "Logowanie…" : "Zaloguj"}
        </button>
      </form>
    </div>
  );
}

async function downloadReportPdf(id: number, filename?: string) {
  const res = await fetch(`/api/admin/reports/${id}/pdf`, {
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Nie udało się pobrać PDF.");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename ?? `galaxy-raport-${id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function AdminPanel() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [parties, setParties] = useState<any[]>([]);
  const [lounges, setLounges] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketLevels, setTicketLevels] = useState<any[]>([]);
  const [artists, setArtists] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [newsPosts, setNewsPosts] = useState<any[]>([]);
  const [newsletterMeta, setNewsletterMeta] = useState<{
    subscriberCount: number;
    mailConfigured: boolean;
    sends: any[];
  } | null>(null);
  const [reportEventId, setReportEventId] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [newsForm, setNewsForm] = useState({
    title: "",
    body: "",
    category: "event",
  });
  const [newsBusy, setNewsBusy] = useState(false);
  const [traffic, setTraffic] = useState<{
    summary: Record<string, number>;
    topPages: Array<{ path: string; views: number }>;
    daily: Array<{ day: string; views: number; uniques: number }>;
    history: Array<{
      day: string;
      views: number;
      uniques: number;
      topPaths: Array<{ path: string; views: number }>;
      createdAt: string;
    }>;
    trend: {
      label: string;
      labelPl: string;
      detail: string;
      viewsChangePct: number | null;
      uniquesChangePct: number | null;
      recentAvgViews: number;
      previousAvgViews: number;
    };
  } | null>(null);

  const [eventForm, setEventForm] = useState({
    title: "",
    startDate: "",
    startTime: "22:00",
    endDate: "",
    endTime: "",
    description: "",
    photoFile: null as File | null,
  });
  const [eventDateDraft, setEventDateDraft] = useState<
    Record<number, { startDate: string; startTime: string; endDate: string; endTime: string }>
  >({});
  const [partyForm, setPartyForm] = useState({
    eventId: "",
    levelId: "2",
    musicType: "",
  });
  const [partyDjDraft, setPartyDjDraft] = useState<Record<number, string>>({});
  const [uploadBusy, setUploadBusy] = useState(false);
  const [loungeForm, setLoungeForm] = useState({
    name: "",
    levelId: "3",
    price: "1000",
  });
  const [artistForm, setArtistForm] = useState({
    name: "",
    info: "",
    photoFile: null as File | null,
  });
  const [levelForm, setLevelForm] = useState({
    eventId: "",
    ticketTypeId: "1",
    price: "40.00",
    quantity: "100",
  });
  const [ticketForm, setTicketForm] = useState({
    eventId: "",
    ticketLevelId: "",
    ownerId: "",
    number: "",
    price: "40.00",
  });

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const m = await api("/api/admin/meta");
      setMeta(m);
      if (tab === "events") {
        const evs = (await api("/api/admin/events")).events as any[];
        setEvents(evs);
        setParties((await api("/api/admin/parties")).parties);
        setArtists((await api("/api/admin/artists")).artists);
        const drafts: Record<
          number,
          { startDate: string; startTime: string; endDate: string; endTime: string }
        > = {};
        for (const ev of evs) {
          const start = ev.startsAt
            ? splitEventDateAndTime(String(ev.startsAt))
            : { date: "", time: "22:00" };
          const end = ev.endsAt
            ? splitEventDateAndTime(String(ev.endsAt))
            : { date: "", time: "" };
          drafts[ev.id] = {
            startDate: start.date,
            startTime: start.time,
            endDate: end.date,
            endTime: end.time,
          };
        }
        setEventDateDraft(drafts);
      } else if (
        tab === "overview" ||
        tab === "ticketLevels" ||
        tab === "tickets" ||
        tab === "reports"
      ) {
        setEvents((await api("/api/admin/events")).events);
      }
      if (tab === "lounges" || tab === "overview") {
        setLounges((await api("/api/admin/lounges")).lounges);
      }
      if (tab === "reservations") {
        setReservations((await api("/api/admin/reservations")).reservations);
      }
      if (tab === "tickets") {
        setTickets((await api("/api/admin/tickets")).tickets);
      }
      if (tab === "ticketLevels") {
        setTicketLevels((await api("/api/admin/ticket-levels")).ticketLevels);
      }
      if (tab === "artists") {
        setArtists((await api("/api/admin/artists")).artists);
      }
      if (tab === "users" || tab === "tickets") {
        setUsers((await api("/api/admin/users")).users);
      }
      if (tab === "reports") {
        setReports((await api("/api/admin/reports")).reports);
      }
      if (tab === "news") {
        setNewsPosts((await api("/api/admin/news")).posts);
        setNewsletterMeta(await api("/api/admin/newsletter"));
      }
      if (tab === "traffic" || tab === "overview") {
        setTraffic(await api("/api/admin/traffic"));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Błąd");
    }
  }, [tab]);

  const isStaffUser =
    !!user && (user.roles.includes("Admin") || user.roles.includes("Owner"));

  useEffect(() => {
    if (!isStaffUser) return;
    void refresh();
  }, [refresh, isStaffUser]);

  if (!isStaffUser) {
    return <AdminLoginGate />;
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Przegląd" },
    { id: "events", label: "Eventy" },
    { id: "lounges", label: "Loże" },
    { id: "reservations", label: "Rezerwacje" },
    { id: "tickets", label: "Bilety" },
    { id: "ticketLevels", label: "Oferty" },
    { id: "artists", label: "Artyści" },
    { id: "users", label: "Użytkownicy" },
    { id: "news", label: "Aktualności" },
    { id: "traffic", label: "Ruch" },
    { id: "reports", label: "Raporty" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Admin</p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl tracking-wide">
            Panel zarządzania
          </h1>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setError(null);
              setTab(t.id);
            }}
            className={`shrink-0 rounded-sm px-3 py-2 text-xs tracking-wider uppercase transition ${
              tab === t.id
                ? "bg-white text-black"
                : "border border-white/15 text-galaxy-muted hover:border-white/30 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      {tab === "overview" && meta ? (
        <div className="mt-8 space-y-8">
          <div className="grid gap-4 sm:grid-cols-4">
            {Object.entries(meta.stats as Record<string, number>).map(([k, v]) => (
              <div key={k} className="border border-white/10 px-4 py-5">
                <p className="text-xs uppercase tracking-wider text-galaxy-muted">{k}</p>
                <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">{v}</p>
              </div>
            ))}
          </div>
          {traffic ? (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-white">Ruch na stronie</p>
                <button
                  type="button"
                  className="text-xs text-galaxy-pink hover:underline"
                  onClick={() => setTab("traffic")}
                >
                  Pełne statystyki →
                </button>
              </div>
              {traffic.trend ? (
                <p className="mb-3 text-sm text-galaxy-muted">
                  {traffic.trend.labelPl}
                  {traffic.trend.viewsChangePct != null
                    ? ` · ${traffic.trend.viewsChangePct > 0 ? "+" : ""}${traffic.trend.viewsChangePct}%`
                    : ""}
                </p>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="border border-white/10 px-4 py-5">
                  <p className="text-xs uppercase tracking-wider text-galaxy-muted">Odsłony dziś</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                    {traffic.summary.viewsToday}
                  </p>
                </div>
                <div className="border border-white/10 px-4 py-5">
                  <p className="text-xs uppercase tracking-wider text-galaxy-muted">Unikalni dziś</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                    {traffic.summary.uniqueToday}
                  </p>
                </div>
                <div className="border border-white/10 px-4 py-5">
                  <p className="text-xs uppercase tracking-wider text-galaxy-muted">Odsłony 7 dni</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                    {traffic.summary.views7d}
                  </p>
                </div>
                <div className="border border-white/10 px-4 py-5">
                  <p className="text-xs uppercase tracking-wider text-galaxy-muted">Odsłony 30 dni</p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                    {traffic.summary.views30d}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "events" ? (
        <div className="mt-8 space-y-8">
          <form
            className="grid gap-3 border border-white/10 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                try {
                  const startsAt = joinEventDateAndTime(
                    eventForm.startDate,
                    eventForm.startTime,
                  );
                  const endsAt =
                    eventForm.endDate && eventForm.endTime
                      ? joinEventDateAndTime(eventForm.endDate, eventForm.endTime)
                      : eventForm.endDate
                        ? joinEventDateAndTime(eventForm.endDate, eventForm.startTime)
                        : null;
                  const created = await api("/api/admin/events", {
                    method: "POST",
                    body: JSON.stringify({
                      title: eventForm.title || null,
                      startsAt,
                      endsAt,
                      description: eventForm.description || null,
                    }),
                  });
                  if (eventForm.photoFile && created.id) {
                    await uploadEntityImage("event", created.id, eventForm.photoFile);
                  }
                  setEventForm({
                    title: "",
                    startDate: "",
                    startTime: "22:00",
                    endDate: "",
                    endTime: "",
                    description: "",
                    photoFile: null,
                  });
                  await refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Błąd");
                }
              })();
            }}
          >
            <p className="sm:col-span-2 text-sm text-white">Nowy event</p>
            <Field label="Nazwa eventu">
              <input
                required
                className={inputClass}
                value={eventForm.title}
                onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                placeholder="np. Galaxy Techno Night"
              />
            </Field>
            <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
              <Field label="Data startu">
                <input
                  required
                  type="date"
                  className={inputClass}
                  value={eventForm.startDate}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, startDate: e.target.value })
                  }
                />
              </Field>
              <Field label="Godzina startu">
                <input
                  required
                  type="time"
                  className={inputClass}
                  value={eventForm.startTime}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, startTime: e.target.value })
                  }
                />
              </Field>
              <Field label="Data końca (opcjonalnie)">
                <input
                  type="date"
                  className={inputClass}
                  value={eventForm.endDate}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, endDate: e.target.value })
                  }
                />
              </Field>
              <Field label="Godzina końca (opcjonalnie)">
                <input
                  type="time"
                  className={inputClass}
                  value={eventForm.endTime}
                  onChange={(e) =>
                    setEventForm({ ...eventForm, endTime: e.target.value })
                  }
                />
              </Field>
            </div>
            <p className="sm:col-span-2 text-xs text-galaxy-muted">
              Czas lokalny klubu (Gdańsk) — wpisana godzina zapisze się bez przesunięcia.
            </p>
            <Field label="Zdjęcie eventu (z dysku)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={`${inputClass} file:mr-3 file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white`}
                onChange={(e) =>
                  setEventForm({
                    ...eventForm,
                    photoFile: e.target.files?.[0] ?? null,
                  })
                }
              />
            </Field>
            <Field label="Opis">
              <textarea
                className={`${inputClass} min-h-20`}
                value={eventForm.description}
                onChange={(e) =>
                  setEventForm({ ...eventForm, description: e.target.value })
                }
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" className="galaxy-glow bg-white px-4 py-2 text-sm text-black">
                Dodaj event
              </button>
            </div>
          </form>

          <form
            className="grid gap-3 border border-white/10 p-4 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                try {
                  await api("/api/admin/parties", {
                    method: "POST",
                    body: JSON.stringify({
                      eventId: Number(partyForm.eventId),
                      levelId: Number(partyForm.levelId),
                      musicType: partyForm.musicType || null,
                    }),
                  });
                  setPartyForm({ eventId: partyForm.eventId, levelId: "2", musicType: "" });
                  await refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Błąd");
                }
              })();
            }}
          >
            <p className="sm:col-span-4 text-sm text-white">Dodaj imprezę do eventu</p>
            <Field label="Event">
              <select
                required
                className={inputClass}
                value={partyForm.eventId}
                onChange={(e) => setPartyForm({ ...partyForm, eventId: e.target.value })}
              >
                <option value="">Wybierz…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    #{ev.id} {ev.title || "bez nazwy"}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Piętro">
              <select
                required
                className={inputClass}
                value={partyForm.levelId}
                onChange={(e) => setPartyForm({ ...partyForm, levelId: e.target.value })}
              >
                {(meta?.levels ?? []).map((lv: any) => (
                  <option key={lv.id} value={lv.id}>
                    {lv.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Styl muzyczny">
              <input
                className={inputClass}
                value={partyForm.musicType}
                onChange={(e) => setPartyForm({ ...partyForm, musicType: e.target.value })}
                placeholder="Techno / House…"
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" className="galaxy-glow bg-white px-4 py-2 text-sm text-black">
                Dodaj imprezę
              </button>
            </div>
          </form>

          <ul className="space-y-6">
            {events.map((ev) => {
              const eventParties = parties.filter((p) => p.eventId === ev.id);
              return (
                <li key={ev.id} className="border border-white/10 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="text-xs text-galaxy-muted">#{ev.id}</p>
                      <Field label="Nazwa eventu">
                        <input
                          className={inputClass}
                          defaultValue={ev.title ?? ""}
                          key={`title-${ev.id}-${ev.title ?? ""}`}
                          onBlur={(e) => {
                            const title = e.target.value.trim();
                            if (title === (ev.title ?? "")) return;
                            void (async () => {
                              try {
                                await api("/api/admin/events", {
                                  method: "PATCH",
                                  body: JSON.stringify({ id: ev.id, title: title || null }),
                                });
                                await refresh();
                              } catch (err) {
                                setError(err instanceof Error ? err.message : "Błąd");
                              }
                            })();
                          }}
                          placeholder="Nazwa eventu"
                        />
                      </Field>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Field label="Data startu">
                          <input
                            type="date"
                            className={inputClass}
                            value={eventDateDraft[ev.id]?.startDate ?? ""}
                            onChange={(e) =>
                              setEventDateDraft({
                                ...eventDateDraft,
                                [ev.id]: {
                                  ...(eventDateDraft[ev.id] ?? {
                                    startDate: "",
                                    startTime: "22:00",
                                    endDate: "",
                                    endTime: "",
                                  }),
                                  startDate: e.target.value,
                                },
                              })
                            }
                          />
                        </Field>
                        <Field label="Godzina startu">
                          <input
                            type="time"
                            className={inputClass}
                            value={eventDateDraft[ev.id]?.startTime ?? "22:00"}
                            onChange={(e) =>
                              setEventDateDraft({
                                ...eventDateDraft,
                                [ev.id]: {
                                  ...(eventDateDraft[ev.id] ?? {
                                    startDate: "",
                                    startTime: "22:00",
                                    endDate: "",
                                    endTime: "",
                                  }),
                                  startTime: e.target.value,
                                },
                              })
                            }
                          />
                        </Field>
                        <Field label="Data końca">
                          <input
                            type="date"
                            className={inputClass}
                            value={eventDateDraft[ev.id]?.endDate ?? ""}
                            onChange={(e) =>
                              setEventDateDraft({
                                ...eventDateDraft,
                                [ev.id]: {
                                  ...(eventDateDraft[ev.id] ?? {
                                    startDate: "",
                                    startTime: "22:00",
                                    endDate: "",
                                    endTime: "",
                                  }),
                                  endDate: e.target.value,
                                },
                              })
                            }
                          />
                        </Field>
                        <Field label="Godzina końca">
                          <input
                            type="time"
                            className={inputClass}
                            value={eventDateDraft[ev.id]?.endTime ?? ""}
                            onChange={(e) =>
                              setEventDateDraft({
                                ...eventDateDraft,
                                [ev.id]: {
                                  ...(eventDateDraft[ev.id] ?? {
                                    startDate: "",
                                    startTime: "22:00",
                                    endDate: "",
                                    endTime: "",
                                  }),
                                  endTime: e.target.value,
                                },
                              })
                            }
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        className="text-xs text-galaxy-pink hover:underline"
                        onClick={() => {
                          void (async () => {
                            const draft = eventDateDraft[ev.id];
                            if (!draft?.startDate || !draft.startTime) {
                              setError("Podaj datę i godzinę startu.");
                              return;
                            }
                            try {
                              const startsAt = joinEventDateAndTime(
                                draft.startDate,
                                draft.startTime,
                              );
                              const endsAt =
                                draft.endDate && draft.endTime
                                  ? joinEventDateAndTime(draft.endDate, draft.endTime)
                                  : draft.endDate
                                    ? joinEventDateAndTime(draft.endDate, draft.startTime)
                                    : null;
                              await api("/api/admin/events", {
                                method: "PATCH",
                                body: JSON.stringify({ id: ev.id, startsAt, endsAt }),
                              });
                              await refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Błąd");
                            }
                          })();
                        }}
                      >
                        Zapisz datę / godzinę
                      </button>
                      <p className="text-xs text-galaxy-muted">
                        Podgląd:{" "}
                        {ev.startsAt ? formatEventDateTimePl(String(ev.startsAt)) : "—"}
                      </p>
                      {ev.description ? (
                        <p className="text-sm text-galaxy-muted">{ev.description}</p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-3 pt-1">
                        {ev.graphicUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ev.graphicUrl}
                            alt=""
                            className="h-auto max-h-16 w-auto max-w-28 bg-black/40"
                          />
                        ) : (
                          <div className="flex h-16 w-28 items-center justify-center bg-white/5 text-[10px] text-galaxy-muted">
                            Brak zdjęcia
                          </div>
                        )}
                        <label className="cursor-pointer text-xs text-galaxy-pink hover:underline">
                          {uploadBusy ? "Wgrywanie…" : "Wgraj zdjęcie eventu"}
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="hidden"
                            disabled={uploadBusy}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (!file) return;
                              void (async () => {
                                setUploadBusy(true);
                                setError(null);
                                try {
                                  await uploadEntityImage("event", ev.id, file);
                                  await refresh();
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Błąd");
                                } finally {
                                  setUploadBusy(false);
                                }
                              })();
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className="text-xs tracking-wider text-galaxy-pink hover:underline"
                        onClick={() => {
                          void (async () => {
                            setReportBusy(true);
                            setError(null);
                            try {
                              const data = await api("/api/admin/reports", {
                                method: "POST",
                                body: JSON.stringify({ eventId: ev.id }),
                              });
                              await downloadReportPdf(data.id, data.pdfFilename);
                              setTab("reports");
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Błąd raportu");
                            } finally {
                              setReportBusy(false);
                            }
                          })();
                        }}
                        disabled={reportBusy}
                      >
                        Raport PDF
                      </button>
                      <button
                        type="button"
                        className="text-xs tracking-wider text-rose-300 hover:underline"
                        onClick={() => {
                          void (async () => {
                            if (!confirm(`Usunąć event #${ev.id}?`)) return;
                            try {
                              await api("/api/admin/events", {
                                method: "DELETE",
                                body: JSON.stringify({ id: ev.id }),
                              });
                              await refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Błąd");
                            }
                          })();
                        }}
                      >
                        Usuń event
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 space-y-4 border-t border-white/10 pt-4">
                    <p className="text-xs tracking-wider text-galaxy-pink uppercase">
                      Imprezy ({eventParties.length})
                    </p>
                    {eventParties.length === 0 ? (
                      <p className="text-sm text-galaxy-muted">Brak imprez — dodaj powyżej.</p>
                    ) : null}
                    {eventParties.map((party) => (
                      <div key={party.id} className="border border-white/10 bg-black/20 p-3">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm text-white">
                              #{party.id} · {party.levelName}
                            </p>
                            <p className="text-xs text-galaxy-muted">
                              {party.musicType || "Styl TBA"}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-xs text-rose-300 hover:underline"
                            onClick={() => {
                              void (async () => {
                                if (!confirm(`Usunąć imprezę #${party.id}?`)) return;
                                try {
                                  await api("/api/admin/parties", {
                                    method: "DELETE",
                                    body: JSON.stringify({ id: party.id }),
                                  });
                                  await refresh();
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Błąd");
                                }
                              })();
                            }}
                          >
                            Usuń imprezę
                          </button>
                        </div>

                        <ul className="mt-3 space-y-2">
                          {(party.artists ?? []).map((dj: any) => (
                            <li
                              key={dj.id}
                              className="flex items-center justify-between gap-3 text-sm"
                            >
                              <span className="flex items-center gap-2 text-white">
                                {dj.photoUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={dj.photoUrl}
                                    alt=""
                                    className="h-8 w-8 object-cover"
                                  />
                                ) : null}
                                {dj.name}
                              </span>
                              <button
                                type="button"
                                className="text-xs text-rose-300 hover:underline"
                                onClick={() => {
                                  void (async () => {
                                    try {
                                      await api("/api/admin/parties/lineup", {
                                        method: "DELETE",
                                        body: JSON.stringify({
                                          partyId: party.id,
                                          artistId: dj.id,
                                        }),
                                      });
                                      await refresh();
                                    } catch (err) {
                                      setError(err instanceof Error ? err.message : "Błąd");
                                    }
                                  })();
                                }}
                              >
                                Usuń DJ
                              </button>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 flex flex-wrap items-end gap-2">
                          <Field label="Dodaj DJ">
                            <select
                              className={inputClass}
                              value={partyDjDraft[party.id] ?? ""}
                              onChange={(e) =>
                                setPartyDjDraft({
                                  ...partyDjDraft,
                                  [party.id]: e.target.value,
                                })
                              }
                            >
                              <option value="">Wybierz artystę…</option>
                              {artists.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {a.name}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <button
                            type="button"
                            className="border border-white/20 px-3 py-2 text-xs text-white hover:border-white"
                            onClick={() => {
                              void (async () => {
                                const artistId = Number(partyDjDraft[party.id]);
                                if (!artistId) {
                                  setError("Wybierz DJ-a.");
                                  return;
                                }
                                try {
                                  await api("/api/admin/parties/lineup", {
                                    method: "POST",
                                    body: JSON.stringify({
                                      partyId: party.id,
                                      artistId,
                                    }),
                                  });
                                  setPartyDjDraft({ ...partyDjDraft, [party.id]: "" });
                                  await refresh();
                                } catch (err) {
                                  setError(err instanceof Error ? err.message : "Błąd");
                                }
                              })();
                            }}
                          >
                            Dodaj DJ
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      {tab === "lounges" ? (
        <div className="mt-8 space-y-8">
          <form
            className="grid gap-3 border border-white/10 p-4 sm:grid-cols-4"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                try {
                  await api("/api/admin/lounges", {
                    method: "POST",
                    body: JSON.stringify({
                      name: loungeForm.name,
                      levelId: Number(loungeForm.levelId),
                      price: Number(loungeForm.price),
                    }),
                  });
                  setLoungeForm({
                    name: "",
                    levelId: loungeForm.levelId,
                    price: loungeForm.price,
                  });
                  await refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Błąd");
                }
              })();
            }}
          >
            <Field label="Nazwa">
              <input
                required
                className={inputClass}
                value={loungeForm.name}
                onChange={(e) => setLoungeForm({ ...loungeForm, name: e.target.value })}
              />
            </Field>
            <Field label="Piętro">
              <select
                className={inputClass}
                value={loungeForm.levelId}
                onChange={(e) => setLoungeForm({ ...loungeForm, levelId: e.target.value })}
              >
                {(meta?.levels ?? []).map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cena (PLN)">
              <input
                required
                type="number"
                min={1}
                step="0.01"
                className={inputClass}
                value={loungeForm.price}
                onChange={(e) => setLoungeForm({ ...loungeForm, price: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" className="galaxy-glow bg-white px-4 py-2 text-sm text-black">
                Dodaj lożę
              </button>
            </div>
          </form>

          <ul className="divide-y divide-white/10 border-y border-white/10">
            {lounges.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <span>
                  #{l.id} {l.name}{" "}
                  <span className="text-galaxy-muted">({l.levelName})</span>
                  <span className="ml-2 text-galaxy-pink">
                    {Number(l.price).toLocaleString("pl-PL")} zł
                  </span>
                  <span className="ml-1 text-xs text-galaxy-muted">
                    · zaliczka {(Number(l.price) * 0.2).toLocaleString("pl-PL")} zł
                  </span>
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="text-xs text-galaxy-pink hover:underline"
                    onClick={() => {
                      void (async () => {
                        const next = prompt(
                          `Nowa cena dla ${l.name} (PLN)`,
                          String(Number(l.price)),
                        );
                        if (next == null || next.trim() === "") return;
                        const price = Number(next);
                        if (!(price > 0)) {
                          setError("Cena musi być > 0.");
                          return;
                        }
                        try {
                          await api("/api/admin/lounges", {
                            method: "PATCH",
                            body: JSON.stringify({ id: l.id, price }),
                          });
                          await refresh();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Błąd");
                        }
                      })();
                    }}
                  >
                    Cena
                  </button>
                  <button
                    type="button"
                    className="text-xs text-rose-300 hover:underline"
                    onClick={() => {
                      void (async () => {
                        if (!confirm(`Usunąć lożę ${l.name}?`)) return;
                        try {
                          await api("/api/admin/lounges", {
                            method: "DELETE",
                            body: JSON.stringify({ id: l.id }),
                          });
                          await refresh();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Błąd");
                        }
                      })();
                    }}
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "reservations" ? (
        <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {reservations.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="text-white">
                  #{r.id} {r.loungeName}
                </p>
                <p className="text-galaxy-muted">
                  {r.userEmail} · event #{r.eventId} · {r.status}
                  {r.depositAmount != null
                    ? ` · zaliczka ${Number(r.depositAmount).toLocaleString("pl-PL")} zł${r.depositPaidAt ? " (opłacona)" : " (oczekuje)"}`
                    : ""}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  className={inputClass}
                  defaultValue={r.statusId}
                  onChange={(e) => {
                    void (async () => {
                      try {
                        await api("/api/admin/reservations", {
                          method: "PATCH",
                          body: JSON.stringify({
                            id: r.id,
                            statusId: Number(e.target.value),
                          }),
                        });
                        await refresh();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Błąd");
                      }
                    })();
                  }}
                >
                  {(meta?.reservationStatuses ?? []).map((s: any) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="text-xs text-rose-300 hover:underline"
                  onClick={() => {
                    void (async () => {
                      if (!confirm("Usunąć rezerwację?")) return;
                      try {
                        await api("/api/admin/reservations", {
                          method: "DELETE",
                          body: JSON.stringify({ id: r.id }),
                        });
                        await refresh();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Błąd");
                      }
                    })();
                  }}
                >
                  Usuń
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "tickets" ? (
        <div className="mt-8 space-y-8">
          <form
            className="grid gap-3 border border-white/10 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                try {
                  await api("/api/admin/tickets", {
                    method: "POST",
                    body: JSON.stringify({
                      eventId: Number(ticketForm.eventId),
                      ticketLevelId: Number(ticketForm.ticketLevelId),
                      ownerId: Number(ticketForm.ownerId),
                      number: ticketForm.number,
                      price: ticketForm.price,
                    }),
                  });
                  setTicketForm({
                    eventId: "",
                    ticketLevelId: "",
                    ownerId: "",
                    number: "",
                    price: "40.00",
                  });
                  await refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Błąd");
                }
              })();
            }}
          >
            <p className="sm:col-span-2 text-sm text-white">Nowy bilet</p>
            <Field label="Event ID">
              <input
                required
                className={inputClass}
                value={ticketForm.eventId}
                onChange={(e) => setTicketForm({ ...ticketForm, eventId: e.target.value })}
              />
            </Field>
            <Field label="Ticket level ID">
              <input
                required
                className={inputClass}
                value={ticketForm.ticketLevelId}
                onChange={(e) =>
                  setTicketForm({ ...ticketForm, ticketLevelId: e.target.value })
                }
              />
            </Field>
            <Field label="Owner user ID">
              <input
                required
                className={inputClass}
                value={ticketForm.ownerId}
                onChange={(e) => setTicketForm({ ...ticketForm, ownerId: e.target.value })}
              />
            </Field>
            <Field label="Numer">
              <input
                required
                className={inputClass}
                value={ticketForm.number}
                onChange={(e) => setTicketForm({ ...ticketForm, number: e.target.value })}
              />
            </Field>
            <Field label="Cena">
              <input
                required
                className={inputClass}
                value={ticketForm.price}
                onChange={(e) => setTicketForm({ ...ticketForm, price: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" className="galaxy-glow bg-white px-4 py-2 text-sm text-black">
                Dodaj bilet
              </button>
            </div>
          </form>

          <ul className="divide-y divide-white/10 border-y border-white/10">
            {tickets.map((t) => (
              <li key={t.id} className="flex flex-col gap-2 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-white">
                    {t.number} · {t.price} zł
                  </p>
                  <p className="text-galaxy-muted">
                    event #{t.eventId} · {t.ownerEmail}
                    {t.isRealized ? " · realized" : ""}
                    {t.cancelledAt ? " · cancelled" : ""}
                  </p>
                </div>
                <div className="flex gap-3">
                  {!t.isRealized && !t.cancelledAt ? (
                    <button
                      type="button"
                      className="text-xs text-galaxy-pink hover:underline"
                      onClick={() => {
                        void (async () => {
                          try {
                            await api("/api/admin/tickets", {
                              method: "PATCH",
                              body: JSON.stringify({ id: t.id, isRealized: true }),
                            });
                            await refresh();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Błąd");
                          }
                        })();
                      }}
                    >
                      Realizuj
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="text-xs text-rose-300 hover:underline"
                    onClick={() => {
                      void (async () => {
                        if (!confirm("Usunąć bilet?")) return;
                        try {
                          await api("/api/admin/tickets", {
                            method: "DELETE",
                            body: JSON.stringify({ id: t.id }),
                          });
                          await refresh();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Błąd");
                        }
                      })();
                    }}
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "ticketLevels" ? (
        <div className="mt-8 space-y-8">
          <form
            className="grid gap-3 border border-white/10 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                try {
                  await api("/api/admin/ticket-levels", {
                    method: "POST",
                    body: JSON.stringify({
                      eventId: Number(levelForm.eventId),
                      ticketTypeId: Number(levelForm.ticketTypeId),
                      price: levelForm.price,
                      quantity: levelForm.quantity === "" ? null : Number(levelForm.quantity),
                    }),
                  });
                  await refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Błąd");
                }
              })();
            }}
          >
            <p className="sm:col-span-2 text-sm text-white">Nowa oferta biletu</p>
            <Field label="Event ID">
              <input
                required
                className={inputClass}
                value={levelForm.eventId}
                onChange={(e) => setLevelForm({ ...levelForm, eventId: e.target.value })}
              />
            </Field>
            <Field label="Typ biletu">
              <select
                className={inputClass}
                value={levelForm.ticketTypeId}
                onChange={(e) =>
                  setLevelForm({ ...levelForm, ticketTypeId: e.target.value })
                }
              >
                {(meta?.ticketTypes ?? []).map((t: any) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cena">
              <input
                required
                className={inputClass}
                value={levelForm.price}
                onChange={(e) => setLevelForm({ ...levelForm, price: e.target.value })}
              />
            </Field>
            <Field label="Ilość">
              <input
                className={inputClass}
                value={levelForm.quantity}
                onChange={(e) => setLevelForm({ ...levelForm, quantity: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" className="galaxy-glow bg-white px-4 py-2 text-sm text-black">
                Dodaj ofertę
              </button>
            </div>
          </form>

          <ul className="divide-y divide-white/10 border-y border-white/10">
            {ticketLevels.map((l) => (
              <li key={l.id} className="flex items-center justify-between py-3 text-sm">
                <span>
                  #{l.id} event #{l.eventId} · {l.ticketType} · {l.price} zł · qty{" "}
                  {l.quantity ?? "∞"}
                </span>
                <button
                  type="button"
                  className="text-xs text-rose-300 hover:underline"
                  onClick={() => {
                    void (async () => {
                      if (!confirm("Usunąć ofertę?")) return;
                      try {
                        await api("/api/admin/ticket-levels", {
                          method: "DELETE",
                          body: JSON.stringify({ id: l.id }),
                        });
                        await refresh();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Błąd");
                      }
                    })();
                  }}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "artists" ? (
        <div className="mt-8 space-y-8">
          <form
            className="grid gap-3 border border-white/10 p-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                try {
                  const created = await api("/api/admin/artists", {
                    method: "POST",
                    body: JSON.stringify({
                      name: artistForm.name,
                      info: artistForm.info || null,
                    }),
                  });
                  if (artistForm.photoFile && created.id) {
                    await uploadEntityImage("artist", created.id, artistForm.photoFile);
                  }
                  setArtistForm({ name: "", info: "", photoFile: null });
                  await refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Błąd");
                }
              })();
            }}
          >
            <Field label="Nazwa">
              <input
                required
                className={inputClass}
                value={artistForm.name}
                onChange={(e) => setArtistForm({ ...artistForm, name: e.target.value })}
              />
            </Field>
            <Field label="Zdjęcie DJ (z dysku)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className={`${inputClass} file:mr-3 file:border-0 file:bg-white/10 file:px-2 file:py-1 file:text-xs file:text-white`}
                onChange={(e) =>
                  setArtistForm({
                    ...artistForm,
                    photoFile: e.target.files?.[0] ?? null,
                  })
                }
              />
            </Field>
            <Field label="Info o artyście">
              <textarea
                className={`${inputClass} min-h-20`}
                value={artistForm.info}
                onChange={(e) =>
                  setArtistForm({ ...artistForm, info: e.target.value })
                }
                placeholder="Krótki bio wyświetlany pod nazwą w evencie"
              />
            </Field>
            <div className="flex items-end">
              <button type="submit" className="galaxy-glow bg-white px-4 py-2 text-sm text-black">
                Dodaj artystę
              </button>
            </div>
          </form>

          <ul className="divide-y divide-white/10 border-y border-white/10">
            {artists.map((a) => (
              <li key={a.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="flex min-w-0 items-start gap-3">
                  {a.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.photoUrl}
                      alt={a.name}
                      className="h-12 w-12 shrink-0 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-white/10 text-[10px] text-galaxy-muted">
                      DJ
                    </div>
                  )}
                  <div className="min-w-0">
                    <p>
                      #{a.id} {a.name}
                    </p>
                    {(a.info || a.description) ? (
                      <p className="mt-1 text-xs text-galaxy-muted line-clamp-2">
                        {a.info || a.description}
                      </p>
                    ) : null}
                    <label className="mt-2 inline-block cursor-pointer text-xs text-galaxy-pink hover:underline">
                      {uploadBusy
                        ? "Wgrywanie…"
                        : a.photoUrl
                          ? "Wgraj nowe zdjęcie"
                          : "Wgraj zdjęcie z dysku"}
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        className="hidden"
                        disabled={uploadBusy}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          e.target.value = "";
                          if (!file) return;
                          void (async () => {
                            setUploadBusy(true);
                            setError(null);
                            try {
                              await uploadEntityImage("artist", a.id, file);
                              await refresh();
                            } catch (err) {
                              setError(err instanceof Error ? err.message : "Błąd");
                            } finally {
                              setUploadBusy(false);
                            }
                          })();
                        }}
                      />
                    </label>
                  </div>
                </div>
                <button
                  type="button"
                  className="text-xs text-rose-300 hover:underline"
                  onClick={() => {
                    void (async () => {
                      if (!confirm("Usunąć artystę?")) return;
                      try {
                        await api("/api/admin/artists", {
                          method: "DELETE",
                          body: JSON.stringify({ id: a.id }),
                        });
                        await refresh();
                      } catch (err) {
                        setError(err instanceof Error ? err.message : "Błąd");
                      }
                    })();
                  }}
                >
                  Usuń
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {tab === "users" ? (
        <ul className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {users.map((u) => (
            <li key={u.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm">
                <p className="text-white">
                  #{u.id} {u.email}
                </p>
                <p className="text-galaxy-muted">
                  {(u.roles as string[]).join(", ") || "Brak ról"}
                </p>
              </div>
              <select
                multiple
                className={`${inputClass} min-h-24 min-w-40`}
                value={u.roles}
                onChange={(e) => {
                  const roles = Array.from(e.target.selectedOptions).map((o) => o.value);
                  void (async () => {
                    try {
                      await api("/api/admin/users", {
                        method: "PATCH",
                        body: JSON.stringify({ userId: u.id, roles }),
                      });
                      await refresh();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Błąd");
                    }
                  })();
                }}
              >
                {(meta?.accountTypes ?? []).map((r: any) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "news" ? (
        <div className="mt-8 space-y-8">
          <div className="border border-white/10 p-4 text-sm text-galaxy-muted">
            Subskrybenci newslettera:{" "}
            <span className="text-white">{newsletterMeta?.subscriberCount ?? "…"}</span>
            {" · "}
            SMTP:{" "}
            <span className="text-white">
              {newsletterMeta?.mailConfigured
                ? "skonfigurowany"
                : "brak (dev = dry-run w logach)"}
            </span>
          </div>

          <form
            className="grid gap-3 border border-white/10 p-4"
            onSubmit={(e) => {
              e.preventDefault();
              void (async () => {
                setNewsBusy(true);
                setError(null);
                try {
                  await api("/api/admin/news", {
                    method: "POST",
                    body: JSON.stringify({
                      title: newsForm.title,
                      body: newsForm.body,
                      category: newsForm.category,
                      isPublished: true,
                    }),
                  });
                  setNewsForm({ title: "", body: "", category: newsForm.category });
                  await refresh();
                } catch (err) {
                  setError(err instanceof Error ? err.message : "Błąd");
                } finally {
                  setNewsBusy(false);
                }
              })();
            }}
          >
            <p className="text-sm text-white">Nowy post</p>
            <Field label="Tytuł">
              <input
                required
                className={inputClass}
                value={newsForm.title}
                onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
              />
            </Field>
            <Field label="Kategoria">
              <select
                className={inputClass}
                value={newsForm.category}
                onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
              >
                <option value="event">Wydarzenie</option>
                <option value="promo">Promocja</option>
                <option value="general">Aktualność</option>
              </select>
            </Field>
            <Field label="Treść">
              <textarea
                required
                rows={5}
                className={`${inputClass} resize-y`}
                value={newsForm.body}
                onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })}
              />
            </Field>
            <button
              type="submit"
              disabled={newsBusy}
              className="galaxy-glow w-fit bg-white px-4 py-2 text-sm text-black disabled:opacity-60"
            >
              {newsBusy ? "Zapisuję…" : "Opublikuj"}
            </button>
          </form>

          <ul className="divide-y divide-white/10 border-y border-white/10">
            {newsPosts.map((p) => (
              <li
                key={p.id}
                className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="text-sm">
                  <p className="text-xs tracking-wider text-galaxy-pink uppercase">
                    {p.categoryLabel}
                    {!p.isPublished ? " · szkic" : ""}
                  </p>
                  <p className="mt-1 text-white">
                    #{p.id} {p.title}
                  </p>
                  <p className="mt-2 max-w-xl whitespace-pre-wrap text-galaxy-muted">
                    {p.body}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="text-xs tracking-wider text-galaxy-pink hover:underline"
                    disabled={newsBusy}
                    onClick={() => {
                      void (async () => {
                        if (
                          !confirm(
                            `Wysłać „${p.title}” do ${newsletterMeta?.subscriberCount ?? "?"} subskrybentów?`,
                          )
                        ) {
                          return;
                        }
                        setNewsBusy(true);
                        setError(null);
                        try {
                          const data = await api("/api/admin/newsletter", {
                            method: "POST",
                            body: JSON.stringify({ postId: p.id }),
                          });
                          alert(
                            data.dryRun
                              ? `Dry-run: ${data.sent} odbiorców (brak SMTP — sprawdź logi serwera).`
                              : `Wysłano do ${data.sent} osób.`,
                          );
                          await refresh();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Błąd wysyłki");
                        } finally {
                          setNewsBusy(false);
                        }
                      })();
                    }}
                  >
                    Wyślij email
                  </button>
                  <button
                    type="button"
                    className="text-xs text-rose-300 hover:underline"
                    onClick={() => {
                      void (async () => {
                        if (!confirm(`Usunąć post „${p.title}”?`)) return;
                        try {
                          await api("/api/admin/news", {
                            method: "DELETE",
                            body: JSON.stringify({ id: p.id }),
                          });
                          await refresh();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Błąd");
                        }
                      })();
                    }}
                  >
                    Usuń
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {(newsletterMeta?.sends?.length ?? 0) > 0 ? (
            <div>
              <p className="text-xs tracking-[0.25em] text-galaxy-muted uppercase">
                Historia wysyłek
              </p>
              <ul className="mt-3 space-y-2 text-xs text-galaxy-muted">
                {newsletterMeta!.sends.map((s) => (
                  <li key={s.id}>
                    #{s.id} · {new Date(s.createdAt).toLocaleString("pl-PL")} ·{" "}
                    {s.subject} · {s.recipientCount} osób
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "traffic" ? (
        <div className="mt-8 space-y-8">
          {!traffic ? (
            <p className="text-sm text-galaxy-muted">Ładowanie statystyk…</p>
          ) : (
            <>
              <p className="text-sm text-galaxy-muted">
                Odsłony publicznych stron (bez /admin i /api). Na koniec każdego
                dnia dane trafiają do zrzutu historycznego. Unikalni = cookie
                przeglądarki.
              </p>

              {traffic.trend ? (
                <div className="border border-white/10 p-4">
                  <p className="text-xs tracking-[0.25em] text-galaxy-pink uppercase">
                    Tendencja
                  </p>
                  <p className="mt-2 font-[family-name:var(--font-display)] text-2xl tracking-wide">
                    {traffic.trend.labelPl}
                    {traffic.trend.viewsChangePct != null ? (
                      <span className="ml-3 text-lg text-galaxy-muted">
                        {traffic.trend.viewsChangePct > 0 ? "+" : ""}
                        {traffic.trend.viewsChangePct}%
                      </span>
                    ) : null}
                  </p>
                  <p className="mt-2 text-sm text-galaxy-muted">{traffic.trend.detail}</p>
                  <p className="mt-1 text-xs text-galaxy-muted">
                    Porównanie średnich odsłon: ostatnie 7 zamkniętych dni vs
                    poprzednie 7 (≥ +8% wzrost, ≤ −8% spadek).
                  </p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-4">
                {(
                  [
                    ["Odsłony dziś", traffic.summary.viewsToday],
                    ["Unikalni dziś", traffic.summary.uniqueToday],
                    ["Odsłony 7 dni", traffic.summary.views7d],
                    ["Unikalni 7 dni", traffic.summary.unique7d],
                    ["Odsłony 30 dni", traffic.summary.views30d],
                    ["Unikalni 30 dni", traffic.summary.unique30d],
                    ["Odsłony łącznie", traffic.summary.viewsAll],
                    ["Unikalni łącznie", traffic.summary.uniqueAll],
                  ] as const
                ).map(([label, value]) => (
                  <div key={label} className="border border-white/10 px-4 py-5">
                    <p className="text-xs uppercase tracking-wider text-galaxy-muted">
                      {label}
                    </p>
                    <p className="mt-2 font-[family-name:var(--font-display)] text-3xl">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border border-white/10 p-4">
                <p className="text-sm text-white">Live — ostatnie 14 dni</p>
                {traffic.daily.length === 0 ? (
                  <p className="mt-3 text-sm text-galaxy-muted">Brak danych.</p>
                ) : (
                  <ul className="mt-4 space-y-2">
                    {traffic.daily.map((d) => {
                      const max = Math.max(...traffic.daily.map((x) => x.views), 1);
                      const pct = Math.round((d.views / max) * 100);
                      return (
                        <li
                          key={d.day}
                          className="grid grid-cols-[7rem_1fr_auto] items-center gap-3 text-sm"
                        >
                          <span className="text-galaxy-muted">{d.day}</span>
                          <div className="h-2 bg-white/10">
                            <div
                              className="h-2 bg-galaxy-magenta/70"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs text-galaxy-muted tabular-nums">
                            {d.views} / {d.uniques} u.
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="border border-white/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-white">Historia zrzutów dziennych</p>
                  <button
                    type="button"
                    className="text-xs text-galaxy-pink hover:underline"
                    onClick={() => {
                      void (async () => {
                        try {
                          await api("/api/admin/traffic", { method: "POST" });
                          await refresh();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Błąd zrzutu");
                        }
                      })();
                    }}
                  >
                    Domknij zakończone dni teraz
                  </button>
                </div>
                <p className="mt-2 text-xs text-galaxy-muted">
                  Zrzut na koniec dnia zapisuje odsłony, unikalnych i top ścieżki.
                  Automatycznie przy ruchu lub cron: npm run traffic:snapshot
                </p>
                {!traffic.history?.length ? (
                  <p className="mt-3 text-sm text-galaxy-muted">
                    Brak zamkniętych dni — pojawią się po północy lub po ręcznym
                    domknięciu.
                  </p>
                ) : (
                  <ul className="mt-4 divide-y divide-white/10">
                    {traffic.history.map((h) => (
                      <li key={h.day} className="py-3 text-sm">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-white">{h.day}</span>
                          <span className="text-galaxy-muted tabular-nums">
                            {h.views} odsłon · {h.uniques} unikalnych
                          </span>
                        </div>
                        {h.topPaths?.length ? (
                          <p className="mt-1 text-xs text-galaxy-muted">
                            Top:{" "}
                            {h.topPaths
                              .slice(0, 3)
                              .map((p) => `${p.path} (${p.views})`)
                              .join(" · ")}
                          </p>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border border-white/10 p-4">
                <p className="text-sm text-white">Najpopularniejsze ścieżki (30 dni)</p>
                {traffic.topPages.length === 0 ? (
                  <p className="mt-3 text-sm text-galaxy-muted">Brak danych.</p>
                ) : (
                  <ul className="mt-4 divide-y divide-white/10">
                    {traffic.topPages.map((p) => (
                      <li
                        key={p.path}
                        className="flex items-center justify-between gap-4 py-2 text-sm"
                      >
                        <span className="truncate text-white">{p.path}</span>
                        <span className="shrink-0 text-galaxy-muted tabular-nums">
                          {p.views}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      ) : null}

      {tab === "reports" ? (
        <div className="mt-8 space-y-8">
          <div className="border border-white/10 p-4">
            <p className="text-sm text-white">Generuj raport sprzedaży online (PDF)</p>
            <p className="mt-2 text-xs text-galaxy-muted">
              Uwzględnia: całą sprzedaż biletów, prowizję promotorów z biletów
              promocyjnych oraz rezerwacje lóż (zaliczki). Raport jest zapisywany w
              tabeli event_summaries.
            </p>
            <form
              className="mt-4 flex flex-wrap items-end gap-3"
              onSubmit={(e) => {
                e.preventDefault();
                void (async () => {
                  if (!reportEventId) return;
                  setReportBusy(true);
                  setError(null);
                  try {
                    const data = await api("/api/admin/reports", {
                      method: "POST",
                      body: JSON.stringify({ eventId: Number(reportEventId) }),
                    });
                    await downloadReportPdf(data.id, data.pdfFilename);
                    await refresh();
                  } catch (err) {
                    setError(err instanceof Error ? err.message : "Błąd raportu");
                  } finally {
                    setReportBusy(false);
                  }
                })();
              }}
            >
              <Field label="Event">
                <select
                  required
                  className={inputClass}
                  value={reportEventId}
                  onChange={(e) => setReportEventId(e.target.value)}
                >
                  <option value="">— wybierz —</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      #{ev.id} · {ev.startsAt ? formatEventDateTimePl(String(ev.startsAt)) : "—"} ·{" "}
                      {String(ev.description ?? "").slice(0, 40)}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                type="submit"
                disabled={reportBusy || !reportEventId}
                className="galaxy-glow bg-white px-4 py-2 text-sm text-black disabled:opacity-60"
              >
                {reportBusy ? "Generuję…" : "Generuj i pobierz PDF"}
              </button>
            </form>
          </div>

          <div>
            <p className="text-xs tracking-[0.25em] text-galaxy-muted uppercase">
              Zapisane podsumowania
            </p>
            {reports.length === 0 ? (
              <p className="mt-4 text-sm text-galaxy-muted">Brak zapisanych raportów.</p>
            ) : (
              <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
                {reports.map((r) => (
                  <li
                    key={r.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="text-sm">
                      <p className="text-white">
                        #{r.id} · Event #{r.eventId} · {r.eventTitle}
                      </p>
                      <p className="mt-1 text-galaxy-muted">
                        {new Date(r.generatedAt).toLocaleString("pl-PL")}
                        {r.generatedByEmail ? ` · ${r.generatedByEmail}` : ""}
                      </p>
                      <p className="mt-1 text-xs text-galaxy-muted">
                        Bilety {r.ticketsCount} / {Number(r.ticketsGross).toLocaleString("pl-PL")} zł
                        · promotorzy {Number(r.promoterCommissionTotal).toLocaleString("pl-PL")} zł (
                        {Math.round(Number(r.promoterCommissionRate) * 1000) / 10}%)
                        · loże {r.loungeReservationsCount} / zaliczki{" "}
                        {Number(r.loungeDepositsTotal).toLocaleString("pl-PL")} zł
                        · online {Number(r.onlineSalesTotal).toLocaleString("pl-PL")} zł
                        · netto {Number(r.netAfterCommission).toLocaleString("pl-PL")} zł
                      </p>
                    </div>
                    <button
                      type="button"
                      className="text-xs tracking-wider text-galaxy-pink hover:underline"
                      onClick={() => {
                        void (async () => {
                          try {
                            await downloadReportPdf(r.id, r.pdfFilename);
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Błąd PDF");
                          }
                        })();
                      }}
                    >
                      Pobierz PDF
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
