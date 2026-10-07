/** Udział zaliczki wymaganej przy rezerwacji loży (20%). */
export const LOUNGE_DEPOSIT_RATE = 0.2;

export function loungeDepositAmount(fullPrice: number): number {
  return Math.round(fullPrice * LOUNGE_DEPOSIT_RATE * 100) / 100;
}

export function formatPln(amount: number): string {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}
