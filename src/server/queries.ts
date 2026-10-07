import { and, asc, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  artists,
  eventTicketLevels,
  events,
  levels,
  loungeReservations,
  lounges,
  parties,
  partyLineup,
  promotorPayoutRequests,
  promotorWalletTransactions,
  promotorWallets,
  reservationStatuses,
  ticketTypes,
  tickets,
  transactionTypes,
} from "@/db/schema";
import { toEventIso } from "@/lib/datetime";
import {
  generatePromoterCode,
  getPromoterCommissionPercent,
  isPromoterCodeFormat,
} from "@/lib/promoter";
import { LOUNGE_DEPOSIT_RATE, loungeDepositAmount } from "@/lib/lounges";

/** Unikalny 12-znakowy kod → `promotor_wallets.account_number`. */
export async function allocateUniquePromoterCode(): Promise<string> {
  for (let attempt = 0; attempt < 32; attempt++) {
    const code = generatePromoterCode();
    const [existing] = await db
      .select({ id: promotorWallets.id })
      .from(promotorWallets)
      .where(eq(promotorWallets.accountNumber, code))
      .limit(1);
    if (!existing) return code;
  }
  throw new Error("Nie udało się wygenerować unikalnego kodu promotora.");
}

/** Uzupełnia / podmienia kod, jeśli brakuje lub ma zły format. */
export async function ensurePromoterWalletCode(wallet: {
  id: number;
  accountNumber: string | null;
}): Promise<string> {
  if (isPromoterCodeFormat(wallet.accountNumber)) {
    return wallet.accountNumber!;
  }
  const code = await allocateUniquePromoterCode();
  await db
    .update(promotorWallets)
    .set({ accountNumber: code })
    .where(eq(promotorWallets.id, wallet.id));
  return code;
}

export type ApiEventArtist = {
  id: number;
  name: string;
  info: string | null;
  photoUrl: string | null;
};

export type ApiEventFloor = {
  levelId: number;
  levelName: string;
  musicType: string | null;
  lineup: string[];
};

export type ApiEvent = {
  id: number;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  description: string | null;
  graphicUrl: string | null;
  ticketUrl: string | null;
  lineup: string[];
  artists: ApiEventArtist[];
  musicType: string | null;
  floors: ApiEventFloor[];
  floorsCount: number;
  ticketLevels: Array<{
    id: number;
    ticketType: string;
    price: string;
    quantity: number | null;
  }>;
  status: "bilety" | "guestlist" | "wyprzedane";
};

function toIso(value: Date | string | null | undefined): string | null {
  return toEventIso(value);
}

function deriveTitle(
  title: string | null | undefined,
  description: string | null,
  lineupText: string | null,
  id: number,
) {
  if (title?.trim()) return title.trim();
  if (lineupText) {
    const first = lineupText.split("·")[0]?.trim();
    if (first) return first.includes(" ") ? `Galaxy · ${first}` : first;
  }
  if (description) {
    const sentence = description.split(/[.!?]/)[0]?.trim();
    if (sentence && sentence.length <= 60) return sentence;
  }
  return `Galaxy Event #${id}`;
}

function deriveStatus(
  levelsList: Array<{ ticketType: string; quantity: number | null }>,
): ApiEvent["status"] {
  if (levelsList.length === 0) return "bilety";
  const allSold = levelsList.every((l) => l.quantity === 0);
  if (allSold) return "wyprzedane";
  if (levelsList.some((l) => l.ticketType.toLowerCase() === "guestlist")) {
    const onlyGuest =
      levelsList.filter((l) => (l.quantity ?? 0) > 0).every((l) =>
        l.ticketType.toLowerCase().includes("guest"),
      ) && levelsList.some((l) => (l.quantity ?? 0) > 0);
    if (onlyGuest) return "guestlist";
  }
  return "bilety";
}

export async function listEvents(): Promise<ApiEvent[]> {
  const rows = await db.select().from(events).orderBy(asc(events.startsAt));
  const result: ApiEvent[] = [];

  for (const event of rows) {
    result.push(await hydrateEvent(event));
  }
  return result;
}

export async function getEventById(id: number): Promise<ApiEvent | null> {
  const [event] = await db.select().from(events).where(eq(events.id, id)).limit(1);
  if (!event) return null;
  return hydrateEvent(event);
}

async function hydrateEvent(event: typeof events.$inferSelect): Promise<ApiEvent> {
  const partyRows = await db
    .select({
      id: parties.id,
      levelId: parties.levelId,
      levelName: levels.name,
      lineup: parties.lineup,
      musicType: parties.musicType,
    })
    .from(parties)
    .innerJoin(levels, eq(parties.levelId, levels.id))
    .where(eq(parties.eventId, event.id))
    .orderBy(asc(levels.id), asc(parties.id));

  const floorsMap = new Map<
    number,
    { levelId: number; levelName: string; musicType: string | null; lineup: string[] }
  >();
  const lineupNames: string[] = [];
  const artistsMap = new Map<number, ApiEventArtist>();

  for (const party of partyRows) {
    const artistRows = await db
      .select({
        id: artists.id,
        name: artists.name,
        info: artists.info,
        photoUrl: artists.photoUrl,
        photoMediaId: artists.photoMediaId,
        description: artists.description,
        position: partyLineup.position,
      })
      .from(partyLineup)
      .innerJoin(artists, eq(partyLineup.artistId, artists.id))
      .where(eq(partyLineup.partyId, party.id))
      .orderBy(asc(partyLineup.position));

    const partyLineupNames = artistRows.length
      ? artistRows.map((l) => {
          if (!artistsMap.has(l.id)) {
            artistsMap.set(l.id, {
              id: l.id,
              name: l.name,
              info: l.info ?? l.description ?? null,
              photoUrl: l.photoMediaId
                ? `/api/media/${l.photoMediaId}`
                : (l.photoUrl ?? null),
            });
          }
          return l.name;
        })
      : party.lineup
        ? party.lineup
            .split("·")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    lineupNames.push(...partyLineupNames);

    const existing = floorsMap.get(party.levelId);
    if (existing) {
      existing.lineup.push(...partyLineupNames);
      if (!existing.musicType && party.musicType) {
        existing.musicType = party.musicType;
      }
    } else {
      floorsMap.set(party.levelId, {
        levelId: party.levelId,
        levelName: party.levelName,
        musicType: party.musicType,
        lineup: [...partyLineupNames],
      });
    }
  }

  const floors = [...floorsMap.values()].map((f) => ({
    ...f,
    lineup: [...new Set(f.lineup)],
  }));

  const levelsRows = await db
    .select({
      id: eventTicketLevels.id,
      price: eventTicketLevels.price,
      quantity: eventTicketLevels.quantity,
      ticketType: ticketTypes.name,
    })
    .from(eventTicketLevels)
    .innerJoin(ticketTypes, eq(eventTicketLevels.ticketTypeId, ticketTypes.id))
    .where(eq(eventTicketLevels.eventId, event.id));

  const ticketLevels = levelsRows.map((l) => ({
    id: l.id,
    ticketType: l.ticketType,
    price: String(l.price),
    quantity: l.quantity,
  }));

  const title = deriveTitle(
    event.title,
    event.description,
    partyRows[0]?.lineup ?? null,
    event.id,
  );

  return {
    id: event.id,
    slug: String(event.id),
    title,
    startsAt: toIso(event.startsAt) ?? "",
    endsAt: toIso(event.endsAt),
    description: event.description,
    graphicUrl: event.graphicMediaId
      ? `/api/media/${event.graphicMediaId}`
      : event.graphicUrl,
    ticketUrl: event.ticketUrl,
    lineup: [...new Set(lineupNames)],
    artists: [...artistsMap.values()],
    musicType: floors[0]?.musicType ?? partyRows[0]?.musicType ?? null,
    floors,
    floorsCount: floors.length,
    ticketLevels,
    status: deriveStatus(ticketLevels),
  };
}

export async function listLounges() {
  return db
    .select({
      id: lounges.id,
      name: lounges.name,
      price: lounges.price,
      levelId: lounges.levelId,
      levelName: levels.name,
    })
    .from(lounges)
    .innerJoin(levels, eq(lounges.levelId, levels.id))
    .orderBy(asc(lounges.id));
}

/** Loże z flagą available dla konkretnego eventu (wolne = brak aktywnej rezerwacji). */
export async function listLoungesForEvent(eventId: number) {
  const all = await listLounges();

  const taken = await db
    .select({
      loungeId: loungeReservations.loungeId,
      status: reservationStatuses.name,
    })
    .from(loungeReservations)
    .innerJoin(
      reservationStatuses,
      eq(loungeReservations.statusId, reservationStatuses.id),
    )
    .where(eq(loungeReservations.eventId, eventId));

  const takenIds = new Set(
    taken
      .filter((r) => r.status !== "Cancelled")
      .map((r) => r.loungeId),
  );

  return all.map((lounge) => {
    const price = Number(lounge.price);
    return {
      ...lounge,
      price,
      depositAmount: loungeDepositAmount(price),
      depositRate: LOUNGE_DEPOSIT_RATE,
      available: !takenIds.has(lounge.id),
    };
  });
}

export async function createLoungeReservation(input: {
  loungeId: number;
  eventId: number;
  userId: number;
  fullPrice: number;
  depositAmount: number;
}) {
  const [pending] = await db
    .select()
    .from(reservationStatuses)
    .where(eq(reservationStatuses.name, "Pending"))
    .limit(1);

  if (!pending) throw new Error("Brak statusu Pending w reservation_statuses.");

  const [existing] = await db
    .select({
      id: loungeReservations.id,
      status: reservationStatuses.name,
    })
    .from(loungeReservations)
    .innerJoin(
      reservationStatuses,
      eq(loungeReservations.statusId, reservationStatuses.id),
    )
    .where(
      and(
        eq(loungeReservations.loungeId, input.loungeId),
        eq(loungeReservations.eventId, input.eventId),
      ),
    )
    .limit(1);

  if (existing && existing.status !== "Cancelled") {
    throw new Error("Duplicate lounge reservation");
  }

  const money = {
    fullPrice: input.fullPrice.toFixed(2),
    depositAmount: input.depositAmount.toFixed(2),
    depositPaidAt: null as Date | null,
    stripeSessionId: null as string | null,
  };

  if (existing) {
    await db
      .update(loungeReservations)
      .set({
        userId: input.userId,
        statusId: pending.id,
        ...money,
      })
      .where(eq(loungeReservations.id, existing.id));
    return existing.id;
  }

  const [inserted] = await db.insert(loungeReservations).values({
    loungeId: input.loungeId,
    eventId: input.eventId,
    userId: input.userId,
    statusId: pending.id,
    ...money,
  });

  return Number(inserted.insertId);
}

export async function getPromotorDashboard(userId: number) {
  const [wallet] = await db
    .select()
    .from(promotorWallets)
    .where(eq(promotorWallets.userId, userId))
    .limit(1);

  if (!wallet) return null;

  const [balanceRow] = await db
    .select({
      balance: sql<string>`COALESCE(SUM(${promotorWalletTransactions.value}), 0)`,
    })
    .from(promotorWalletTransactions)
    .where(eq(promotorWalletTransactions.walletId, wallet.id));

  const recentTickets = await db
    .select({
      id: tickets.id,
      number: tickets.number,
      price: tickets.price,
      isRealized: tickets.isRealized,
      createdAt: tickets.createdAt,
      eventId: tickets.eventId,
    })
    .from(tickets)
    .where(eq(tickets.promotorId, userId))
    .orderBy(desc(tickets.createdAt))
    .limit(20);

  const [checkIns] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tickets)
    .where(and(eq(tickets.promotorId, userId), eq(tickets.isRealized, true)));

  const [referrals] = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(tickets)
    .where(eq(tickets.promotorId, userId));

  const recentPayouts = await db
    .select({
      id: promotorPayoutRequests.id,
      amount: promotorPayoutRequests.amount,
      bankAccount: promotorPayoutRequests.bankAccount,
      status: promotorPayoutRequests.status,
      createdAt: promotorPayoutRequests.createdAt,
    })
    .from(promotorPayoutRequests)
    .where(eq(promotorPayoutRequests.walletId, wallet.id))
    .orderBy(desc(promotorPayoutRequests.createdAt))
    .limit(10);

  return {
    walletId: wallet.id,
    code: wallet.accountNumber ?? `P${userId}`,
    balance: Number(balanceRow?.balance ?? 0),
    bankAccount: wallet.bankAccount,
    bankAccountHolder: wallet.bankAccountHolder,
    checkIns: Number(checkIns?.count ?? 0),
    referrals: Number(referrals?.count ?? 0),
    commissionPercent: getPromoterCommissionPercent(),
    recentTickets,
    recentPayouts: recentPayouts.map((p) => ({
      id: p.id,
      amount: Number(p.amount),
      bankAccount: p.bankAccount,
      status: p.status,
      createdAt:
        p.createdAt instanceof Date
          ? p.createdAt.toISOString()
          : String(p.createdAt),
    })),
  };
}

export async function requestPromoterPayout(input: {
  userId: number;
  amount: number;
  bankAccount: string;
  bankAccountHolder?: string | null;
}) {
  const bankAccount = input.bankAccount.replace(/\s+/g, "").toUpperCase();
  if (bankAccount.length < 8 || bankAccount.length > 34) {
    throw new Error("Podaj prawidłowy numer konta / IBAN (8–34 znaków).");
  }
  if (!(input.amount > 0)) {
    throw new Error("Kwota wypłaty musi być większa od 0.");
  }

  const [payoutType] = await db
    .select()
    .from(transactionTypes)
    .where(eq(transactionTypes.name, "PromotorPayout"))
    .limit(1);
  if (!payoutType) throw new Error("Brak typu transakcji PromotorPayout.");

  const amount = Math.round(input.amount * 100) / 100;
  const holder = input.bankAccountHolder?.trim() || null;

  // Blokada wiersza portfela serializuje równoległe wypłaty tego samego promotora.
  return db.transaction(async (tx) => {
    const [wallet] = await tx
      .select()
      .from(promotorWallets)
      .where(eq(promotorWallets.userId, input.userId))
      .for("update")
      .limit(1);
    if (!wallet) throw new Error("Brak portfela promotora.");

    const [balanceRow] = await tx
      .select({
        balance: sql<string>`COALESCE(SUM(${promotorWalletTransactions.value}), 0)`,
      })
      .from(promotorWalletTransactions)
      .where(eq(promotorWalletTransactions.walletId, wallet.id));

    const balance = Number(balanceRow?.balance ?? 0);
    if (amount > balance + 1e-9) {
      throw new Error(`Niewystarczające saldo (dostępne: ${balance.toFixed(2)} PLN).`);
    }

    await tx
      .update(promotorWallets)
      .set({
        bankAccount,
        bankAccountHolder: holder,
      })
      .where(eq(promotorWallets.id, wallet.id));

    const payoutResult = await tx.insert(promotorPayoutRequests).values({
      walletId: wallet.id,
      amount: amount.toFixed(2),
      bankAccount,
      bankAccountHolder: holder,
      status: "Pending",
    });
    const payoutId = Number(payoutResult[0].insertId);

    await tx.insert(promotorWalletTransactions).values({
      walletId: wallet.id,
      value: (-amount).toFixed(2),
      transactionTypeId: payoutType.id,
      description: `Wypłata #${payoutId} · ${bankAccount} · do 3 dni roboczych`,
    });

    return {
      payoutId,
      amount,
      bankAccount,
      balanceAfter: Math.round((balance - amount) * 100) / 100,
    };
  });
}

export async function getUserReservations(userId: number) {
  const rows = await db
    .select({
      id: loungeReservations.id,
      createdAt: loungeReservations.createdAt,
      loungeName: lounges.name,
      levelName: levels.name,
      fullPrice: loungeReservations.fullPrice,
      depositAmount: loungeReservations.depositAmount,
      depositPaidAt: loungeReservations.depositPaidAt,
      eventId: events.id,
      eventStartsAt: events.startsAt,
      eventTitle: events.title,
      eventDescription: events.description,
      status: reservationStatuses.name,
    })
    .from(loungeReservations)
    .innerJoin(lounges, eq(loungeReservations.loungeId, lounges.id))
    .innerJoin(levels, eq(lounges.levelId, levels.id))
    .innerJoin(events, eq(loungeReservations.eventId, events.id))
    .innerJoin(
      reservationStatuses,
      eq(loungeReservations.statusId, reservationStatuses.id),
    )
    .where(eq(loungeReservations.userId, userId))
    .orderBy(desc(loungeReservations.createdAt));

  return rows.map((row) => ({
    id: row.id,
    loungeName: row.loungeName,
    levelName: row.levelName,
    eventId: row.eventId,
    eventTitle: deriveTitle(row.eventTitle, row.eventDescription, null, row.eventId),
    eventStartsAt: toIso(row.eventStartsAt) ?? "",
    status: row.status,
    fullPrice: row.fullPrice != null ? Number(row.fullPrice) : null,
    depositAmount: row.depositAmount != null ? Number(row.depositAmount) : null,
    depositPaid: !!row.depositPaidAt,
    createdAt: toIso(row.createdAt) ?? "",
  }));
}

export async function getUserActiveTickets(userId: number) {
  const rows = await db
    .select({
      id: tickets.id,
      number: tickets.number,
      price: tickets.price,
      isRealized: tickets.isRealized,
      createdAt: tickets.createdAt,
      eventId: events.id,
      eventStartsAt: events.startsAt,
      eventTitle: events.title,
      eventDescription: events.description,
      ticketType: ticketTypes.name,
    })
    .from(tickets)
    .innerJoin(events, eq(tickets.eventId, events.id))
    .innerJoin(eventTicketLevels, eq(tickets.ticketLevelId, eventTicketLevels.id))
    .innerJoin(ticketTypes, eq(eventTicketLevels.ticketTypeId, ticketTypes.id))
    .where(
      and(
        eq(tickets.ownerId, userId),
        isNull(tickets.cancelledAt),
        eq(tickets.isRealized, false),
      ),
    )
    .orderBy(asc(events.startsAt));

  return rows.map((row) => ({
    id: row.id,
    number: row.number,
    price: String(row.price),
    ticketType: row.ticketType,
    eventId: row.eventId,
    eventTitle: deriveTitle(row.eventTitle, row.eventDescription, null, row.eventId),
    eventStartsAt: toIso(row.eventStartsAt) ?? "",
    createdAt: toIso(row.createdAt) ?? "",
  }));
}
