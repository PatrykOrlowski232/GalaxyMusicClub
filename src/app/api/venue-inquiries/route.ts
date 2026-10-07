import { z } from "zod";
import { db } from "@/db";
import { auditLogs, venueInquiries } from "@/db/schema";
import { getSessionUser } from "@/lib/auth";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

const schema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  phone: z.string().max(50).nullable().optional(),
  eventType: z.string().min(2).max(100),
  eventDate: z.string().nullable().optional(),
  guests: z.number().int().positive().max(2000).nullable().optional(),
  message: z.string().max(4000).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getSessionUser();
    const body = schema.parse(await request.json());

    const result = await db.insert(venueInquiries).values({
      name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      eventType: body.eventType,
      eventDate: body.eventDate ? new Date(`${body.eventDate}T12:00:00`) : null,
      guests: body.guests ?? null,
      message: body.message?.trim() || null,
      status: "New",
      userId: session?.id ?? null,
    });

    const id = Number(result[0].insertId);

    await db.insert(auditLogs).values({
      userId: session?.id ?? null,
      action: "CREATE",
      entityType: "venue_inquiries",
      entityId: id,
      newValue: {
        email: body.email,
        eventType: body.eventType,
        eventDate: body.eventDate,
      },
    });

    return jsonOk({ id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(error)) return jsonError("Baza niedostępna.", 503);
    console.error(error);
    return jsonError("Nie udało się zapisać zapytania.", 500);
  }
}
