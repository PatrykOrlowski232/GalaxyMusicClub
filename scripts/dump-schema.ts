/**
 * Zrzuca aktualny schemat bazy do db/init/01_schema.sql oraz słowniki
 * (*_statuses, *_states, *_types) do db/init/02_seed.sql — baza dla świeżej instalacji.
 *
 *   npm run db:dump-schema
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";

const DICTIONARY_RE = /(_statuses|_states|_types)$/;
const NOT_DICTIONARY = new Set(["user_account_types"]);

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Brak DATABASE_URL");
  const conn = await mysql.createConnection({ uri: url });

  const [tableRows] = await conn.query<mysql.RowDataPacket[]>("SHOW FULL TABLES WHERE Table_type = 'BASE TABLE'");
  const tables = tableRows.map((r) => String(Object.values(r)[0])).sort();

  const schema: string[] = [
    "-- Wygenerowane przez scripts/dump-schema.ts — nie edytuj ręcznie.",
    "SET NAMES utf8mb4;",
    "SET FOREIGN_KEY_CHECKS = 0;",
    "",
  ];
  const seed: string[] = [
    "-- Wygenerowane przez scripts/dump-schema.ts — słowniki wymagane przez aplikację.",
    "SET NAMES utf8mb4;",
    "",
  ];

  for (const table of tables) {
    const [[row]] = await conn.query<mysql.RowDataPacket[]>(`SHOW CREATE TABLE \`${table}\``);
    const ddl = String(row["Create Table"])
      .replace(/^CREATE TABLE /, "CREATE TABLE IF NOT EXISTS ")
      .replace(/ AUTO_INCREMENT=\d+/, "");
    schema.push(`${ddl};`, "");

    if (!DICTIONARY_RE.test(table) || NOT_DICTIONARY.has(table)) continue;
    const [rows] = await conn.query<mysql.RowDataPacket[]>(`SELECT * FROM \`${table}\` ORDER BY 1`);
    if (!rows.length) continue;
    const cols = Object.keys(rows[0]!);
    const values = rows
      .map((r) => `(${cols.map((c) => conn.escape(r[c])).join(", ")})`)
      .join(",\n  ");
    seed.push(
      `INSERT IGNORE INTO \`${table}\` (${cols.map((c) => `\`${c}\``).join(", ")}) VALUES\n  ${values};`,
      "",
    );
  }

  schema.push("SET FOREIGN_KEY_CHECKS = 1;", "");
  await conn.end();

  const outDir = path.join(__dirname, "..", "db", "init");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(path.join(outDir, "01_schema.sql"), schema.join("\n"));
  writeFileSync(path.join(outDir, "02_seed.sql"), seed.join("\n"));
  console.log(`schema.sql: ${tables.length} tabel; seed.sql: słowniki zapisane.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
