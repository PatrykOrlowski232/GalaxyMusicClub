import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  adminCreateLounge,
  adminDeleteLounge,
  adminListLounges,
  adminUpdateLounge,
  writeAudit,
} from "@/server/admin";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    return jsonOk({ lounges: await adminListLounges() });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd lóż.", 500);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  levelId: z.number().int().positive(),
  price: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = createSchema.parse(await request.json());
    const id = await adminCreateLounge(body);
    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "lounges",
      entityId: id,
      newValue: body,
    });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie utworzono loży.", 500);
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
    await adminUpdateLounge(id, data);
    await writeAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "lounges",
      entityId: id,
      newValue: data,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie zaktualizowano loży.", 500);
  }
}

const deleteSchema = z.object({ id: z.number().int().positive() });

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = deleteSchema.parse(await request.json());
    await adminDeleteLounge(body.id);
    await writeAudit({
      userId: user.id,
      action: "DELETE",
      entityType: "lounges",
      entityId: body.id,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie usunięto loży.", 500);
  }
}
