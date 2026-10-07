import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  adminCreateParty,
  adminDeleteParty,
  adminListParties,
  adminUpdateParty,
  writeAudit,
} from "@/server/admin";

export async function GET(request: Request) {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    const eventId = new URL(request.url).searchParams.get("eventId");
    const parties = await adminListParties(
      eventId ? Number(eventId) : undefined,
    );
    return jsonOk({ parties });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd imprez.", 500);
  }
}

const createSchema = z.object({
  eventId: z.number().int().positive(),
  levelId: z.number().int().positive(),
  musicType: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = createSchema.parse(await request.json());
    const id = await adminCreateParty(body);
    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "parties",
      entityId: id,
      newValue: body,
    });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie utworzono imprezy.", 500);
  }
}

const updateSchema = z.object({
  id: z.number().int().positive(),
  levelId: z.number().int().positive().optional(),
  musicType: z.string().nullable().optional(),
});

export async function PATCH(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = updateSchema.parse(await request.json());
    const { id, ...data } = body;
    await adminUpdateParty(id, data);
    await writeAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "parties",
      entityId: id,
      newValue: data,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie zaktualizowano imprezy.", 500);
  }
}

const deleteSchema = z.object({ id: z.number().int().positive() });

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = deleteSchema.parse(await request.json());
    await adminDeleteParty(body.id);
    await writeAudit({
      userId: user.id,
      action: "DELETE",
      entityType: "parties",
      entityId: body.id,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie usunięto imprezy.", 500);
  }
}
