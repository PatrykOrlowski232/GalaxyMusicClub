import type { Metadata } from "next";
import { listPublishedNews, newsCategoryLabel } from "@/server/news";

export const metadata: Metadata = {
  title: "Aktualności",
  description:
    "Newsy i ogłoszenia Galaxy Music Club Gdańsk — lineup, imprezy i informacje z klubu.",
  alternates: { canonical: "/aktualnosci" },
};

export const dynamic = "force-dynamic";

function formatWhen(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("pl-PL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

export default async function NewsPage() {
  let posts: Awaited<ReturnType<typeof listPublishedNews>> = [];
  let error: string | null = null;
  try {
    posts = await listPublishedNews();
  } catch {
    error = "Nie udało się wczytać aktualności.";
  }

  return (
    <div className="galaxy-bg min-h-dvh px-4 pb-24 pt-28 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs tracking-[0.3em] text-galaxy-pink uppercase">
          Galaxy · Gdańsk
        </p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl tracking-wide">
          Aktualności
        </h1>
        <p className="mt-4 max-w-xl text-galaxy-muted">
          Nadchodzące wydarzenia i nowe promocje. Zapisz się do newslettera w
          koncie, żeby dostać je też na e-mail.
        </p>

        {error ? (
          <p className="mt-12 text-sm text-rose-300">{error}</p>
        ) : posts.length === 0 ? (
          <p className="mt-12 text-sm text-galaxy-muted">
            Brak opublikowanych postów.
          </p>
        ) : (
          <div className="mt-12 space-y-10">
            {posts.map((post) => (
              <article
                key={post.id}
                className="border-t border-white/10 pt-8 first:border-t-0 first:pt-0"
              >
                <p className="text-xs tracking-[0.25em] text-galaxy-pink uppercase">
                  {newsCategoryLabel(post.category)} · {formatWhen(post.publishedAt)}
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl tracking-wide">
                  {post.title}
                </h2>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-galaxy-muted">
                  {post.body}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
