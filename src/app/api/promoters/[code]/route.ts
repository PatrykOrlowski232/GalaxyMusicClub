import { eq } from "drizzle-orm";
import { db } from "@/db";
import { promotorWallets } from "@/db/schema";
import { getPromotorDashboard } from "@/server/queries";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

type Props = { params: Promise<{ code: string }> };

export async function GET(_request: Request, { params }: Props) {
  try {
    const { code } = await params;
    const [wallet] = await db
      .select({
        userId: promotorWallets.userId,
        accountNumber: promotorWallets.accountNumber,
      })
      .from(promotorWallets)
      .where(eq(promotorWallets.accountNumber, code.toUpperCase()))
      .limit(1);

    if (!wallet) return jsonError("Nie znaleziono kodu promotora.", 404);

    const dashboard = await getPromotorDashboard(wallet.userId);

    return jsonOk({
      code: wallet.accountNumber,
      referrals: dashboard?.referrals ?? 0,
    });
  } catch (error) {
    if (isDbUnavailable(error)) {
      return jsonError("Baza danych niedostępna.", 503);
    }
    console.error(error);
    return jsonError("Nie udało się pobrać zaproszenia.", 500);
  }
}
