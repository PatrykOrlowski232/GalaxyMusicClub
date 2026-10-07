import type { Metadata } from "next";
import { Exo_2, Orbitron } from "next/font/google";
import { AdminProviders } from "../components/AdminProviders";
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

export const metadata: Metadata = {
  title: "Galaxy Admin",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body className={`${orbitron.variable} ${exo2.variable} antialiased`}>
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
