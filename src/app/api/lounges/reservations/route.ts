import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  auditLogs,
  events,
  loungeReservations,
  lounges,
  reservationStatuses,
} from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isStripeConfigured } from "@/lib/stripe";
import {
  cancelUnpaidLoungeReservation,
  createLoungeDepositCheckout,
} from "@/server/checkout";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  loungeId: z.number().int().positive(),
  eventId: z.number().int().positive(),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Zaloguj się, aby zarezerwować lożę.", 401);

    if (!isStripeConfigured()) {
      return jsonError("Płatność zaliczki wymaga Stripe (STRIPE_SECRET_KEY).", 503);
    }

    const body = schema.parse(await request.json());

    const [lounge] = await db
      .select()
      .from(lounges)
      .where(eq(lounges.id, body.loungeId))
      .limit(1);
    if (!lounge) return jsonError("Loża nie istnieje.", 404);
    if (!(Number(lounge.price) > 0)) {
      return jsonError("Loża nie ma ustawionej ceny.", 400);
    }

    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, body.eventId))
      .limit(1);
    if (!event) return jsonError("Event nie istnieje.", 404);

    const taken = await db
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
          eq(loungeReservations.loungeId, body.loungeId),
          eq(loungeReservations.eventId, body.eventId),
        ),
      );

    if (taken.some((r) => r.status !== "Cancelled")) {
      return jsonError("Ta loża jest już zarezerwowana na ten event.", 409);
    }

    const result = await createLoungeDepositCheckout({
      userId: user.id,
      userEmail: user.email,
      loungeId: body.loungeId,
      eventId: body.eventId,
    });

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "CREATE",
      entityType: "lounge_reservations",
      entityId: result.reservationId,
      newValue: {
        ...body,
        depositAmount: result.depositAmount,
        fullPrice: result.fullPrice,
      },
    });

    return jsonOk(
      {
        id: result.reservationId,
        url: result.url,
        fullPrice: result.fullPrice,
        depositAmount: result.depositAmount,
        depositRate: 0.2,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Duplicate") || msg.includes("uq_lounge_reservations")) {
      return jsonError("Ta loża jest już zarezerwowana na ten event.", 409);
    }
    if (msg.includes("STRIPE_SECRET_KEY")) {
      return jsonError(msg, 503);
    }
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna.", 503);
    }
    console.error(error);
    return jsonError(msg || "Nie udało się utworzyć rezerwacji.", 500);
  }
}

const cancelSchema = z.object({
  reservationId: z.number().int().positive(),
});

export async function DELETE(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Zaloguj się.", 401);

    const body = cancelSchema.parse(await request.json());
    await cancelUnpaidLoungeReservation(body.reservationId, user.id);

    await db.insert(auditLogs).values({
      userId: user.id,
      action: "CANCEL",
      entityType: "lounge_reservations",
      entityId: body.reservationId,
    });

    return jsonOk({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(error)) return jsonError("Baza niedostępna.", 503);
    const msg = error instanceof Error ? error.message : "Anulowanie nie powiodło się.";
    return jsonError(msg, 400);
  }
}
