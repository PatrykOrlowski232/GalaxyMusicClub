import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { writeAudit } from "@/server/admin";

export type DoorCheckInResult =
  | {
      ok: true;
      ticket: {
        id: number;
        number: string;
        eventId: number;
        ownerId: number;
        realizedAt: string | null;
        alreadyRealized: boolean;
      };
    }
  | { ok: false; reason: "not_found" | "cancelled" };

export async function checkInTicketByNumber(
  number: string,
  staffUserId: number,
): Promise<DoorCheckInResult> {
  const code = number.trim().toUpperCase();
  if (!code) return { ok: false, reason: "not_found" };

  const result = await db.transaction(async (tx) => {
    const [ticket] = await tx
      .select()
      .from(tickets)
      .where(eq(tickets.number, code))
      .for("update")
      .limit(1);

    if (!ticket) return { ok: false as const, reason: "not_found" as const };
    if (ticket.cancelledAt) return { ok: false as const, reason: "cancelled" as const };

    if (ticket.isRealized) {
      return {
        ok: true as const,
        ticket: {
          id: ticket.id,
          number: ticket.number,
          eventId: ticket.eventId,
          ownerId: ticket.ownerId,
          realizedAt:
            ticket.realizedAt instanceof Date
              ? ticket.realizedAt.toISOString()
              : ticket.realizedAt
                ? String(ticket.realizedAt)
                : null,
          alreadyRealized: true,
        },
      };
    }

    const now = new Date();
    await tx
      .update(tickets)
      .set({ isRealized: true, realizedAt: now })
      .where(
        and(
          eq(tickets.id, ticket.id),
          eq(tickets.isRealized, false),
          isNull(tickets.cancelledAt),
        ),
      );

    return {
      ok: true as const,
      ticket: {
        id: ticket.id,
        number: ticket.number,
        eventId: ticket.eventId,
        ownerId: ticket.ownerId,
        realizedAt: now.toISOString(),
        alreadyRealized: false,
      },
    };
  });

  if (result.ok && !result.ticket.alreadyRealized) {
    await writeAudit({
      userId: staffUserId,
      action: "UPDATE",
      entityType: "tickets",
      entityId: result.ticket.id,
      newValue: { isRealized: true, via: "door_scanner" },
    });
  }

  return result;
}
