"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function CancelInner() {
  const params = useSearchParams();
  const reservationId = params.get("reservation_id");
  const type = params.get("type");
  const [done, setDone] = useState(!reservationId || type !== "lounge");

  useEffect(() => {
    if (!reservationId || type !== "lounge") return;
    void (async () => {
      try {
        await fetch("/api/lounges/reservations", {
          method: "DELETE",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reservationId: Number(reservationId) }),
        });
      } catch {
        /* ignore — użytkownik i tak anulował płatność */
      } finally {
        setDone(true);
      }
    })();
  }, [reservationId, type]);

  const isLounge = type === "lounge";

  return (
    <div className="galaxy-bg flex min-h-dvh items-center justify-center px-4 pt-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Checkout</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl tracking-wide">
          Płatność anulowana
        </h1>
        <p className="mt-4 text-sm text-galaxy-muted">
          {isLounge
            ? done
              ? "Zaliczka nie została pobrana. Rezerwacja loży została zwolniona — możesz spróbować ponownie."
              : "Anulujemy nieopłaconą rezerwację loży…"
            : "Nic nie zostało pobrane. Możesz wrócić do eventu i spróbować ponownie."}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href="/eventy"
            className="galaxy-glow bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black"
          >
            Wróć do eventów
          </Link>
          <Link
            href="/konto"
            className="border border-white/20 px-6 py-3 text-sm tracking-wider text-white"
          >
            Konto
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutCancelPage() {
  return (
    <Suspense
      fallback={
        <div className="galaxy-bg flex min-h-dvh items-center justify-center px-4 pt-16">
          <p className="text-sm text-galaxy-muted">Ładowanie…</p>
        </div>
      }
    >
      <CancelInner />
    </Suspense>
  );
}
