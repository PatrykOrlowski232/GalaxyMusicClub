import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  adminListAccountTypes,
  adminListLevels,
  adminListReservationStatuses,
  adminListTicketTypes,
  adminStats,
} from "@/server/admin";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;

    const [stats, levels, reservationStatuses, ticketTypes, accountTypes] =
      await Promise.all([
        adminStats(),
        adminListLevels(),
        adminListReservationStatuses(),
        adminListTicketTypes(),
        adminListAccountTypes(),
      ]);

    return jsonOk({ stats, levels, reservationStatuses, ticketTypes, accountTypes });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd meta admin.", 500);
  }
}
