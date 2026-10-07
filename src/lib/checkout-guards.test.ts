import { describe, expect, it } from "vitest";
import {
  generatePromoterCode,
  isPromoterCodeFormat,
  PROMOTER_CODE_LENGTH,
} from "@/lib/promoter";
import { isStripeSessionPaid } from "@/lib/stripe-session";

describe("isStripeSessionPaid", () => {
  it("akceptuje tylko status paid", () => {
    expect(isStripeSessionPaid("paid")).toBe(true);
  });

  it("odrzuca unpaid, no_payment_required, null i undefined (fail-closed)", () => {
    expect(isStripeSessionPaid("unpaid")).toBe(false);
    expect(isStripeSessionPaid("no_payment_required")).toBe(false);
    expect(isStripeSessionPaid(null)).toBe(false);
    expect(isStripeSessionPaid(undefined)).toBe(false);
    expect(isStripeSessionPaid("")).toBe(false);
  });
});

describe("promoter code", () => {
  it("generuje 12 znaków z dozwolonego alfabetu", () => {
    const code = generatePromoterCode();
    expect(code).toHaveLength(PROMOTER_CODE_LENGTH);
    expect(isPromoterCodeFormat(code)).toBe(true);
    expect(code).not.toMatch(/[01ILO]/);
  });

  it("odrzuca złe formaty", () => {
    expect(isPromoterCodeFormat("SHORT")).toBe(false);
    expect(isPromoterCodeFormat("abcdefghijkl")).toBe(false);
    expect(isPromoterCodeFormat(null)).toBe(false);
  });
});
