import type { Metadata } from "next";
import { Bebas_Neue, Exo_2, Orbitron } from "next/font/google";
import { JsonLd } from "@/components/JsonLd";
import { Providers } from "@/components/Providers";
import { organizationJsonLd } from "@/lib/jsonld";
import {
  DEFAULT_OG_IMAGE,
  getSiteUrl,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_NAME_FULL,
} from "@/lib/site";
import "./globals.css";

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

const exo2 = Exo_2({
  subsets: ["latin", "latin-ext"],
  variable: "--font-exo",
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME_FULL,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME_FULL }],
  creator: SITE_NAME_FULL,
  openGraph: {
    type: "website",
    locale: "pl_PL",
    siteName: SITE_NAME_FULL,
    title: SITE_NAME_FULL,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: SITE_NAME_FULL }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME_FULL,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: DEFAULT_OG_IMAGE,
    apple: DEFAULT_OG_IMAGE,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        className={`${orbitron.variable} ${exo2.variable} ${bebasNeue.variable} antialiased`}
      >
        <JsonLd data={organizationJsonLd()} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
