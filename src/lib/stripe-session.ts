/** Deny-by-default: tylko jawny status `paid` (brak statusu ≠ opłacone). */
export function isStripeSessionPaid(status: string | null | undefined): boolean {
  return status === "paid";
}
