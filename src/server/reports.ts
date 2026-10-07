import fs from "node:fs";
import { and, desc, eq, isNull, ne } from "drizzle-orm";
import PDFDocument from "pdfkit";
import { db } from "@/db";
import {
  eventSummaries,
  events,
  loungeReservations,
  lounges,
  reservationStatuses,
  tickets,
  users,
} from "@/db/schema";
import { getPromoterCommissionRate } from "@/lib/promoter";
import { formatEventDateTimePl, toEventIso } from "@/lib/datetime";

export type EventSalesSnapshot = {
  eventId: number;
  eventTitle: string;
  eventStartsAt: string | null;
  ticketsCount: number;
  ticketsGross: number;
  promoterTicketsCount: number;
  promoterTicketsGross: number;
  promoterCommissionRate: number;
  promoterCommissionTotal: number;
  loungeReservationsCount: number;
  loungeDepositsTotal: number;
  loungeFullPriceTotal: number;
  onlineSalesTotal: number;
  netAfterCommission: number;
  promoters: Array<{
    promoterId: number;
    email: string;
    tickets: number;
    gross: number;
    commission: number;
  }>;
  lounges: Array<{
    reservationId: number;
    loungeName: string;
    status: string;
    fullPrice: number;
    depositAmount: number;
    depositPaid: boolean;
  }>;
};

function money(n: number) {
  return Math.round(n * 100) / 100;
}

function fmtPln(n: number) {
  return `${n.toFixed(2).replace(".", ",")} PLN`;
}

function resolveFontPath() {
  const candidates = [
    "C:\\Windows\\Fonts\\arial.ttf",
    "C:\\Windows\\Fonts\\segoeui.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    "/System/Library/Fonts/Supplemental/Arial.ttf",
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

export async function buildEventSalesSnapshot(
  eventId: number,
): Promise<EventSalesSnapshot> {
  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) throw new Error("Event nie istnieje.");

  const eventTitle =
    event.title?.trim() ||
    event.description?.trim().slice(0, 80) ||
    `Event #${event.id}`;
  const eventStartsAt = toEventIso(event.startsAt);

  const ticketRows = await db
    .select({
      id: tickets.id,
      price: tickets.price,
      promotorId: tickets.promotorId,
      promoterEmail: users.email,
    })
    .from(tickets)
    .leftJoin(users, eq(tickets.promotorId, users.id))
    .where(and(eq(tickets.eventId, eventId), isNull(tickets.cancelledAt)));

  let ticketsGross = 0;
  let promoterTicketsCount = 0;
  let promoterTicketsGross = 0;
  const byPromoter = new Map<
    number,
    { email: string; tickets: number; gross: number }
  >();

  for (const row of ticketRows) {
    const price = Number(row.price);
    ticketsGross += price;
    if (row.promotorId) {
      promoterTicketsCount += 1;
      promoterTicketsGross += price;
      const prev = byPromoter.get(row.promotorId) ?? {
        email: row.promoterEmail ?? `promotor #${row.promotorId}`,
        tickets: 0,
        gross: 0,
      };
      prev.tickets += 1;
      prev.gross += price;
      byPromoter.set(row.promotorId, prev);
    }
  }

  const rate = getPromoterCommissionRate();
  const promoterCommissionTotal = money(promoterTicketsGross * rate);

  const loungeRows = await db
    .select({
      id: loungeReservations.id,
      loungeName: lounges.name,
      status: reservationStatuses.name,
      fullPrice: loungeReservations.fullPrice,
      depositAmount: loungeReservations.depositAmount,
      depositPaidAt: loungeReservations.depositPaidAt,
    })
    .from(loungeReservations)
    .innerJoin(lounges, eq(loungeReservations.loungeId, lounges.id))
    .innerJoin(
      reservationStatuses,
      eq(loungeReservations.statusId, reservationStatuses.id),
    )
    .where(
      and(
        eq(loungeReservations.eventId, eventId),
        ne(reservationStatuses.name, "Cancelled"),
      ),
    );

  let loungeDepositsTotal = 0;
  let loungeFullPriceTotal = 0;
  const loungeDetails = loungeRows.map((row) => {
    const fullPrice = Number(row.fullPrice ?? 0);
    const depositAmount = Number(row.depositAmount ?? 0);
    const depositPaid = !!row.depositPaidAt;
    loungeFullPriceTotal += fullPrice;
    if (depositPaid) loungeDepositsTotal += depositAmount;
    return {
      reservationId: row.id,
      loungeName: row.loungeName,
      status: row.status,
      fullPrice: money(fullPrice),
      depositAmount: money(depositAmount),
      depositPaid,
    };
  });

  ticketsGross = money(ticketsGross);
  promoterTicketsGross = money(promoterTicketsGross);
  loungeDepositsTotal = money(loungeDepositsTotal);
  loungeFullPriceTotal = money(loungeFullPriceTotal);

  const onlineSalesTotal = money(ticketsGross + loungeDepositsTotal);
  const netAfterCommission = money(onlineSalesTotal - promoterCommissionTotal);

  const promoters = [...byPromoter.entries()].map(([promoterId, v]) => ({
    promoterId,
    email: v.email,
    tickets: v.tickets,
    gross: money(v.gross),
    commission: money(v.gross * rate),
  }));

  return {
    eventId,
    eventTitle,
    eventStartsAt,
    ticketsCount: ticketRows.length,
    ticketsGross,
    promoterTicketsCount,
    promoterTicketsGross,
    promoterCommissionRate: rate,
    promoterCommissionTotal,
    loungeReservationsCount: loungeRows.length,
    loungeDepositsTotal,
    loungeFullPriceTotal,
    onlineSalesTotal,
    netAfterCommission,
    promoters,
    lounges: loungeDetails,
  };
}

export async function renderSalesReportPdf(
  snapshot: EventSalesSnapshot,
): Promise<Buffer> {
  const fontPath = resolveFontPath();

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c as Buffer));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    if (fontPath) {
      doc.registerFont("Body", fontPath);
      doc.font("Body");
    }

    const when = snapshot.eventStartsAt
      ? formatEventDateTimePl(snapshot.eventStartsAt)
      : "—";
    const generated = new Date().toLocaleString("pl-PL");
    const pct = Math.round(snapshot.promoterCommissionRate * 1000) / 10;

    doc.fontSize(18).text("Galaxy Music Club — raport sprzedaży online", {
      align: "left",
    });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#333");
    doc.text(`Event: ${snapshot.eventTitle} (#${snapshot.eventId})`);
    doc.text(`Data eventu: ${when}`);
    doc.text(`Wygenerowano: ${generated}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#000").text("1. Sprzedaż biletów online");
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#333");
    doc.text(`Liczba biletów: ${snapshot.ticketsCount}`);
    doc.text(`Suma sprzedaży biletów: ${fmtPln(snapshot.ticketsGross)}`);
    doc.moveDown();

    doc.fontSize(13).fillColor("#000").text("2. Bilety promocyjne (promotorzy)");
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#333");
    doc.text(`Bilety z kodem promotora: ${snapshot.promoterTicketsCount}`);
    doc.text(`Obrót z tych biletów: ${fmtPln(snapshot.promoterTicketsGross)}`);
    doc.text(`Stawka prowizji: ${pct}%`);
    doc.text(`Prowizja dla promotorów: ${fmtPln(snapshot.promoterCommissionTotal)}`);
    if (snapshot.promoters.length) {
      doc.moveDown(0.3);
      for (const p of snapshot.promoters) {
        doc.text(
          `• ${p.email}: ${p.tickets} szt. · ${fmtPln(p.gross)} · prowizja ${fmtPln(p.commission)}`,
        );
      }
    }
    doc.moveDown();

    doc.fontSize(13).fillColor("#000").text("3. Rezerwacje lóż");
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#333");
    doc.text(`Aktywne rezerwacje: ${snapshot.loungeReservationsCount}`);
    doc.text(`Zaliczki opłacone online: ${fmtPln(snapshot.loungeDepositsTotal)}`);
    doc.text(
      `Wartość lóż (saldo bar / darmowe wejście): ${fmtPln(snapshot.loungeFullPriceTotal)}`,
    );
    if (snapshot.lounges.length) {
      doc.moveDown(0.3);
      for (const l of snapshot.lounges) {
        doc.text(
          `• ${l.loungeName} (#${l.reservationId}) · ${l.status} · cena ${fmtPln(l.fullPrice)} · zaliczka ${fmtPln(l.depositAmount)}${l.depositPaid ? " (opłacona)" : ""}`,
        );
      }
    }
    doc.moveDown();

    doc.fontSize(13).fillColor("#000").text("4. Podsumowanie");
    doc.moveDown(0.3);
    doc.fontSize(11).fillColor("#333");
    doc.text(
      `Całkowita sprzedaż online (bilety + zaliczki lóż): ${fmtPln(snapshot.onlineSalesTotal)}`,
    );
    doc.text(
      `Po odjęciu prowizji promotorów: ${fmtPln(snapshot.netAfterCommission)}`,
    );

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#666").text(
      "Raport wygenerowany w panelu Admin/Owner Galaxy Music Club. Loża = darmowe wejście + saldo na barze.",
    );

    doc.end();
  });
}

export async function generateAndStoreEventSummary(input: {
  eventId: number;
  generatedBy: number | null;
}) {
  const snapshot = await buildEventSalesSnapshot(input.eventId);
  const pdfBuffer = await renderSalesReportPdf(snapshot);
  const pdfBase64 = pdfBuffer.toString("base64");
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  const pdfFilename = `galaxy-raport-event-${input.eventId}-${stamp}.pdf`;

  const result = await db.insert(eventSummaries).values({
    eventId: input.eventId,
    generatedBy: input.generatedBy,
    ticketsCount: snapshot.ticketsCount,
    ticketsGross: snapshot.ticketsGross.toFixed(2),
    promoterTicketsCount: snapshot.promoterTicketsCount,
    promoterTicketsGross: snapshot.promoterTicketsGross.toFixed(2),
    promoterCommissionRate: snapshot.promoterCommissionRate.toFixed(4),
    promoterCommissionTotal: snapshot.promoterCommissionTotal.toFixed(2),
    loungeReservationsCount: snapshot.loungeReservationsCount,
    loungeDepositsTotal: snapshot.loungeDepositsTotal.toFixed(2),
    loungeFullPriceTotal: snapshot.loungeFullPriceTotal.toFixed(2),
    onlineSalesTotal: snapshot.onlineSalesTotal.toFixed(2),
    netAfterCommission: snapshot.netAfterCommission.toFixed(2),
    summaryJson: snapshot,
    pdfBase64,
    pdfFilename,
  });

  const id = Number(result[0].insertId);
  return { id, snapshot, pdfFilename };
}

export async function listEventSummaries(eventId?: number) {
  const rows = await db
    .select({
      id: eventSummaries.id,
      eventId: eventSummaries.eventId,
      generatedBy: eventSummaries.generatedBy,
      generatedAt: eventSummaries.generatedAt,
      ticketsCount: eventSummaries.ticketsCount,
      ticketsGross: eventSummaries.ticketsGross,
      promoterTicketsCount: eventSummaries.promoterTicketsCount,
      promoterTicketsGross: eventSummaries.promoterTicketsGross,
      promoterCommissionRate: eventSummaries.promoterCommissionRate,
      promoterCommissionTotal: eventSummaries.promoterCommissionTotal,
      loungeReservationsCount: eventSummaries.loungeReservationsCount,
      loungeDepositsTotal: eventSummaries.loungeDepositsTotal,
      loungeFullPriceTotal: eventSummaries.loungeFullPriceTotal,
      onlineSalesTotal: eventSummaries.onlineSalesTotal,
      netAfterCommission: eventSummaries.netAfterCommission,
      pdfFilename: eventSummaries.pdfFilename,
      eventDescription: events.description,
      eventStartsAt: events.startsAt,
      generatedByEmail: users.email,
    })
    .from(eventSummaries)
    .innerJoin(events, eq(eventSummaries.eventId, events.id))
    .leftJoin(users, eq(eventSummaries.generatedBy, users.id))
    .where(eventId ? eq(eventSummaries.eventId, eventId) : undefined)
    .orderBy(desc(eventSummaries.generatedAt));

  return rows.map((r) => ({
    id: r.id,
    eventId: r.eventId,
    eventTitle: r.eventDescription?.trim().slice(0, 80) || `Event #${r.eventId}`,
    eventStartsAt:
      r.eventStartsAt instanceof Date
        ? r.eventStartsAt.toISOString()
        : r.eventStartsAt
          ? String(r.eventStartsAt)
          : null,
    generatedBy: r.generatedBy,
    generatedByEmail: r.generatedByEmail,
    generatedAt:
      r.generatedAt instanceof Date
        ? r.generatedAt.toISOString()
        : String(r.generatedAt),
    ticketsCount: r.ticketsCount,
    ticketsGross: Number(r.ticketsGross),
    promoterTicketsCount: r.promoterTicketsCount,
    promoterTicketsGross: Number(r.promoterTicketsGross),
    promoterCommissionRate: Number(r.promoterCommissionRate),
    promoterCommissionTotal: Number(r.promoterCommissionTotal),
    loungeReservationsCount: r.loungeReservationsCount,
    loungeDepositsTotal: Number(r.loungeDepositsTotal),
    loungeFullPriceTotal: Number(r.loungeFullPriceTotal),
    onlineSalesTotal: Number(r.onlineSalesTotal),
    netAfterCommission: Number(r.netAfterCommission),
    pdfFilename: r.pdfFilename,
  }));
}

export async function getEventSummaryPdf(id: number) {
  const [row] = await db
    .select({
      id: eventSummaries.id,
      pdfBase64: eventSummaries.pdfBase64,
      pdfFilename: eventSummaries.pdfFilename,
    })
    .from(eventSummaries)
    .where(eq(eventSummaries.id, id))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    filename: row.pdfFilename,
    buffer: Buffer.from(row.pdfBase64, "base64"),
  };
}
