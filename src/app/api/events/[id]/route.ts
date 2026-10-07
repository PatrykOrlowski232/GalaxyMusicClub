import { getEventById } from "@/server/queries";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

type Props = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const eventId = Number(id);
    if (!Number.isFinite(eventId)) return jsonError("Nieprawidłowe ID.", 400);

    const event = await getEventById(eventId);
    if (!event) return jsonError("Event nie istnieje.", 404);
    return jsonOk({ event });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna.", 503);
    }
    console.error(error);
    return jsonError("Nie udało się pobrać eventu.", 500);
  }
}
