import type { Metadata } from "next";
import { DoorScanner } from "../../components/DoorScanner";

export const metadata: Metadata = {
  title: "Skaner wejścia",
  robots: { index: false, follow: false },
};

export default function DoorScannerPage() {
  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-20 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Wejście</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-wide">
          Skaner biletów
        </h1>
        <p className="mt-4 max-w-xl text-galaxy-muted">
          Wpisz lub zeskanuj numer biletu (np. z czytnika USB w trybie klawiatury).
        </p>
        <div className="mt-10">
          <DoorScanner />
        </div>
      </div>
    </div>
  );
}
