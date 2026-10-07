import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  adminCreateTicket,
  adminDeleteTicket,
  adminListTickets,
  adminUpdateTicket,
  writeAudit,
} from "@/server/admin";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    return jsonOk({ tickets: await adminListTickets() });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd biletów.", 500);
  }
}

const createSchema = z.object({
  eventId: z.number().int().positive(),
  ticketLevelId: z.number().int().positive(),
  ownerId: z.number().int().positive(),
  number: z.string().min(1),
  price: z.string().min(1),
  promotorId: z.number().int().positive().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = createSchema.parse(await request.json());
    const id = await adminCreateTicket(body);
    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "tickets",
      entityId: id,
      newValue: body,
    });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie utworzono biletu.", 500);
  }
}

const patchSchema = z.object({
  id: z.number().int().positive(),
  isRealized: z.boolean().optional(),
  cancelledAt: z.string().nullable().optional(),
  price: z.string().optional(),
  promotorId: z.number().int().positive().nullable().optional(),
});

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = patchSchema.parse(await request.json());
    const { id, ...data } = body;
    await adminUpdateTicket(id, data);
    await writeAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "tickets",
      entityId: id,
      newValue: data,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie zaktualizowano biletu.", 500);
  }
}

const deleteSchema = z.object({ id: z.number().int().positive() });

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = deleteSchema.parse(await request.json());
    await adminDeleteTicket(body.id);
    await writeAudit({
      userId: user.id,
      action: "DELETE",
      entityType: "tickets",
      entityId: body.id,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie usunięto biletu.", 500);
  }
}
