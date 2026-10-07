import { afterEach, describe, expect, it, vi } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("przepuszcza do limitu, potem blokuje", () => {
    const key = `test-${Math.random()}`;
    expect(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 2, windowMs: 60_000 }).ok).toBe(true);
    const blocked = rateLimit(key, { limit: 2, windowMs: 60_000 });
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
  });

  it("odblokowuje po wygaśnięciu okna", () => {
    vi.useFakeTimers();
    const key = `test-window-${Math.random()}`;
    expect(rateLimit(key, { limit: 1, windowMs: 1_000 }).ok).toBe(true);
    expect(rateLimit(key, { limit: 1, windowMs: 1_000 }).ok).toBe(false);
    vi.advanceTimersByTime(1_001);
    expect(rateLimit(key, { limit: 1, windowMs: 1_000 }).ok).toBe(true);
  });
});
