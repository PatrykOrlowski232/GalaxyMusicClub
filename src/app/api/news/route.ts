import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { listPublishedNews } from "@/server/news";

export async function GET() {
  try {
    const posts = await listPublishedNews();
    return jsonOk({ posts });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd aktualności.", 500);
  }
}
