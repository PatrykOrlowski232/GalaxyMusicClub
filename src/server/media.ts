import { eq } from "drizzle-orm";
import { db } from "@/db";
import { artists, events, mediaFiles } from "@/db/schema";

const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MAX_BYTES = 5 * 1024 * 1024;

function sniffImageMime(buf: Buffer): string | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "image/png";
  }
  if (buf.length >= 6 && /^GIF8[79]a$/.test(buf.subarray(0, 6).toString("latin1"))) {
    return "image/gif";
  }
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("latin1") === "RIFF" &&
    buf.subarray(8, 12).toString("latin1") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

export function mediaPublicUrl(id: number) {
  return `/api/media/${id}`;
}

export async function getMediaFile(id: number) {
  const [row] = await db
    .select({
      id: mediaFiles.id,
      mimeType: mediaFiles.mimeType,
      originalName: mediaFiles.originalName,
      byteSize: mediaFiles.byteSize,
      data: mediaFiles.data,
    })
    .from(mediaFiles)
    .where(eq(mediaFiles.id, id))
    .limit(1);
  return row ?? null;
}

export async function saveUploadedImage(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Dozwolone formaty: JPG, PNG, WEBP, GIF.");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Plik max 5 MB.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = sniffImageMime(buffer);
  if (!mimeType) {
    throw new Error("Plik nie jest prawidłowym obrazem JPG, PNG, WEBP ani GIF.");
  }
  const result = await db.insert(mediaFiles).values({
    mimeType,
    originalName: file.name.slice(0, 255) || null,
    byteSize: buffer.length,
    data: buffer,
  });
  const id = Number(result[0].insertId);
  return { id, url: mediaPublicUrl(id), mimeType, byteSize: buffer.length };
}

export async function attachArtistPhoto(artistId: number, file: File) {
  const media = await saveUploadedImage(file);
  const [prev] = await db
    .select({ photoMediaId: artists.photoMediaId })
    .from(artists)
    .where(eq(artists.id, artistId))
    .limit(1);

  await db
    .update(artists)
    .set({
      photoMediaId: media.id,
      photoUrl: media.url,
    })
    .where(eq(artists.id, artistId));

  if (prev?.photoMediaId && prev.photoMediaId !== media.id) {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, prev.photoMediaId));
  }

  return media;
}

export async function attachEventGraphic(eventId: number, file: File) {
  const media = await saveUploadedImage(file);
  const [prev] = await db
    .select({ graphicMediaId: events.graphicMediaId })
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);

  await db
    .update(events)
    .set({
      graphicMediaId: media.id,
      graphicUrl: media.url,
    })
    .where(eq(events.id, eventId));

  if (prev?.graphicMediaId && prev.graphicMediaId !== media.id) {
    await db.delete(mediaFiles).where(eq(mediaFiles.id, prev.graphicMediaId));
  }

  return media;
}
