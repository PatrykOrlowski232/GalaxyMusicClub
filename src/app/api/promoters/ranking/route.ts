import { getPromoterRanking, type RankingPeriod } from "@/server/ranking";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") ?? "month";
    const period: RankingPeriod =
      periodParam === "year" ? "year" : "month";

    const ranking = await getPromoterRanking(period);
    return jsonOk(ranking);
  } catch (error) {
    if (isDbUnavailable(error)) return jsonError("Baza niedostępna.", 503);
    console.error(error);
    return jsonError("Nie udało się pobrać rankingu.", 500);
  }
}
