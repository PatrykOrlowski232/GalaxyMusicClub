import Link from "next/link";

export function Hero() {
  return (
    <section className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 pt-16">
      <video
        className="absolute inset-0 h-full w-full object-cover"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        aria-hidden
      >
        <source src="/hero.mp4" type="video/mp4" />
      </video>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/45 to-black/80"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 animate-soft-pulse"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 50% 40%, rgba(233,30,140,0.22), transparent 48%)",
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col items-center text-center">
        <p className="animate-fade-up font-[family-name:var(--font-display)] text-[clamp(2.75rem,12vw,5.5rem)] font-bold leading-none tracking-[0.18em] text-white">
          GALAXY
        </p>
        <p className="animate-fade-up mt-3 text-xs tracking-[0.45em] text-white/80 uppercase sm:text-sm">
          Music Club — Gdańsk
        </p>

        <h1 className="sr-only">Galaxy Music Club Gdańsk</h1>

        <p className="animate-fade-up-delay mt-6 max-w-md text-base text-white/75 sm:text-lg">
          Nocne brzmienia w kosmicznej scenerii.
        </p>

        <div className="animate-fade-up-delay-2 mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/eventy"
            className="galaxy-glow rounded-sm bg-white px-7 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink"
          >
            Kup bilety
          </Link>
          <Link
            href="/konto"
            className="rounded-sm border border-white/35 px-7 py-3 text-sm tracking-wider text-white transition hover:border-galaxy-magenta hover:text-galaxy-pink"
          >
            Załóż konto
          </Link>
        </div>
      </div>
    </section>
  );
}
