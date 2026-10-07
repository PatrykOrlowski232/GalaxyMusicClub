import { listLounges, listLoungesForEvent } from "@/server/queries";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventIdRaw = searchParams.get("eventId");

    if (eventIdRaw) {
      const eventId = Number(eventIdRaw);
      if (!Number.isFinite(eventId) || eventId <= 0) {
        return jsonError("Nieprawidłowe eventId.", 400);
      }
      const lounges = await listLoungesForEvent(eventId);
      return jsonOk({ eventId, lounges });
    }

    const lounges = await listLounges();
    return jsonOk({ lounges });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna.", 503);
    }
    console.error(error);
    return jsonError("Nie udało się pobrać lóż.", 500);
  }
}
