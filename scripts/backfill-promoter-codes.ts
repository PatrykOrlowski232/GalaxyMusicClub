/**
 * Uzupełnia / regeneruje kody w promotor_wallets.account_number
 * do formatu 12 losowych znaków.
 *
 *   npm run promoters:backfill-codes
 */
import "dotenv/config";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { promotorWallets } from "../src/db/schema";
import { isPromoterCodeFormat } from "../src/lib/promoter";
import { allocateUniquePromoterCode } from "../src/server/queries";

async function main() {
  const wallets = await db.select().from(promotorWallets);
  let updated = 0;

  for (const wallet of wallets) {
    if (isPromoterCodeFormat(wallet.accountNumber)) continue;
    const code = await allocateUniquePromoterCode();
    await db
      .update(promotorWallets)
      .set({ accountNumber: code })
      .where(eq(promotorWallets.id, wallet.id));
    console.log(
      `wallet #${wallet.id} user=${wallet.userId}: ${wallet.accountNumber ?? "(null)"} → ${code}`,
    );
    updated++;
  }

  console.log(
    updated
      ? `Zaktualizowano ${updated} kod(ów).`
      : "Wszystkie kody mają już poprawny format (12 znaków).",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
