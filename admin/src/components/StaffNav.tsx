"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useMockAuth";
import { hasDoorRole, hasStaffRole } from "@/lib/roles";

const links = [
  { href: "/", label: "Panel", staffOnly: true },
  { href: "/skaner", label: "Skaner", doorOnly: true },
] as const;

export function StaffNav() {
  const pathname = usePathname();
  const { user, logout, ready } = useAuth();
  const staff = hasStaffRole(user);
  const door = hasDoorRole(user);

  const visible = links.filter((l) => {
    if (!user) return true;
    if ("staffOnly" in l && l.staffOnly) return staff;
    if ("doorOnly" in l && l.doorOnly) return door;
    return true;
  });

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-black/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center gap-6 px-4 sm:px-6">
        <span className="shrink-0 font-[family-name:var(--font-display)] text-xs tracking-[0.28em] text-white">
          GALAXY STAFF
        </span>
        <nav className="flex min-w-0 flex-1 items-center gap-5 overflow-x-auto">
          {visible.map((link) => {
            const active =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 text-sm tracking-wide transition ${
                  active ? "text-white" : "text-galaxy-muted hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-3">
          {ready && user ? (
            <>
              <span className="hidden max-w-[14rem] truncate text-xs text-galaxy-pink sm:inline">
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className="text-xs tracking-wider text-galaxy-muted transition hover:text-white"
              >
                Wyloguj
              </button>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
