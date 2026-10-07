import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { getPromoterByCode } from "@/data/promoters";
import { allowMockFallback, fetchClubEvents } from "@/lib/events";
import { getDb } from "@/db";
import { promotorWallets } from "@/db/schema";
import { PromoterSalesLanding } from "@/components/PromoterSalesLanding";

type Props = { params: Promise<{ code: string }> };

export const dynamic = "force-dynamic";

async function resolvePromoter(code: string) {
  try {
    const db = getDb();
    const [wallet] = await db
      .select({
        code: promotorWallets.accountNumber,
      })
      .from(promotorWallets)
      .where(eq(promotorWallets.accountNumber, code.toUpperCase()))
      .limit(1);

    if (wallet?.code) {
      return { code: wallet.code };
    }
  } catch (error) {
    if (!allowMockFallback) {
      console.error("resolvePromoter:", error);
      return null;
    }
  }

  if (!allowMockFallback) return null;
  const mock = getPromoterByCode(code);
  return mock ? { code: mock.code } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  const promoter = await resolvePromoter(code);
  return {
    title: promoter ? `Bilety · ${promoter.code}` : "Bilety promotora",
    description: "Kup bilet na eventy Galaxy Music Club z kodem promotora.",
    robots: { index: false, follow: true },
  };
}

export default async function InvitePage({ params }: Props) {
  const { code } = await params;
  const promoter = await resolvePromoter(code);
  if (!promoter) notFound();

  const events = await fetchClubEvents();
  const upcoming = events.filter((e) => e.status !== "wyprzedane");

  return (
    <PromoterSalesLanding
      code={promoter.code}
      events={upcoming.map((e) => ({
        slug: e.slug,
        title: e.title,
        date: e.date,
        time: e.time,
        status: e.status,
      }))}
    />
  );
}
