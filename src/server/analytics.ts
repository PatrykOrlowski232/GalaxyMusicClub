import { and, asc, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { pageViews, trafficDailySnapshots } from "@/db/schema";
import { nowWallClock } from "@/lib/datetime";

const SKIP_PREFIXES = ["/api/", "/_next"];

function normalizePath(raw: string): string | null {
  let path = raw.trim();
  if (!path.startsWith("/")) path = `/${path}`;
  try {
    path = decodeURIComponent(path);
  } catch {
    // keep raw
  }
  path = path.split("?")[0]?.split("#")[0] ?? path;
  if (path.length > 500) path = path.slice(0, 500);
  if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(p))) return null;
  return path || "/";
}

function sinceDays(days: number): Date {
  const now = nowWallClock();
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function startOfWallDay(d = nowWallClock()): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0),
  );
}

function wallDayString(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addWallDays(day: Date, n: number): Date {
  return new Date(day.getTime() + n * 24 * 60 * 60 * 1000);
}

export async function recordPageView(input: {
  path: string;
  referrer?: string | null;
  visitorKey?: string | null;
}) {
  const path = normalizePath(input.path);
  if (!path) return { skipped: true as const };

  const referrer = input.referrer?.trim().slice(0, 500) || null;
  const visitorKey = input.visitorKey?.trim().slice(0, 64) || null;

  await db.insert(pageViews).values({
    path,
    referrer,
    visitorKey,
  });

  // Przy pierwszej odsłonie nowego dnia domknij wczorajszy zrzut
  void ensureClosedDailySnapshots().catch(() => {});

  return { skipped: false as const, path };
}

async function countViewsSince(since: Date | null) {
  if (!since) {
    const [row] = await db.select({ c: sql<number>`COUNT(*)` }).from(pageViews);
    return Number(row?.c ?? 0);
  }
  const [row] = await db
    .select({ c: sql<number>`COUNT(*)` })
    .from(pageViews)
    .where(gte(pageViews.createdAt, since));
  return Number(row?.c ?? 0);
}

async function countUniquesSince(since: Date | null) {
  if (!since) {
    const [row] = await db
      .select({
        c: sql<number>`COUNT(DISTINCT ${pageViews.visitorKey})`,
      })
      .from(pageViews)
      .where(sql`${pageViews.visitorKey} IS NOT NULL`);
    return Number(row?.c ?? 0);
  }
  const [row] = await db
    .select({
      c: sql<number>`COUNT(DISTINCT ${pageViews.visitorKey})`,
    })
    .from(pageViews)
    .where(
      and(gte(pageViews.createdAt, since), sql`${pageViews.visitorKey} IS NOT NULL`),
    );
  return Number(row?.c ?? 0);
}

async function aggregateDay(dayStart: Date) {
  const dayEnd = addWallDays(dayStart, 1);
  const [totals] = await db
    .select({
      views: sql<number>`COUNT(*)`,
      uniques: sql<number>`COUNT(DISTINCT ${pageViews.visitorKey})`,
    })
    .from(pageViews)
    .where(
      and(gte(pageViews.createdAt, dayStart), lt(pageViews.createdAt, dayEnd)),
    );

  const top = await db
    .select({
      path: pageViews.path,
      views: sql<number>`COUNT(*)`,
    })
    .from(pageViews)
    .where(
      and(gte(pageViews.createdAt, dayStart), lt(pageViews.createdAt, dayEnd)),
    )
    .groupBy(pageViews.path)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(10);

  return {
    views: Number(totals?.views ?? 0),
    uniques: Number(totals?.uniques ?? 0),
    topPaths: top.map((r) => ({ path: r.path, views: Number(r.views) })),
  };
}

/** Zapisuje / aktualizuje zrzut dla konkretnego dnia (YYYY-MM-DD, czas ścienny). */
export async function snapshotTrafficDay(dayIso: string) {
  const dayStart = new Date(`${dayIso}T00:00:00.000Z`);
  if (Number.isNaN(dayStart.getTime())) {
    throw new Error(`Nieprawidłowy dzień: ${dayIso}`);
  }
  const agg = await aggregateDay(dayStart);

  const existing = await db
    .select({ id: trafficDailySnapshots.id })
    .from(trafficDailySnapshots)
    .where(eq(trafficDailySnapshots.day, dayStart))
    .limit(1);

  if (existing[0]) {
    await db
      .update(trafficDailySnapshots)
      .set({
        views: agg.views,
        uniques: agg.uniques,
        topPaths: agg.topPaths,
      })
      .where(eq(trafficDailySnapshots.id, existing[0].id));
    return { day: dayIso, ...agg, updated: true };
  }

  await db.insert(trafficDailySnapshots).values({
    day: dayStart,
    views: agg.views,
    uniques: agg.uniques,
    topPaths: agg.topPaths,
  });
  return { day: dayIso, ...agg, updated: false };
}

/**
 * Domknięcie zakończonych dni — od pierwszego page_view / ostatniego zrzutu
 * do wczoraj (dziś jeszcze trwa, więc bez zrzutu „live”).
 */
export async function ensureClosedDailySnapshots() {
  const today = startOfWallDay();
  const yesterday = addWallDays(today, -1);

  const [oldestView] = await db
    .select({ createdAt: pageViews.createdAt })
    .from(pageViews)
    .orderBy(asc(pageViews.createdAt))
    .limit(1);

  if (!oldestView?.createdAt) return { closed: [] as string[] };

  const oldest =
    oldestView.createdAt instanceof Date
      ? oldestView.createdAt
      : new Date(String(oldestView.createdAt));
  let cursor = startOfWallDay(oldest);

  const [latestSnap] = await db
    .select({ day: trafficDailySnapshots.day })
    .from(trafficDailySnapshots)
    .orderBy(desc(trafficDailySnapshots.day))
    .limit(1);

  if (latestSnap?.day) {
    const next = addWallDays(new Date(`${String(latestSnap.day).slice(0, 10)}T00:00:00.000Z`), 1);
    if (next > cursor) cursor = next;
  }

  const closed: string[] = [];
  while (cursor.getTime() <= yesterday.getTime()) {
    const dayIso = wallDayString(cursor);
    await snapshotTrafficDay(dayIso);
    closed.push(dayIso);
    cursor = addWallDays(cursor, 1);
    if (closed.length > 400) break;
  }

  return { closed };
}

function computeTrend(
  history: Array<{ day: string; views: number; uniques: number }>,
) {
  const recent = history.slice(-7);
  const previous = history.slice(-14, -7);

  if (recent.length < 3) {
    return {
      label: "za_malo_danych" as const,
      labelPl: "Za mało danych",
      detail: "Potrzeba co najmniej kilku zamkniętych dni ze zrzutami.",
      viewsChangePct: null as number | null,
      uniquesChangePct: null as number | null,
      recentAvgViews: recent.length
        ? Math.round(recent.reduce((s, d) => s + d.views, 0) / recent.length)
        : 0,
      previousAvgViews: 0,
    };
  }

  const avg = (rows: typeof recent, key: "views" | "uniques") =>
    rows.reduce((s, d) => s + d[key], 0) / rows.length;

  const recentViews = avg(recent, "views");
  const prevViews = previous.length ? avg(previous, "views") : 0;
  const recentUniques = avg(recent, "uniques");
  const prevUniques = previous.length ? avg(previous, "uniques") : 0;

  const viewsChangePct =
    prevViews > 0
      ? Math.round(((recentViews - prevViews) / prevViews) * 1000) / 10
      : recentViews > 0
        ? 100
        : 0;
  const uniquesChangePct =
    prevUniques > 0
      ? Math.round(((recentUniques - prevUniques) / prevUniques) * 1000) / 10
      : recentUniques > 0
        ? 100
        : 0;

  let label: "wzrostowa" | "spadkowa" | "stabilna" = "stabilna";
  if (viewsChangePct >= 8) label = "wzrostowa";
  else if (viewsChangePct <= -8) label = "spadkowa";

  const labelPl =
    label === "wzrostowa"
      ? "Tendencja wzrostowa"
      : label === "spadkowa"
        ? "Tendencja spadkowa"
        : "Tendencja stabilna";

  const sign = viewsChangePct > 0 ? "+" : "";
  return {
    label,
    labelPl,
    detail: `Śr. odsłon 7 dni: ${Math.round(recentViews)} vs poprzednie 7: ${Math.round(prevViews)} (${sign}${viewsChangePct}%).`,
    viewsChangePct,
    uniquesChangePct,
    recentAvgViews: Math.round(recentViews),
    previousAvgViews: Math.round(prevViews),
  };
}

export async function getTrafficStats() {
  await ensureClosedDailySnapshots();

  const today = startOfWallDay();
  const d7 = sinceDays(7);
  const d30 = sinceDays(30);
  const d14 = sinceDays(14);

  const [
    viewsToday,
    views7d,
    views30d,
    viewsAll,
    uniqueToday,
    unique7d,
    unique30d,
    uniqueAll,
  ] = await Promise.all([
    countViewsSince(today),
    countViewsSince(d7),
    countViewsSince(d30),
    countViewsSince(null),
    countUniquesSince(today),
    countUniquesSince(d7),
    countUniquesSince(d30),
    countUniquesSince(null),
  ]);

  const topPages = await db
    .select({
      path: pageViews.path,
      views: sql<number>`COUNT(*)`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, d30))
    .groupBy(pageViews.path)
    .orderBy(desc(sql`COUNT(*)`))
    .limit(12);

  const dailyLive = await db
    .select({
      day: sql<string>`DATE(${pageViews.createdAt})`,
      views: sql<number>`COUNT(*)`,
      uniques: sql<number>`COUNT(DISTINCT ${pageViews.visitorKey})`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, d14))
    .groupBy(sql`DATE(${pageViews.createdAt})`)
    .orderBy(sql`DATE(${pageViews.createdAt})`);

  const snapshots = await db
    .select({
      day: trafficDailySnapshots.day,
      views: trafficDailySnapshots.views,
      uniques: trafficDailySnapshots.uniques,
      topPaths: trafficDailySnapshots.topPaths,
      createdAt: trafficDailySnapshots.createdAt,
    })
    .from(trafficDailySnapshots)
    .orderBy(desc(trafficDailySnapshots.day))
    .limit(90);

  const historyAsc = [...snapshots]
    .reverse()
    .map((s) => ({
      day: String(s.day).slice(0, 10),
      views: Number(s.views),
      uniques: Number(s.uniques),
      topPaths: s.topPaths ?? [],
      createdAt:
        s.createdAt instanceof Date
          ? s.createdAt.toISOString()
          : String(s.createdAt),
    }));

  const trend = computeTrend(historyAsc);

  return {
    summary: {
      viewsToday,
      views7d,
      views30d,
      viewsAll,
      uniqueToday,
      unique7d,
      unique30d,
      uniqueAll,
    },
    topPages: topPages.map((r) => ({
      path: r.path,
      views: Number(r.views),
    })),
    daily: dailyLive.map((r) => ({
      day: String(r.day).slice(0, 10),
      views: Number(r.views),
      uniques: Number(r.uniques),
    })),
    history: [...historyAsc].reverse(),
    trend,
  };
}
