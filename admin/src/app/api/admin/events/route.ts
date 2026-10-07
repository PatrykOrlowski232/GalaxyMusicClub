import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  adminCreateEvent,
  adminDeleteEvent,
  adminListEvents,
  adminUpdateEvent,
  writeAudit,
} from "@/server/admin";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    return jsonOk({ events: await adminListEvents() });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd eventów.", 500);
  }
}

const createSchema = z.object({
  title: z.string().nullable().optional(),
  startsAt: z.string().min(1),
  endsAt: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  graphicUrl: z.string().nullable().optional(),
  ticketUrl: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = createSchema.parse(await request.json());
    const id = await adminCreateEvent(body);
    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "events",
      entityId: id,
      newValue: body,
    });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie utworzono eventu.", 500);
  }
}

const updateSchema = createSchema.partial().extend({
  id: z.number().int().positive(),
});

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = updateSchema.parse(await request.json());
    const { id, ...data } = body;
    await adminUpdateEvent(id, data);
    await writeAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "events",
      entityId: id,
      newValue: data,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie zaktualizowano eventu.", 500);
  }
}

const deleteSchema = z.object({ id: z.number().int().positive() });

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = deleteSchema.parse(await request.json());
    await adminDeleteEvent(body.id);
    await writeAudit({
      userId: user.id,
      action: "DELETE",
      entityType: "events",
      entityId: body.id,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie usunięto eventu (sprawdź powiązane bilety).", 500);
  }
}
