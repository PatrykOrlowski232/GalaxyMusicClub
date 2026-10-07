/**
 * Domknięcie dziennych zrzutów ruchu (do wczoraj).
 * Uruchom cronem np. codziennie 00:05:
 *   npm run traffic:snapshot
 */
import "dotenv/config";
import { ensureClosedDailySnapshots } from "../src/server/analytics";

async function main() {
  const result = await ensureClosedDailySnapshots();
  console.log(
    result.closed.length
      ? `Zamknięto dni: ${result.closed.join(", ")}`
      : "Brak nowych dni do zamknięcia.",
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
