"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CheckoutSuccessClient() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderId = params.get("order_id");
  const reservationId = params.get("reservation_id");
  const type = params.get("type");
  const free = params.get("free");
  const isLounge = type === "lounge" || !!reservationId;
  const [status, setStatus] = useState<"syncing" | "ok" | "error">(
    free ? "ok" : sessionId ? "syncing" : "ok",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId || free) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/checkout/sync?session_id=${encodeURIComponent(sessionId)}`,
          { credentials: "include" },
        );
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Nie udało się potwierdzić płatności.");
          setStatus("error");
          return;
        }
        setStatus("ok");
      } catch {
        setError("Błąd synchronizacji płatności.");
        setStatus("error");
      }
    })();
  }, [sessionId, free]);

  const okMessage = isLounge
    ? `Zaliczka za lożę przyjęta${reservationId ? ` (rezerwacja #${reservationId})` : ""}. Status: Confirmed.`
    : `Bilety są w Twoim koncie${orderId ? ` (order #${orderId})` : ""}.`;

  const syncingMessage = isLounge
    ? "Chwilę — zapisujemy zaliczkę i potwierdzamy rezerwację loży."
    : "Chwilę — zapisujemy zamówienie i wystawiamy bilety.";

  return (
    <div className="galaxy-bg flex min-h-dvh items-center justify-center px-4 pt-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Checkout</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl tracking-wide">
          {status === "syncing"
            ? "Potwierdzamy płatność…"
            : status === "ok"
              ? "Płatność przyjęta"
              : "Problem z potwierdzeniem"}
        </h1>
        <p className="mt-4 text-sm text-galaxy-muted">
          {status === "ok"
            ? okMessage
            : status === "syncing"
              ? syncingMessage
              : error}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/konto"
            className="galaxy-glow bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black"
          >
            {isLounge ? "Moje rezerwacje" : "Moje bilety"}
          </Link>
          <Link
            href="/eventy"
            className="border border-white/20 px-6 py-3 text-sm tracking-wider text-white"
          >
            Eventy
          </Link>
        </div>
      </div>
    </div>
  );
}
