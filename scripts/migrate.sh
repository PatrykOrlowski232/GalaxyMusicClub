#!/usr/bin/env bash
# Migracje SQL z db/migrations/ — każda wykonywana dokładnie raz (tabela schema_migrations).
#
#   export DATABASE_URL=mysql://user:pass@127.0.0.1:3306/galaxy
#   ./scripts/migrate.sh              # pusta baza → db/init/*, potem nowe migracje
#   ./scripts/migrate.sh --baseline   # istniejąca baza: oznacz wszystkie migracje jako wykonane
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MIG_DIR="$ROOT/db/migrations"
INIT_DIR="$ROOT/db/init"
BASELINE=0
[[ "${1:-}" == "--baseline" ]] && BASELINE=1

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Brak DATABASE_URL" >&2
  exit 1
fi

# mysql://user:pass@host:port/db
proto_stripped="${DATABASE_URL#mysql://}"
creds="${proto_stripped%%@*}"
hostpart="${proto_stripped#*@}"
user="${creds%%:*}"
export MYSQL_PWD="${creds#*:}"
hostport="${hostpart%%/*}"
db="${hostpart#*/}"
db="${db%%\?*}"
host="${hostport%%:*}"
port="${hostport##*:}"
if [[ "$host" == "$port" ]]; then port=3306; fi

echo "Migracje → $db @ $host:$port"

mysql_cmd=(mysql -h "$host" -P "$port" -u "$user" --default-character-set=utf8mb4 "$db")
query() { "${mysql_cmd[@]}" -N -B -e "$1"; }

query "CREATE TABLE IF NOT EXISTS schema_migrations (
  name VARCHAR(255) NOT NULL PRIMARY KEY,
  applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
)"

mark_all_applied() {
  for f in "$MIG_DIR"/*.sql; do
    query "INSERT IGNORE INTO schema_migrations (name) VALUES ('$(basename "$f")')"
  done
}

has_users=$(query "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'")
applied_count=$(query "SELECT COUNT(*) FROM schema_migrations")

if [[ "$has_users" == "0" ]]; then
  echo "Pusta baza → schemat bazowy z db/init/"
  for f in "$INIT_DIR"/*.sql; do
    echo "→ $(basename "$f")"
    "${mysql_cmd[@]}" < "$f"
  done
  # db/init/01_schema.sql to zrzut zawierający już wszystkie migracje.
  mark_all_applied
elif [[ "$BASELINE" == "1" ]]; then
  echo "Baseline → oznaczam istniejące migracje jako wykonane"
  mark_all_applied
elif [[ "$applied_count" == "0" ]]; then
  echo "Baza ma tabele, ale brak historii migracji." >&2
  echo "Jeśli wszystkie migracje z db/migrations są już zastosowane, uruchom raz:" >&2
  echo "  ./scripts/migrate.sh --baseline" >&2
  exit 1
fi

for f in $(ls "$MIG_DIR"/*.sql | sort); do
  name="$(basename "$f")"
  done_already=$(query "SELECT COUNT(*) FROM schema_migrations WHERE name = '$name'")
  [[ "$done_already" != "0" ]] && continue
  echo "→ $name"
  "${mysql_cmd[@]}" < "$f"
  query "INSERT INTO schema_migrations (name) VALUES ('$name')"
done

echo "Gotowe."
