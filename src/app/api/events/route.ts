import { listEvents } from "@/server/queries";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

export async function GET() {
  try {
    const events = await listEvents();
    return jsonOk({ events });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna.", 503);
    }
    console.error(error);
    return jsonError("Nie udało się pobrać eventów.", 500);
  }
}
