/**
 * Godziny eventów = czas „ścienny” klubu (Gdańsk), bez przesuwania o UTC.
 * Pool MySQL ma timezone "Z", więc zapisujemy komponenty ścienne jako UTC.
 */

const LOCAL_RE =
  /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?/;

export function parseEventDateTime(input: string): Date {
  const value = input.trim();
  const m = value.match(LOCAL_RE);
  if (!m) {
    const fallback = new Date(value);
    if (Number.isNaN(fallback.getTime())) {
      throw new Error(`Nieprawidłowa data: ${input}`);
    }
    // Już z Z / offsetem — bierzemy komponenty UTC jako ścienne
    return new Date(
      Date.UTC(
        fallback.getUTCFullYear(),
        fallback.getUTCMonth(),
        fallback.getUTCDate(),
        fallback.getUTCHours(),
        fallback.getUTCMinutes(),
        fallback.getUTCSeconds(),
      ),
    );
  }

  return new Date(
    Date.UTC(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4]),
      Number(m[5]),
      Number(m[6] ?? 0),
    ),
  );
}

export function toEventIso(value: Date | string | null | undefined): string | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : parseEventDateTime(String(value));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function eventWallDate(iso: string): string {
  return iso.slice(0, 10);
}

export function eventWallTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")}`;
}

export function formatEventDateTimePl(iso: string): string {
  const d = new Date(iso);
  const date = new Intl.DateTimeFormat("pl-PL", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(d);
  return `${date}, ${eventWallTime(iso)}`;
}

export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  return `${y}-${mo}-${day}T${h}:${mi}`;
}

/** Składa datę YYYY-MM-DD + godzinę HH:mm → string do parseEventDateTime. */
export function joinEventDateAndTime(date: string, time: string): string {
  const d = date.trim();
  const t = time.trim() || "00:00";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
    throw new Error("Nieprawidłowa data (oczekiwane RRRR-MM-DD).");
  }
  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(t)) {
    throw new Error("Nieprawidłowa godzina (oczekiwane HH:MM).");
  }
  return `${d}T${t.length === 5 ? `${t}:00` : t}`;
}

export function splitEventDateAndTime(iso: string): { date: string; time: string } {
  return {
    date: eventWallDate(iso),
    time: eventWallTime(iso),
  };
}

/** MySQL DATETIME literal (ścienny, bez strefy). */
export function toMysqlDateTime(input: string): string {
  const d = parseEventDateTime(input);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  const h = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const s = String(d.getUTCSeconds()).padStart(2, "0");
  return `${y}-${mo}-${day} ${h}:${mi}:${s}`;
}

/** Aktualny czas ścienny Europe/Warsaw jako Date (komponenty UTC = lokalne). */
export function nowWallClock(): Date {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Warsaw",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const num = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);

  return new Date(
    Date.UTC(
      num("year"),
      num("month") - 1,
      num("day"),
      num("hour") === 24 ? 0 : num("hour"),
      num("minute"),
      num("second"),
    ),
  );
}
