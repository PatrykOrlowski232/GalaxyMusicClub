import type { Metadata } from "next";
import { LoungeBookingForm } from "@/components/LoungeBookingForm";

export const metadata: Metadata = {
  title: "Rezerwacje loży",
  description:
    "Zarezerwuj lożę VIP na event w Galaxy Music Club Gdańsk. Zaliczka online, reszta na miejscu.",
  alternates: { canonical: "/loze" },
};

export default function LoungesPage() {
  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">VIP</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-wide">
          Rezerwacje loży
        </h1>
        <p className="mt-4 max-w-xl text-galaxy-muted">
          Najpierw wybierz event, potem wolną lożę. Rezerwacja wymaga wpłaty{" "}
          <span className="text-white">20% zaliczki</span> online. Loża ={" "}
          <span className="text-white">darmowe wejście</span> + cała kwota do
          wykorzystania <span className="text-white">na barze</span>.
        </p>

        <div className="mt-12 max-w-2xl">
          <LoungeBookingForm />
        </div>
      </div>
    </div>
  );
}
