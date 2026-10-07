import { randomInt } from "crypto";

/** Domyślna prowizja promotora od udanej sprzedaży (0–1). */
export function getPromoterCommissionRate(): number {
  const raw = process.env.PROMOTER_COMMISSION_RATE;
  const n = raw != null && raw !== "" ? Number(raw) : 0.1;
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0.1;
  return n;
}

export function getPromoterCommissionPercent(): number {
  return Math.round(getPromoterCommissionRate() * 1000) / 10;
}

export const PROMOTER_REF_STORAGE_KEY = "galaxy-promoter-ref";

/** Kod w `promotor_wallets.account_number`: 12 losowych znaków A–Z / 2–9. */
export const PROMOTER_CODE_LENGTH = 12;

const PROMOTER_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePromoterCode(
  length = PROMOTER_CODE_LENGTH,
): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += PROMOTER_CODE_ALPHABET[randomInt(PROMOTER_CODE_ALPHABET.length)];
  }
  return out;
}

export function isPromoterCodeFormat(code: string | null | undefined): boolean {
  if (!code) return false;
  return new RegExp(`^[A-Z0-9]{${PROMOTER_CODE_LENGTH}}$`).test(code);
}
