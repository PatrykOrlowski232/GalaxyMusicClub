import https from "node:https";
import Stripe from "stripe";
import { getSiteUrl } from "@/lib/site";

let stripeSingleton: Stripe | null = null;

/** Lokalny antivirus/proxy często psuje weryfikację certyfikatu Stripe (UNABLE_TO_VERIFY_LEAF_SIGNATURE). */
function shouldRelaxTls(): boolean {
  if (process.env.STRIPE_TLS_INSECURE !== "1") return false;
  if (process.env.NODE_ENV === "production") {
    throw new Error("STRIPE_TLS_INSECURE=1 jest niedozwolone w produkcji.");
  }
  return true;
}

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Brak STRIPE_SECRET_KEY. Dodaj klucz testowy w .env (sk_test_...).",
    );
  }

  if (stripeSingleton) return stripeSingleton;

  stripeSingleton = new Stripe(key, {
    httpAgent: shouldRelaxTls()
      ? new https.Agent({ rejectUnauthorized: false })
      : undefined,
  });

  return stripeSingleton;
}

export const getAppUrl = getSiteUrl;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
