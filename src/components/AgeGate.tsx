"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "galaxy-age-verified";

export function AgeGate() {
  const [visible, setVisible] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "yes") return;
      if (saved === "no") {
        setDenied(true);
        setVisible(true);
        return;
      }
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [visible]);

  function confirmAdult() {
    localStorage.setItem(STORAGE_KEY, "yes");
    setDenied(false);
    setVisible(false);
  }

  function denyAdult() {
    localStorage.setItem(STORAGE_KEY, "no");
    setDenied(true);
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
    >
      <div className="w-full max-w-md border border-white/15 bg-galaxy-void p-8 text-center shadow-[0_0_40px_rgba(155,45,255,0.2)] animate-fade-up">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">Galaxy Music Club</p>
        <h2
          id="age-gate-title"
          className="mt-4 font-[family-name:var(--font-display)] text-2xl tracking-wide text-white sm:text-3xl"
        >
          {denied ? "Wstęp tylko 18+" : "Czy jesteś osobą pełnoletnią?"}
        </h2>

        {denied ? (
          <>
            <p className="mt-4 text-sm leading-relaxed text-galaxy-muted">
              Ta strona i klub są przeznaczone wyłącznie dla osób, które ukończyły 18 lat.
            </p>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(STORAGE_KEY);
                setDenied(false);
              }}
              className="mt-8 text-sm tracking-wider text-galaxy-pink hover:underline"
            >
              Cofnij wybór
            </button>
          </>
        ) : (
          <>
            <p className="mt-4 text-sm leading-relaxed text-galaxy-muted">
              Potwierdź, że masz ukończone 18 lat, aby wejść na stronę klubu.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={confirmAdult}
                className="galaxy-glow bg-white px-6 py-3 text-sm font-semibold tracking-wider text-black transition hover:bg-galaxy-pink"
              >
                Tak, mam 18 lat
              </button>
              <button
                type="button"
                onClick={denyAdult}
                className="border border-white/20 px-6 py-3 text-sm tracking-wider text-galaxy-muted transition hover:border-white/40 hover:text-white"
              >
                Nie
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
