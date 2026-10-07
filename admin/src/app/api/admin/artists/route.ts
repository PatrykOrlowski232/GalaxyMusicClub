import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  adminCreateArtist,
  adminDeleteArtist,
  adminListArtists,
  adminUpdateArtist,
  writeAudit,
} from "@/server/admin";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    return jsonOk({ artists: await adminListArtists() });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd artystów.", 500);
  }
}

const createSchema = z.object({
  name: z.string().min(1),
  info: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = createSchema.parse(await request.json());
    const id = await adminCreateArtist(body);
    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "artists",
      entityId: id,
      newValue: body,
    });
    return jsonOk({ id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie utworzono artysty.", 500);
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
    await adminUpdateArtist(id, data);
    await writeAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: "artists",
      entityId: id,
      newValue: data,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie zaktualizowano artysty.", 500);
  }
}

const deleteSchema = z.object({ id: z.number().int().positive() });

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = deleteSchema.parse(await request.json());
    await adminDeleteArtist(body.id);
    await writeAudit({
      userId: user.id,
      action: "DELETE",
      entityType: "artists",
      entityId: body.id,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie usunięto artysty.", 500);
  }
}
