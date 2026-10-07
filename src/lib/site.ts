/** Publiczna baza URL witryny (SEO, OG, sitemap, Stripe, OAuth). */
export function getSiteUrl(): string {
  const url =
    process.env.APP_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");

  if (url) return url;

  if (process.env.NODE_ENV === "production") {
    throw new Error("Brak APP_URL — ustaw https://twoja-domena.pl w .env.");
  }
  return "http://localhost:3000";
}

export const SITE_NAME = "Galaxy Music Club";
export const SITE_NAME_FULL = "Galaxy Music Club Gdańsk";
export const SITE_DESCRIPTION =
  "Galaxy Music Club Gdańsk — eventy techno i house, bilety online, loże VIP i program promotorski. Tkacka 9/10.";
export const DEFAULT_OG_IMAGE = "/galaxy-logo.png";
