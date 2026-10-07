import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Płatność",
  description: "Status płatności Galaxy Music Club.",
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
