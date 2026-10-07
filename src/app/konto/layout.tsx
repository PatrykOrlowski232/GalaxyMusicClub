import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Konto",
  description: "Logowanie i profil gościa Galaxy Music Club.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
