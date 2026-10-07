import { getStripe } from "@/lib/stripe";
import { jsonError, jsonOk } from "@/lib/api";
import { captureException } from "@/lib/monitoring";
import { expireCheckoutSession, fulfillCheckoutSession } from "@/server/checkout";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return jsonError("Brak STRIPE_WEBHOOK_SECRET.", 503);
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return jsonError("Brak podpisu Stripe.", 400);

  const rawBody = await request.text();

  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);

    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const session = event.data.object;
      await fulfillCheckoutSession({
        id: session.id,
        payment_status: session.payment_status,
        metadata: session.metadata as Record<string, string> | null,
        amount_total: session.amount_total,
      });
    } else if (event.type === "checkout.session.expired") {
      const session = event.data.object;
      await expireCheckoutSession({
        id: session.id,
        metadata: session.metadata as Record<string, string> | null,
      });
    }

    return jsonOk({ received: true });
  } catch (error) {
    await captureException(error, { source: "stripe_webhook" });
    const msg = error instanceof Error ? error.message : "Webhook error";
    return jsonError(msg, 400);
  }
}
