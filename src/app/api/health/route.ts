import { sql } from "drizzle-orm";
import { getDb } from "@/db";
import { jsonError, jsonOk } from "@/lib/api";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Probe dla Nginx / Uptime — sprawdza proces i połączenie z MySQL. */
export async function GET() {
  const started = Date.now();
  try {
    await getDb().execute(sql`SELECT 1`);
    return jsonOk(
      {
        ok: true,
        db: "up",
        ms: Date.now() - started,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    console.error("health:", error);
    return jsonError("Baza niedostępna.", 503);
  }
}
