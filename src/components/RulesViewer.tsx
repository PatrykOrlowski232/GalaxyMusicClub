"use client";

import { useMemo, useState } from "react";
import {
  rulesDocsByLang,
  type RulesDoc,
  type RulesLang,
} from "@/data/rules";

const langs: { id: RulesLang; label: string }[] = [
  { id: "pl", label: "PL" },
  { id: "en", label: "EN" },
  { id: "es", label: "ES" },
];

const docsByLang: Record<RulesLang, { id: RulesDoc; label: string }[]> = {
  pl: [
    { id: "club", label: "Regulamin klubu" },
    { id: "site", label: "Regulamin strony" },
  ],
  en: [
    { id: "club", label: "Club rules" },
    { id: "site", label: "Website terms" },
  ],
  es: [
    { id: "club", label: "Reglamento del club" },
    { id: "site", label: "Términos del sitio" },
  ],
};

export function RulesViewer() {
  const [lang, setLang] = useState<RulesLang>("pl");
  const [doc, setDoc] = useState<RulesDoc>("club");
  const content = useMemo(() => rulesDocsByLang[lang][doc], [lang, doc]);
  const docs = docsByLang[lang];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
          {content.eyebrow}
        </p>
        <div
          className="flex gap-1 border border-white/15 p-1"
          role="group"
          aria-label="Language"
        >
          {langs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLang(item.id)}
              className={`min-w-12 px-3 py-1.5 text-xs tracking-wider transition ${
                lang === item.id
                  ? "bg-white text-black"
                  : "text-galaxy-muted hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="mt-4 flex w-fit max-w-full flex-wrap gap-1 border border-white/15 p-1"
        role="tablist"
        aria-label="Document"
      >
        {docs.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={doc === item.id}
            onClick={() => setDoc(item.id)}
            className={`px-3 py-1.5 text-xs tracking-wider transition ${
              doc === item.id
                ? "bg-white text-black"
                : "text-galaxy-muted hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <h1 className="mt-8 font-[family-name:var(--font-display)] text-4xl tracking-wide">
        {content.title}
      </h1>
      <p className="mt-4 text-galaxy-muted">{content.intro}</p>

      <div className="mt-12 space-y-10">
        {content.sections.map((section, index) => (
          <section key={`${lang}-${doc}-${section.title}`}>
            <h2 className="font-[family-name:var(--font-display)] text-xl tracking-wide">
              <span className="text-galaxy-pink">
                {String(index + 1).padStart(2, "0")}
              </span>{" "}
              {section.title}
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-relaxed text-galaxy-muted">
              {section.points.map((point) => (
                <li key={point} className="border-l border-white/15 pl-4">
                  {point}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <p className="mt-16 text-xs text-galaxy-muted">{content.footer}</p>
    </div>
  );
}
