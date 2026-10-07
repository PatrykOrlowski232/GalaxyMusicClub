import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { isDbUnavailable, jsonError, jsonOk } from "@/lib/api";
import { isStripeConfigured } from "@/lib/stripe";
import { createCheckoutSession } from "@/server/checkout";

const schema = z.object({
  eventTicketLevelId: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10).default(1),
  promoterCode: z.string().optional().nullable(),
});

export async function POST(request: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return jsonError("Zaloguj się, aby kupić bilet.", 401);

    const body = schema.parse(await request.json());

    // free path nie wymaga Stripe; płatne — tak
    const result = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email,
      eventTicketLevelId: body.eventTicketLevelId,
      quantity: body.quantity,
      promoterCode: body.promoterCode,
    });

    if (result.mode === "stripe" && !isStripeConfigured()) {
      return jsonError("Stripe nie jest skonfigurowany (STRIPE_SECRET_KEY).", 503);
    }

    return jsonOk(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return jsonError(error.issues[0]?.message ?? "Nieprawidłowe dane.");
    }
    if (isDbUnavailable(error)) return jsonError("Baza niedostępna.", 503);
    const msg = error instanceof Error ? error.message : "Checkout nie powiódł się.";
    if (msg.includes("STRIPE_SECRET_KEY")) {
      return jsonError(msg, 503);
    }
    console.error(error);
    return jsonError(msg, 500);
  }
}
