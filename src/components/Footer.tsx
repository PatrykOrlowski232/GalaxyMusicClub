import Link from "next/link";
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from "@/data/social";

const footerLinks = [
  { href: "/konto", label: "Konto" },
  { href: "/eventy", label: "Eventy" },
  { href: "/aktualnosci", label: "Aktualności" },
  { href: "/promocje", label: "Promocje" },
  { href: "/wynajem", label: "Sala imprezowa" },
  { href: "/promotorzy", label: "Promotorzy" },
  { href: "/regulamin", label: "Regulamin" },
] as const;

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/5 bg-galaxy-void">
      <div className="mx-auto flex max-w-6xl items-center gap-4 overflow-x-auto px-4 py-5 sm:px-6">
        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-[10px] tracking-wide text-galaxy-muted sm:text-[11px]">
          <span className="font-[family-name:var(--font-display)] tracking-[0.28em] text-white">
            GALAXY
          </span>
          <span className="text-white/20">·</span>
          <span>Tkacka 9/10, Gdańsk</span>
          <span className="text-white/20">·</span>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-galaxy-pink transition hover:text-white"
          >
            {INSTAGRAM_HANDLE}
          </a>
        </div>

        <nav className="ml-auto flex shrink-0 items-center gap-x-3 whitespace-nowrap text-[10px] tracking-wide text-galaxy-muted sm:gap-x-3.5 sm:text-[11px]">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
