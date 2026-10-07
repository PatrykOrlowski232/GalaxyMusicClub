import { randomInt } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import {
  eventTicketLevels,
  loungeReservations,
  lounges,
  orderItems,
  orderStatuses,
  orders,
  paymentStatuses,
  payments,
  promotorWalletTransactions,
  promotorWallets,
  reservationStatuses,
  ticketTypes,
  tickets,
  transactionStates,
  transactionTypes,
  transactions,
} from "@/db/schema";
import { loungeDepositAmount } from "@/lib/lounges";
import { captureMessage } from "@/lib/monitoring";
import { getPromoterCommissionRate } from "@/lib/promoter";
import { getAppUrl, getStripe } from "@/lib/stripe";
import { isStripeSessionPaid } from "@/lib/stripe-session";
import { createLoungeReservation } from "@/server/queries";

type Executor = typeof db;

/** Stripe wymaga min. 30 min — tyle trzymamy rezerwację biletów. */
const CHECKOUT_TTL_SEC = 30 * 60;

async function statusId(
  table: typeof orderStatuses | typeof paymentStatuses | typeof transactionStates,
  name: string,
) {
  const [row] = await db.select().from(table).where(eq(table.name, name)).limit(1);
  if (!row) throw new Error(`Brak statusu/słownika: ${name}`);
  return row.id;
}

async function typeId(name: string) {
  const [row] = await db
    .select()
    .from(transactionTypes)
    .where(eq(transactionTypes.name, name))
    .limit(1);
  if (!row) throw new Error(`Brak transaction_type: ${name}`);
  return row.id;
}

async function optionalTypeId(name: string) {
  try {
    return await typeId(name);
  } catch {
    return null;
  }
}

const TICKET_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function ticketNumber(eventId: number) {
  let rand = "";
  for (let i = 0; i < 10; i++) rand += TICKET_ALPHABET[randomInt(TICKET_ALPHABET.length)];
  return `GLX-${eventId}-${rand}`;
}

export async function createCheckoutSession(input: {
  userId: number;
  userEmail: string;
  eventTicketLevelId: number;
  quantity: number;
  promoterCode?: string | null;
}) {
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > 10) {
    throw new Error("Ilość biletów musi być od 1 do 10.");
  }

  const [level] = await db
    .select({
      id: eventTicketLevels.id,
      eventId: eventTicketLevels.eventId,
      price: eventTicketLevels.price,
      ticketType: ticketTypes.name,
    })
    .from(eventTicketLevels)
    .innerJoin(ticketTypes, eq(eventTicketLevels.ticketTypeId, ticketTypes.id))
    .where(eq(eventTicketLevels.id, input.eventTicketLevelId))
    .limit(1);

  if (!level) throw new Error("Oferta biletu nie istnieje.");

  const unit = Number(level.price);
  const total = unit * input.quantity;
  const isFree = total <= 0;
  const orderStatus = await statusId(orderStatuses, isFree ? "Paid" : "AwaitingPayment");
  const pendingPayId = isFree ? null : await statusId(paymentStatuses, "Pending");

  let promoterUserId: number | null = null;
  if (input.promoterCode) {
    const [wallet] = await db
      .select()
      .from(promotorWallets)
      .where(eq(promotorWallets.accountNumber, input.promoterCode.toUpperCase()))
      .limit(1);
    promoterUserId = wallet?.userId ?? null;
  }

  // Limit biletów jest rezerwowany od razu (także dla płatnych) — zwalniany przy wygaśnięciu sesji.
  const { orderId, paymentId } = await db.transaction(async (tx) => {
    const [locked] = await tx
      .select()
      .from(eventTicketLevels)
      .where(eq(eventTicketLevels.id, level.id))
      .for("update")
      .limit(1);

    if (!locked) throw new Error("Oferta biletu nie istnieje.");
    if (locked.quantity !== null && locked.quantity < input.quantity) {
      throw new Error("Brak wystarczającej liczby biletów.");
    }

    const orderResult = await tx.insert(orders).values({
      userId: input.userId,
      eventId: level.eventId,
      value: total.toFixed(2),
      statusId: orderStatus,
    });
    const newOrderId = Number(orderResult[0].insertId);

    await tx.insert(orderItems).values({
      orderId: newOrderId,
      eventTicketLevelId: level.id,
      quantity: input.quantity,
      unitPrice: unit.toFixed(2),
      totalPrice: total.toFixed(2),
    });

    if (locked.quantity !== null) {
      await tx
        .update(eventTicketLevels)
        .set({ quantity: locked.quantity - input.quantity })
        .where(eq(eventTicketLevels.id, level.id));
    }

    if (isFree) {
      await issueTicketsForOrder(tx, {
        userId: input.userId,
        eventId: level.eventId,
        eventTicketLevelId: level.id,
        quantity: input.quantity,
        unitPrice: "0.00",
        promoterUserId,
      });
      return { orderId: newOrderId, paymentId: null };
    }

    const paymentResult = await tx.insert(payments).values({
      orderId: newOrderId,
      value: total.toFixed(2),
      provider: "stripe",
      providerPaymentId: null,
      statusId: pendingPayId!,
    });
    return { orderId: newOrderId, paymentId: Number(paymentResult[0].insertId) };
  });

  if (isFree) {
    return {
      mode: "free" as const,
      url: `${getAppUrl()}/checkout/success?order_id=${orderId}&free=1`,
      orderId,
    };
  }

  let session;
  try {
    const stripe = getStripe();
    session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: input.userEmail,
      expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SEC,
      line_items: [
        {
          quantity: input.quantity,
          price_data: {
            currency: "pln",
            unit_amount: Math.round(unit * 100),
            product_data: {
              name: `Galaxy · ${level.ticketType}`,
              description: `Event #${level.eventId}`,
            },
          },
        },
      ],
      success_url: `${getAppUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
      cancel_url: `${getAppUrl()}/checkout/cancel?order_id=${orderId}`,
      metadata: {
        orderId: String(orderId),
        paymentId: String(paymentId),
        userId: String(input.userId),
        promoterUserId: promoterUserId ? String(promoterUserId) : "",
      },
    });

    await db
      .update(payments)
      .set({ providerPaymentId: session.id })
      .where(eq(payments.id, paymentId!));
  } catch (error) {
    await releaseOrderReservation(orderId);
    throw error;
  }

  if (!session.url) throw new Error("Stripe nie zwrócił URL sesji.");

  return {
    mode: "stripe" as const,
    url: session.url,
    orderId,
    sessionId: session.id,
  };
}

export type StripeSessionLike = {
  id: string;
  payment_status?: string | null;
  metadata?: Record<string, string> | null;
  amount_total?: number | null;
};

export async function fulfillCheckoutSession(session: StripeSessionLike) {
  if (!isStripeSessionPaid(session.payment_status)) {
    return { ok: false as const, reason: "not_paid" };
  }

  const meta = session.metadata ?? {};
  if (meta.kind === "lounge_deposit") {
    return fulfillLoungeDeposit(session);
  }

  const paymentId = Number(meta.paymentId);
  const promoterUserId = meta.promoterUserId ? Number(meta.promoterUserId) : null;
  if (!paymentId) throw new Error("Brak metadanych sesji Stripe.");

  const paidPayId = await statusId(paymentStatuses, "Paid");
  const paidOrderId = await statusId(orderStatuses, "Paid");
  const cancelledOrderId = await statusId(orderStatuses, "Cancelled");
  const completedTx = await statusId(transactionStates, "Completed");
  const ticketSaleType = await typeId("TicketSale");
  const commissionType = promoterUserId ? await typeId("PromotorCommission") : null;

  const result = await db.transaction(async (tx) => {
    const [payment] = await tx
      .select()
      .from(payments)
      .where(eq(payments.id, paymentId))
      .for("update")
      .limit(1);

    if (!payment) throw new Error("Payment not found");
    if (payment.providerPaymentId && payment.providerPaymentId !== session.id) {
      throw new Error("Sesja Stripe nie pasuje do płatności.");
    }
    if (payment.statusId === paidPayId) {
      return { ok: true as const, already: true, orderId: payment.orderId, oversold: null };
    }

    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, payment.orderId))
      .for("update")
      .limit(1);
    if (!order || !order.eventId) throw new Error("Zamówienie nie istnieje.");

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, order.id));
    if (items.length === 0) throw new Error("Zamówienie bez pozycji.");

    // Rezerwacja została zwolniona (sesja wygasła / anulowana) — pobierz limit ponownie.
    const oversold: { eventTicketLevelId: number; stock: number; quantity: number }[] = [];
    if (order.statusId === cancelledOrderId) {
      for (const item of items) {
        const [level] = await tx
          .select()
          .from(eventTicketLevels)
          .where(eq(eventTicketLevels.id, item.eventTicketLevelId))
          .for("update")
          .limit(1);
        if (level?.quantity == null) continue;
        if (level.quantity < item.quantity) {
          oversold.push({
            eventTicketLevelId: item.eventTicketLevelId,
            stock: level.quantity,
            quantity: item.quantity,
          });
        }
        await tx
          .update(eventTicketLevels)
          .set({ quantity: Math.max(0, level.quantity - item.quantity) })
          .where(eq(eventTicketLevels.id, item.eventTicketLevelId));
      }
    }

    const gross =
      session.amount_total != null ? session.amount_total / 100 : Number(payment.value);

    await tx
      .update(payments)
      .set({
        statusId: paidPayId,
        paidAt: new Date(),
        providerPaymentId: session.id,
        value: gross.toFixed(2),
      })
      .where(eq(payments.id, paymentId));

    await tx.update(orders).set({ statusId: paidOrderId }).where(eq(orders.id, order.id));

    for (const item of items) {
      await issueTicketsForOrder(tx, {
        userId: order.userId,
        eventId: order.eventId,
        eventTicketLevelId: item.eventTicketLevelId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        promoterUserId,
      });
    }

    await tx.insert(transactions).values({
      userId: order.userId,
      value: gross.toFixed(2),
      dateOf: new Date(),
      transactionTypeId: ticketSaleType,
      stateId: completedTx,
    });

    if (promoterUserId && commissionType) {
      const [wallet] = await tx
        .select()
        .from(promotorWallets)
        .where(eq(promotorWallets.userId, promoterUserId))
        .limit(1);
      const rate = getPromoterCommissionRate();
      const commission = (gross * rate).toFixed(2);
      if (wallet && Number(commission) > 0) {
        await tx.insert(promotorWalletTransactions).values({
          walletId: wallet.id,
          value: commission,
          transactionTypeId: commissionType,
          description: `Prowizja ${Math.round(rate * 100)}% · order #${order.id}`,
        });
      }
    }

    return { ok: true as const, already: false, orderId: order.id, oversold };
  });

  if (result.oversold?.length) {
    await captureMessage("Stripe fulfill: opłacono po zwolnieniu limitu (oversell)", {
      orderId: result.orderId,
      sessionId: session.id,
      levels: result.oversold,
    });
  }

  return { ok: result.ok, already: result.already, orderId: result.orderId };
}

/** Webhook `checkout.session.expired` — zwalnia zarezerwowane bilety / lożę. */
export async function expireCheckoutSession(session: StripeSessionLike) {
  const meta = session.metadata ?? {};
  if (meta.kind === "lounge_deposit") {
    const reservationId = Number(meta.reservationId);
    if (reservationId) await cancelLoungeReservationIfUnpaid(reservationId, session.id);
    return;
  }
  const orderId = Number(meta.orderId);
  if (orderId) await releaseOrderReservation(orderId);
}

/** Anuluje nieopłacone zamówienie i zwraca bilety do puli. Idempotentne. */
export async function releaseOrderReservation(orderId: number) {
  const awaitingId = await statusId(orderStatuses, "AwaitingPayment");
  const cancelledId = await statusId(orderStatuses, "Cancelled");

  await db.transaction(async (tx) => {
    const [order] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .for("update")
      .limit(1);
    if (!order || order.statusId !== awaitingId) return;

    const items = await tx.select().from(orderItems).where(eq(orderItems.orderId, orderId));
    for (const item of items) {
      const [level] = await tx
        .select()
        .from(eventTicketLevels)
        .where(eq(eventTicketLevels.id, item.eventTicketLevelId))
        .for("update")
        .limit(1);
      if (level?.quantity == null) continue;
      await tx
        .update(eventTicketLevels)
        .set({ quantity: level.quantity + item.quantity })
        .where(eq(eventTicketLevels.id, item.eventTicketLevelId));
    }

    await tx.update(orders).set({ statusId: cancelledId }).where(eq(orders.id, orderId));
  });
}

export async function createLoungeDepositCheckout(input: {
  userId: number;
  userEmail: string;
  loungeId: number;
  eventId: number;
}) {
  const [lounge] = await db
    .select()
    .from(lounges)
    .where(eq(lounges.id, input.loungeId))
    .limit(1);
  if (!lounge) throw new Error("Loża nie istnieje.");

  const fullPrice = Number(lounge.price);
  if (!(fullPrice > 0)) throw new Error("Loża nie ma ustawionej ceny.");

  const deposit = loungeDepositAmount(fullPrice);
  getStripe();

  const reservationId = await createLoungeReservation({
    loungeId: input.loungeId,
    eventId: input.eventId,
    userId: input.userId,
    fullPrice,
    depositAmount: deposit,
  });

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.userEmail,
    expires_at: Math.floor(Date.now() / 1000) + CHECKOUT_TTL_SEC,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "pln",
          unit_amount: Math.round(deposit * 100),
          product_data: {
            name: `Zaliczka 20% · ${lounge.name}`,
            description: `Rezerwacja loży · event #${input.eventId} · cena ${fullPrice.toFixed(2)} PLN`,
          },
        },
      },
    ],
    success_url: `${getAppUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservationId}&type=lounge`,
    cancel_url: `${getAppUrl()}/checkout/cancel?reservation_id=${reservationId}&type=lounge`,
    metadata: {
      kind: "lounge_deposit",
      reservationId: String(reservationId),
      loungeId: String(input.loungeId),
      eventId: String(input.eventId),
      userId: String(input.userId),
      fullPrice: fullPrice.toFixed(2),
      depositAmount: deposit.toFixed(2),
    },
  });

  await db
    .update(loungeReservations)
    .set({ stripeSessionId: session.id })
    .where(eq(loungeReservations.id, reservationId));

  if (!session.url) throw new Error("Stripe nie zwrócił URL sesji.");

  return {
    mode: "stripe" as const,
    url: session.url,
    reservationId,
    fullPrice,
    depositAmount: deposit,
    sessionId: session.id,
  };
}

async function fulfillLoungeDeposit(session: StripeSessionLike) {
  const meta = session.metadata ?? {};
  const reservationId = Number(meta.reservationId);
  if (!reservationId) {
    throw new Error("Brak metadanych zaliczki loży.");
  }

  const [confirmed] = await db
    .select()
    .from(reservationStatuses)
    .where(eq(reservationStatuses.name, "Confirmed"))
    .limit(1);
  if (!confirmed) throw new Error("Brak statusu Confirmed.");

  const completedTx = await statusId(transactionStates, "Completed");
  const depositTypeId = (await optionalTypeId("LoungeDeposit")) ?? (await typeId("TicketSale"));

  return db.transaction(async (tx) => {
    const [reservation] = await tx
      .select()
      .from(loungeReservations)
      .where(eq(loungeReservations.id, reservationId))
      .for("update")
      .limit(1);
    if (!reservation) throw new Error("Rezerwacja loży nie istnieje.");
    if (reservation.stripeSessionId && reservation.stripeSessionId !== session.id) {
      throw new Error("Sesja Stripe nie pasuje do rezerwacji.");
    }
    if (reservation.depositPaidAt) {
      return { ok: true as const, already: true, reservationId };
    }

    const paidValue =
      session.amount_total != null
        ? (session.amount_total / 100).toFixed(2)
        : reservation.depositAmount ?? "0.00";

    await tx
      .update(loungeReservations)
      .set({
        depositPaidAt: new Date(),
        depositAmount: paidValue,
        stripeSessionId: session.id,
        statusId: confirmed.id,
      })
      .where(eq(loungeReservations.id, reservationId));

    await tx.insert(transactions).values({
      userId: reservation.userId,
      value: paidValue,
      dateOf: new Date(),
      transactionTypeId: depositTypeId,
      stateId: completedTx,
    });

    return { ok: true as const, already: false, reservationId };
  });
}

async function issueTicketsForOrder(
  tx: Executor,
  input: {
    userId: number;
    eventId: number;
    eventTicketLevelId: number;
    quantity: number;
    unitPrice: string;
    promoterUserId: number | null;
  },
) {
  for (let i = 0; i < input.quantity; i++) {
    await tx.insert(tickets).values({
      eventId: input.eventId,
      ticketLevelId: input.eventTicketLevelId,
      ownerId: input.userId,
      number: ticketNumber(input.eventId),
      price: input.unitPrice,
      promotorId: input.promoterUserId,
      isRealized: false,
    });
  }
}

async function cancelledReservationStatusId() {
  const [cancelled] = await db
    .select()
    .from(reservationStatuses)
    .where(eq(reservationStatuses.name, "Cancelled"))
    .limit(1);
  if (!cancelled) throw new Error("Brak statusu Cancelled.");
  return cancelled.id;
}

async function cancelLoungeReservationIfUnpaid(reservationId: number, sessionId: string) {
  const cancelledId = await cancelledReservationStatusId();
  await db
    .update(loungeReservations)
    .set({ statusId: cancelledId })
    .where(
      and(
        eq(loungeReservations.id, reservationId),
        eq(loungeReservations.stripeSessionId, sessionId),
        isNull(loungeReservations.depositPaidAt),
      ),
    );
}

export async function cancelUnpaidLoungeReservation(reservationId: number, userId: number) {
  const [reservation] = await db
    .select({
      id: loungeReservations.id,
      userId: loungeReservations.userId,
      depositPaidAt: loungeReservations.depositPaidAt,
    })
    .from(loungeReservations)
    .where(eq(loungeReservations.id, reservationId))
    .limit(1);

  if (!reservation || reservation.userId !== userId) {
    throw new Error("Rezerwacja nie istnieje.");
  }
  if (reservation.depositPaidAt) {
    throw new Error("Zaliczka już opłacona — nie można anulować tą ścieżką.");
  }

  const cancelledId = await cancelledReservationStatusId();
  await db
    .update(loungeReservations)
    .set({ statusId: cancelledId })
    .where(eq(loungeReservations.id, reservationId));
}
