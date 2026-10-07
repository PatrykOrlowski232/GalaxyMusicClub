import {
  and,
  asc,
  desc,
  eq,
  sql,
} from "drizzle-orm";
import { db } from "@/db";
import {
  accountTypes,
  artists,
  auditLogs,
  eventTicketLevels,
  events,
  levels,
  loungeReservations,
  lounges,
  parties,
  partyLineup,
  reservationStatuses,
  ticketTypes,
  tickets,
  userAccountTypes,
  users,
} from "@/db/schema";
import { toMysqlDateTime } from "@/lib/datetime";

export async function writeAudit(input: {
  userId: number | null;
  action: "CREATE" | "UPDATE" | "DELETE";
  entityType: string;
  entityId?: number | null;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  await db.insert(auditLogs).values({
    userId: input.userId ?? null,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId ?? null,
    oldValue: input.oldValue ?? null,
    newValue: input.newValue ?? null,
  });
}

export async function adminListUsers() {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      isNewsletterMember: users.isNewsletterMember,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  const roles = await db
    .select({
      userId: userAccountTypes.userId,
      role: accountTypes.name,
    })
    .from(userAccountTypes)
    .innerJoin(accountTypes, eq(userAccountTypes.accountTypeId, accountTypes.id));

  return rows.map((u) => ({
    ...u,
    roles: roles.filter((r) => r.userId === u.id).map((r) => r.role),
  }));
}

export async function adminSetUserRoles(userId: number, roleNames: string[]) {
  const allRoles = await db.select().from(accountTypes);
  const wanted = allRoles.filter((r) => roleNames.includes(r.name));

  await db.delete(userAccountTypes).where(eq(userAccountTypes.userId, userId));
  if (wanted.length) {
    await db.insert(userAccountTypes).values(
      wanted.map((r) => ({ userId, accountTypeId: r.id })),
    );
  }
}

export async function adminListEvents() {
  return db.select().from(events).orderBy(desc(events.startsAt));
}

export async function adminCreateEvent(data: {
  title?: string | null;
  startsAt: string;
  endsAt?: string | null;
  description?: string | null;
  graphicUrl?: string | null;
  ticketUrl?: string | null;
}) {
  const startsAt = toMysqlDateTime(data.startsAt);
  const endsAt = data.endsAt ? toMysqlDateTime(data.endsAt) : null;
  const result = await db.insert(events).values({
    title: data.title?.trim() || null,
    // String DATETIME — bez konwersji stref przez JS Date
    startsAt: sql`${startsAt}`,
    endsAt: endsAt ? sql`${endsAt}` : null,
    description: data.description ?? null,
    graphicUrl: data.graphicUrl ?? null,
    ticketUrl: data.ticketUrl ?? null,
  });
  return Number(result[0].insertId);
}

export async function adminUpdateEvent(
  id: number,
  data: {
    title?: string | null;
    startsAt?: string;
    endsAt?: string | null;
    description?: string | null;
    graphicUrl?: string | null;
    ticketUrl?: string | null;
  },
) {
  await db
    .update(events)
    .set({
      ...(data.title !== undefined ? { title: data.title?.trim() || null } : {}),
      ...(data.startsAt
        ? { startsAt: sql`${toMysqlDateTime(data.startsAt)}` }
        : {}),
      ...(data.endsAt !== undefined
        ? {
            endsAt: data.endsAt
              ? sql`${toMysqlDateTime(data.endsAt)}`
              : null,
          }
        : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.graphicUrl !== undefined ? { graphicUrl: data.graphicUrl } : {}),
      ...(data.ticketUrl !== undefined ? { ticketUrl: data.ticketUrl } : {}),
    })
    .where(eq(events.id, id));
}

export async function adminDeleteEvent(id: number) {
  const partyRows = await db
    .select({ id: parties.id })
    .from(parties)
    .where(eq(parties.eventId, id));
  for (const party of partyRows) {
    await db.delete(partyLineup).where(eq(partyLineup.partyId, party.id));
  }
  await db.delete(parties).where(eq(parties.eventId, id));
  await db.delete(eventTicketLevels).where(eq(eventTicketLevels.eventId, id));
  await db.delete(loungeReservations).where(eq(loungeReservations.eventId, id));
  await db.delete(events).where(eq(events.id, id));
}

export async function adminListLounges() {
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

export async function adminCreateLounge(data: {
  name: string;
  levelId: number;
  price: number;
}) {
  const result = await db.insert(lounges).values({
    name: data.name,
    levelId: data.levelId,
    price: data.price.toFixed(2),
  });
  return Number(result[0].insertId);
}

export async function adminUpdateLounge(
  id: number,
  data: { name?: string; levelId?: number; price?: number },
) {
  await db
    .update(lounges)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.levelId !== undefined ? { levelId: data.levelId } : {}),
      ...(data.price !== undefined ? { price: data.price.toFixed(2) } : {}),
    })
    .where(eq(lounges.id, id));
}

export async function adminDeleteLounge(id: number) {
  await db.delete(loungeReservations).where(eq(loungeReservations.loungeId, id));
  await db.delete(lounges).where(eq(lounges.id, id));
}

export async function adminListLevels() {
  return db.select().from(levels).orderBy(asc(levels.id));
}

export async function adminListReservations() {
  return db
    .select({
      id: loungeReservations.id,
      loungeId: loungeReservations.loungeId,
      loungeName: lounges.name,
      eventId: loungeReservations.eventId,
      userId: loungeReservations.userId,
      userEmail: users.email,
      statusId: loungeReservations.statusId,
      status: reservationStatuses.name,
      fullPrice: loungeReservations.fullPrice,
      depositAmount: loungeReservations.depositAmount,
      depositPaidAt: loungeReservations.depositPaidAt,
      createdAt: loungeReservations.createdAt,
    })
    .from(loungeReservations)
    .innerJoin(lounges, eq(loungeReservations.loungeId, lounges.id))
    .innerJoin(users, eq(loungeReservations.userId, users.id))
    .innerJoin(
      reservationStatuses,
      eq(loungeReservations.statusId, reservationStatuses.id),
    )
    .orderBy(desc(loungeReservations.createdAt));
}

export async function adminUpdateReservationStatus(id: number, statusId: number) {
  await db
    .update(loungeReservations)
    .set({ statusId })
    .where(eq(loungeReservations.id, id));
}

export async function adminDeleteReservation(id: number) {
  await db.delete(loungeReservations).where(eq(loungeReservations.id, id));
}

export async function adminListReservationStatuses() {
  return db.select().from(reservationStatuses).orderBy(asc(reservationStatuses.id));
}

export async function adminListTickets() {
  return db
    .select({
      id: tickets.id,
      number: tickets.number,
      price: tickets.price,
      eventId: tickets.eventId,
      ownerId: tickets.ownerId,
      ownerEmail: users.email,
      ticketLevelId: tickets.ticketLevelId,
      promotorId: tickets.promotorId,
      isRealized: tickets.isRealized,
      createdAt: tickets.createdAt,
      realizedAt: tickets.realizedAt,
      cancelledAt: tickets.cancelledAt,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.ownerId, users.id))
    .orderBy(desc(tickets.createdAt))
    .limit(200);
}

export async function adminCreateTicket(data: {
  eventId: number;
  ticketLevelId: number;
  ownerId: number;
  number: string;
  price: string;
  promotorId?: number | null;
}) {
  const result = await db.insert(tickets).values({
    eventId: data.eventId,
    ticketLevelId: data.ticketLevelId,
    ownerId: data.ownerId,
    number: data.number,
    price: data.price,
    promotorId: data.promotorId ?? null,
  });
  return Number(result[0].insertId);
}

export async function adminUpdateTicket(
  id: number,
  data: {
    isRealized?: boolean;
    cancelledAt?: string | null;
    price?: string;
    promotorId?: number | null;
  },
) {
  await db
    .update(tickets)
    .set({
      ...(data.isRealized !== undefined
        ? {
            isRealized: data.isRealized,
            realizedAt: data.isRealized ? new Date() : null,
          }
        : {}),
      ...(data.cancelledAt !== undefined
        ? { cancelledAt: data.cancelledAt ? new Date(data.cancelledAt) : null }
        : {}),
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.promotorId !== undefined ? { promotorId: data.promotorId } : {}),
    })
    .where(eq(tickets.id, id));
}

export async function adminDeleteTicket(id: number) {
  await db.delete(tickets).where(eq(tickets.id, id));
}

export async function adminListArtists() {
  return db.select().from(artists).orderBy(asc(artists.name));
}

export async function adminCreateArtist(data: {
  name: string;
  info?: string | null;
  photoUrl?: string | null;
  description?: string | null;
}) {
  const info = data.info ?? data.description ?? null;
  const result = await db.insert(artists).values({
    name: data.name,
    info,
    photoUrl: data.photoUrl ?? null,
    description: data.description ?? info,
  });
  return Number(result[0].insertId);
}

export async function adminUpdateArtist(
  id: number,
  data: {
    name?: string;
    info?: string | null;
    photoUrl?: string | null;
    description?: string | null;
  },
) {
  const info =
    data.info !== undefined
      ? data.info
      : data.description !== undefined
        ? data.description
        : undefined;
  await db
    .update(artists)
    .set({
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(info !== undefined ? { info, description: info } : {}),
      ...(data.photoUrl !== undefined ? { photoUrl: data.photoUrl } : {}),
    })
    .where(eq(artists.id, id));
}

export async function adminDeleteArtist(id: number) {
  await db.delete(artists).where(eq(artists.id, id));
}

export async function adminListTicketLevels() {
  return db
    .select({
      id: eventTicketLevels.id,
      eventId: eventTicketLevels.eventId,
      ticketTypeId: eventTicketLevels.ticketTypeId,
      ticketType: ticketTypes.name,
      price: eventTicketLevels.price,
      quantity: eventTicketLevels.quantity,
      createdAt: eventTicketLevels.createdAt,
    })
    .from(eventTicketLevels)
    .innerJoin(ticketTypes, eq(eventTicketLevels.ticketTypeId, ticketTypes.id))
    .orderBy(desc(eventTicketLevels.id));
}

export async function adminCreateTicketLevel(data: {
  eventId: number;
  ticketTypeId: number;
  price: string;
  quantity?: number | null;
}) {
  const result = await db.insert(eventTicketLevels).values({
    eventId: data.eventId,
    ticketTypeId: data.ticketTypeId,
    price: data.price,
    quantity: data.quantity ?? null,
  });
  return Number(result[0].insertId);
}

export async function adminUpdateTicketLevel(
  id: number,
  data: { price?: string; quantity?: number | null },
) {
  await db
    .update(eventTicketLevels)
    .set({
      ...(data.price !== undefined ? { price: data.price } : {}),
      ...(data.quantity !== undefined ? { quantity: data.quantity } : {}),
    })
    .where(eq(eventTicketLevels.id, id));
}

export async function adminDeleteTicketLevel(id: number) {
  await db.delete(eventTicketLevels).where(eq(eventTicketLevels.id, id));
}

export async function adminListTicketTypes() {
  return db.select().from(ticketTypes).orderBy(asc(ticketTypes.id));
}

export async function adminListAccountTypes() {
  return db.select().from(accountTypes).orderBy(asc(accountTypes.id));
}

async function syncPartyLineupText(partyId: number) {
  const rows = await db
    .select({ name: artists.name, position: partyLineup.position })
    .from(partyLineup)
    .innerJoin(artists, eq(partyLineup.artistId, artists.id))
    .where(eq(partyLineup.partyId, partyId))
    .orderBy(asc(partyLineup.position), asc(artists.name));
  const text = rows.map((r) => r.name).join(" · ") || null;
  await db.update(parties).set({ lineup: text }).where(eq(parties.id, partyId));
}

export async function adminListParties(eventId?: number) {
  const baseQuery = db
    .select({
      id: parties.id,
      eventId: parties.eventId,
      levelId: parties.levelId,
      levelName: levels.name,
      musicType: parties.musicType,
      lineup: parties.lineup,
    })
    .from(parties)
    .innerJoin(levels, eq(parties.levelId, levels.id));

  const partyRows = eventId
    ? await baseQuery
        .where(eq(parties.eventId, eventId))
        .orderBy(asc(levels.id), asc(parties.id))
    : await baseQuery.orderBy(asc(parties.eventId), asc(levels.id), asc(parties.id));

  const result = [];
  for (const party of partyRows) {
    const djRows = await db
      .select({
        id: artists.id,
        name: artists.name,
        photoUrl: artists.photoUrl,
        position: partyLineup.position,
      })
      .from(partyLineup)
      .innerJoin(artists, eq(partyLineup.artistId, artists.id))
      .where(eq(partyLineup.partyId, party.id))
      .orderBy(asc(partyLineup.position), asc(artists.name));

    result.push({
      ...party,
      artists: djRows,
    });
  }
  return result;
}

export async function adminCreateParty(data: {
  eventId: number;
  levelId: number;
  musicType?: string | null;
}) {
  const result = await db.insert(parties).values({
    eventId: data.eventId,
    levelId: data.levelId,
    musicType: data.musicType?.trim() || null,
    lineup: null,
  });
  return Number(result[0].insertId);
}

export async function adminUpdateParty(
  id: number,
  data: { levelId?: number; musicType?: string | null },
) {
  await db
    .update(parties)
    .set({
      ...(data.levelId !== undefined ? { levelId: data.levelId } : {}),
      ...(data.musicType !== undefined
        ? { musicType: data.musicType?.trim() || null }
        : {}),
    })
    .where(eq(parties.id, id));
}

export async function adminDeleteParty(id: number) {
  await db.delete(partyLineup).where(eq(partyLineup.partyId, id));
  await db.delete(parties).where(eq(parties.id, id));
}

export async function adminAddPartyArtist(data: {
  partyId: number;
  artistId: number;
  position?: number | null;
}) {
  const existing = await db
    .select({ artistId: partyLineup.artistId, position: partyLineup.position })
    .from(partyLineup)
    .where(eq(partyLineup.partyId, data.partyId));

  if (existing.some((r) => r.artistId === data.artistId)) {
    throw new Error("DJ już jest w tej imprezie.");
  }

  const nums = existing
    .map((r) => r.position)
    .filter((p): p is number => p != null);
  const nextPos =
    data.position ?? (nums.length ? Math.max(...nums) + 1 : existing.length + 1);

  await db.insert(partyLineup).values({
    partyId: data.partyId,
    artistId: data.artistId,
    position: nextPos,
  });
  await syncPartyLineupText(data.partyId);
  return { partyId: data.partyId, artistId: data.artistId, position: nextPos };
}

export async function adminRemovePartyArtist(partyId: number, artistId: number) {
  await db
    .delete(partyLineup)
    .where(
      and(eq(partyLineup.partyId, partyId), eq(partyLineup.artistId, artistId)),
    );
  await syncPartyLineupText(partyId);
}

export async function adminStats() {
  const [u] = await db.select({ c: sql<number>`COUNT(*)` }).from(users);
  const [e] = await db.select({ c: sql<number>`COUNT(*)` }).from(events);
  const [t] = await db.select({ c: sql<number>`COUNT(*)` }).from(tickets);
  const [r] = await db.select({ c: sql<number>`COUNT(*)` }).from(loungeReservations);
  return {
    users: Number(u?.c ?? 0),
    events: Number(e?.c ?? 0),
    tickets: Number(t?.c ?? 0),
    reservations: Number(r?.c ?? 0),
  };
}
