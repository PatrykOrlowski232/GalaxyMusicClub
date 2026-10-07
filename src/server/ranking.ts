import { and, eq, gte, isNotNull, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  promotorWalletTransactions,
  promotorWallets,
  tickets,
  transactionTypes,
} from "@/db/schema";

export type RankingPeriod = "month" | "year";

export type PromoterRankRow = {
  rank: number;
  userId: number;
  code: string;
  ticketsSold: number;
  ticketsValue: number;
  earnings: number;
};

function periodBounds(period: RankingPeriod) {
  const now = new Date();
  const from =
    period === "month"
      ? new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      : new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
  return { from, to };
}

export function rankingPeriodLabel(period: RankingPeriod) {
  const now = new Date();
  if (period === "month") {
    return new Intl.DateTimeFormat("pl-PL", {
      month: "long",
      year: "numeric",
    }).format(now);
  }
  return String(now.getFullYear());
}

export async function getPromoterRanking(
  period: RankingPeriod,
): Promise<{ period: RankingPeriod; label: string; rows: PromoterRankRow[] }> {
  const { from, to } = periodBounds(period);

  const ticketRows = await db
    .select({
      userId: tickets.promotorId,
      code: promotorWallets.accountNumber,
      ticketsSold: sql<number>`COUNT(*)`,
      ticketsValue: sql<string>`COALESCE(SUM(${tickets.price}), 0)`,
    })
    .from(tickets)
    .innerJoin(promotorWallets, eq(promotorWallets.userId, tickets.promotorId))
    .where(
      and(
        isNotNull(tickets.promotorId),
        isNull(tickets.cancelledAt),
        gte(tickets.createdAt, from),
        lt(tickets.createdAt, to),
      ),
    )
    .groupBy(tickets.promotorId, promotorWallets.accountNumber);

  const earningsRows = await db
    .select({
      userId: promotorWallets.userId,
      earnings: sql<string>`COALESCE(SUM(${promotorWalletTransactions.value}), 0)`,
    })
    .from(promotorWalletTransactions)
    .innerJoin(
      promotorWallets,
      eq(promotorWalletTransactions.walletId, promotorWallets.id),
    )
    .innerJoin(
      transactionTypes,
      eq(promotorWalletTransactions.transactionTypeId, transactionTypes.id),
    )
    .where(
      and(
        eq(transactionTypes.name, "PromotorCommission"),
        gte(promotorWalletTransactions.createdAt, from),
        lt(promotorWalletTransactions.createdAt, to),
      ),
    )
    .groupBy(promotorWallets.userId);

  const earningsMap = new Map(
    earningsRows.map((r) => [r.userId, Number(r.earnings)]),
  );

  const merged = ticketRows
    .filter((r) => r.userId != null)
    .map((r) => ({
      userId: r.userId as number,
      code: r.code ?? `P${r.userId}`,
      ticketsSold: Number(r.ticketsSold ?? 0),
      ticketsValue: Number(r.ticketsValue ?? 0),
      earnings: earningsMap.get(r.userId as number) ?? 0,
    }));

  // promotorzy z prowizją, ale bez biletów w okresie (edge) — dołącz
  for (const e of earningsRows) {
    if (!merged.some((m) => m.userId === e.userId)) {
      const [wallet] = await db
        .select()
        .from(promotorWallets)
        .where(eq(promotorWallets.userId, e.userId))
        .limit(1);
      merged.push({
        userId: e.userId,
        code: wallet?.accountNumber ?? `P${e.userId}`,
        ticketsSold: 0,
        ticketsValue: 0,
        earnings: Number(e.earnings),
      });
    }
  }

  merged.sort((a, b) => {
    if (b.ticketsSold !== a.ticketsSold) return b.ticketsSold - a.ticketsSold;
    return b.earnings - a.earnings;
  });

  const rows: PromoterRankRow[] = merged.map((row, index) => ({
    rank: index + 1,
    ...row,
  }));

  return {
    period,
    label: rankingPeriodLabel(period),
    rows,
  };
}
