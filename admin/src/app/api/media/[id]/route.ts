import { getMediaFile } from "@/server/media";
import { isDbUnavailable, jsonError } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  try {
    const id = Number((await params).id);
    if (!Number.isFinite(id) || id <= 0) {
      return jsonError("Nieprawidłowe ID.", 400);
    }

    const file = await getMediaFile(id);
    if (!file) return jsonError("Nie znaleziono pliku.", 404);

    return new Response(new Uint8Array(file.data), {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        "Content-Length": String(file.byteSize),
        "Cache-Control": "public, max-age=86400",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd mediów.", 500);
  }
}
