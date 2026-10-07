"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useMockAuth } from "@/hooks/useMockAuth";
import { INSTAGRAM_URL } from "@/data/social";

const baseLinks = [
  { href: "/konto", label: "Konto" },
  { href: "/eventy", label: "Eventy" },
  { href: "/aktualnosci", label: "Aktualności" },
  { href: "/promocje", label: "Promocje" },
  { href: "/wynajem", label: "Sala imprezowa" },
  { href: "/promotorzy", label: "Promotorzy" },
  { href: "/regulamin", label: "Regulamin" },
];

export function Header() {
  const pathname = usePathname();
  const { user } = useMockAuth();
  const [open, setOpen] = useState(false);
  const links = baseLinks.filter((link) => !(user && link.href === "/konto"));

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-black/70 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-[family-name:var(--font-display)] text-sm tracking-[0.35em] text-white">
          GALAXY
        </Link>

        <nav className="hidden items-center gap-5 xl:gap-7 lg:flex">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm tracking-wide transition ${
                  active ? "text-white" : "text-galaxy-muted hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {user ? (
            <Link
              href="/konto"
              className={`max-w-[10rem] truncate text-xs tracking-wider transition hover:text-white ${
                pathname.startsWith("/konto") ? "text-white" : "text-galaxy-pink"
              }`}
              title="Twoje konto"
            >
              {user.email}
            </Link>
          ) : null}
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm tracking-wide text-galaxy-muted transition hover:text-galaxy-pink"
            aria-label="Instagram Galaxy Music Club"
          >
            IG
          </a>
        </nav>

        <button
          type="button"
          className="lg:hidden text-sm tracking-wider text-galaxy-muted"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Menu"
        >
          {open ? "Zamknij" : "Menu"}
        </button>
      </div>

      {open ? (
        <div className="border-t border-white/5 bg-black/95 px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {user ? (
              <Link
                href="/konto"
                onClick={() => setOpen(false)}
                className="truncate text-sm tracking-wide text-galaxy-pink hover:text-white"
              >
                {user.email}
              </Link>
            ) : null}
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm tracking-wide text-galaxy-muted hover:text-white"
              >
                {link.label}
              </Link>
            ))}
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="text-sm tracking-wide text-galaxy-pink hover:text-white"
            >
              Instagram
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
