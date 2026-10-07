import { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getStripe } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { fulfillCheckoutSession } from "@/server/checkout";

/** Ręczne dokończenie po powrocie z Checkout (gdy webhook jeszcze nie doszedł lokalnie). */
export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Zaloguj się, aby potwierdzić płatność.", 401);

    const limited = rateLimit(`checkout-sync:${user.id}`, { limit: 20, windowMs: 60_000 });
    if (!limited.ok) return jsonError("Zbyt wiele prób. Spróbuj za chwilę.", 429);

    const sessionId = request.nextUrl.searchParams.get("session_id");
    if (!sessionId || !sessionId.startsWith("cs_")) return jsonError("Brak session_id.", 400);

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.metadata?.userId !== String(user.id)) {
      return jsonError("Ta płatność nie należy do Twojego konta.", 403);
    }

    const result = await fulfillCheckoutSession({
      id: session.id,
      payment_status: session.payment_status,
      metadata: session.metadata as Record<string, string> | null,
      amount_total: session.amount_total,
    });

    return jsonOk(result);
  } catch (error) {
    console.error(error);
    const msg = error instanceof Error ? error.message : "Sync nie powiódł się.";
    return jsonError(msg, 500);
  }
}
