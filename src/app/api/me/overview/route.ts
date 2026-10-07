import { getSessionUser } from "@/lib/auth";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { getUserActiveTickets, getUserReservations } from "@/server/queries";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Wymagane logowanie.", 401);

    const [reservations, activeTickets] = await Promise.all([
      getUserReservations(user.id),
      getUserActiveTickets(user.id),
    ]);

    return jsonOk({ reservations, activeTickets });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna.", 503);
    }
    console.error(error);
    return jsonError("Nie udało się pobrać danych konta.", 500);
  }
}
