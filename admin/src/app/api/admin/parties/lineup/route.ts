import { z } from "zod";
import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  adminAddPartyArtist,
  adminRemovePartyArtist,
  writeAudit,
} from "@/server/admin";

const addSchema = z.object({
  partyId: z.number().int().positive(),
  artistId: z.number().int().positive(),
  position: z.number().int().positive().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = addSchema.parse(await request.json());
    const row = await adminAddPartyArtist(body);
    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "party_lineup",
      entityId: body.partyId,
      newValue: body,
    });
    return jsonOk(row, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (err instanceof Error && err.message.includes("DJ już")) {
      return jsonError(err.message, 409);
    }
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie dodano DJ-a do imprezy.", 500);
  }
}

const removeSchema = z.object({
  partyId: z.number().int().positive(),
  artistId: z.number().int().positive(),
});

export async function DELETE(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const body = removeSchema.parse(await request.json());
    await adminRemovePartyArtist(body.partyId, body.artistId);
    await writeAudit({
      userId: user.id,
      action: "DELETE",
      entityType: "party_lineup",
      entityId: body.partyId,
      newValue: body,
    });
    return jsonOk({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) return jsonError(err.issues[0]?.message ?? "Dane.");
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie usunięto DJ-a z imprezy.", 500);
  }
}
