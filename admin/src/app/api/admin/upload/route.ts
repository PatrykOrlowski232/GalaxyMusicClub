import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { attachArtistPhoto, attachEventGraphic } from "@/server/media";
import { writeAudit } from "@/server/admin";

export async function POST(request: Request) {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;

    const form = await request.formData();
    const file = form.get("file");
    const entityType = String(form.get("entityType") ?? "");
    const entityId = Number(form.get("entityId"));

    if (!(file instanceof File)) {
      return jsonError("Brak pliku.");
    }
    if (!Number.isFinite(entityId) || entityId <= 0) {
      return jsonError("Nieprawidłowe ID encji.");
    }

    let media;
    if (entityType === "artist") {
      media = await attachArtistPhoto(entityId, file);
    } else if (entityType === "event") {
      media = await attachEventGraphic(entityId, file);
    } else {
      return jsonError("entityType: artist | event");
    }

    await writeAudit({
      userId: user.id,
      action: "UPDATE",
      entityType: entityType === "artist" ? "artists" : "events",
      entityId,
      newValue: {
        mediaId: media.id,
        url: media.url,
        mimeType: media.mimeType,
        byteSize: media.byteSize,
      },
    });

    return jsonOk({
      id: media.id,
      url: media.url,
      mimeType: media.mimeType,
      byteSize: media.byteSize,
    });
  } catch (err) {
    if (err instanceof Error && /Dozwolone|max 5/.test(err.message)) {
      return jsonError(err.message);
    }
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie wgrano zdjęcia.", 500);
  }
}
