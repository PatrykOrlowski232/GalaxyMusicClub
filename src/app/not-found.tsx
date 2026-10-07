import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Nie znaleziono",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="galaxy-bg flex min-h-dvh items-center justify-center px-4 pt-16">
      <div className="text-center">
        <p className="font-[family-name:var(--font-display)] text-5xl tracking-wide text-galaxy-pink">
          404
        </p>
        <h1 className="mt-4 text-xl text-white">Nie znaleziono tej strony</h1>
        <p className="mt-2 text-galaxy-muted">Ta ścieżka nie istnieje w Galaxy.</p>
        <Link
          href="/"
          className="mt-8 inline-block text-sm tracking-wider text-white hover:text-galaxy-pink"
        >
          Wróć na start →
        </Link>
      </div>
    </div>
  );
}
