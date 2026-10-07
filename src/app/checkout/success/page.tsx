import { Suspense } from "react";
import CheckoutSuccessClient from "./success-client";

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="galaxy-bg flex min-h-dvh items-center justify-center px-4 pt-16">
          <p className="text-sm text-galaxy-muted">Ładowanie…</p>
        </div>
      }
    >
      <CheckoutSuccessClient />
    </Suspense>
  );
}
