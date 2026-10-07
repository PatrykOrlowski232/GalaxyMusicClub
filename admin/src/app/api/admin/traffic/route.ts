import { requireStaff } from "@/lib/staff";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import {
  ensureClosedDailySnapshots,
  getTrafficStats,
} from "@/server/analytics";
import { writeAudit } from "@/server/admin";

export async function GET() {
  try {
    const { error } = await requireStaff();
    if (error) return error;
    return jsonOk(await getTrafficStats());
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Błąd statystyk ruchu.", 500);
  }
}

/** Ręczne domknięcie zakończonych dni (zrzuty). */
export async function POST() {
  try {
    const { user, error } = await requireStaff();
    if (error || !user) return error;
    const result = await ensureClosedDailySnapshots();
    await writeAudit({
      userId: user.id,
      action: "CREATE",
      entityType: "traffic_daily_snapshots",
      newValue: result,
    });
    return jsonOk({ ok: true, ...result, stats: await getTrafficStats() });
  } catch (err) {
    if (isDbUnavailable(err)) return jsonError("Baza niedostępna.", 503);
    console.error(err);
    return jsonError("Nie utworzono zrzutów.", 500);
  }
}
