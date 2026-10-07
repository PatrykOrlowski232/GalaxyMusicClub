#!/usr/bin/env bash
# Backup MySQL (gzip). Cron np. codziennie 3:00:
#   0 3 * * * /var/www/galaxy/scripts/backup-mysql.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Brak DATABASE_URL" >&2
  exit 1
fi

proto_stripped="${DATABASE_URL#mysql://}"
creds="${proto_stripped%%@*}"
hostpart="${proto_stripped#*@}"
user="${creds%%:*}"
export MYSQL_PWD="${creds#*:}"
hostport="${hostpart%%/*}"
db="${hostpart#*/}"
host="${hostport%%:*}"
port="${hostport##*:}"
if [[ "$host" == "$port" ]]; then port=3306; fi

mkdir -p "$BACKUP_DIR"
stamp="$(date +%Y%m%d-%H%M%S)"
out="$BACKUP_DIR/galaxy-$stamp.sql.gz"

echo "Backup → $out"
mysqldump -h "$host" -P "$port" -u "$user" \
  --single-transaction --routines --triggers "$db" | gzip > "$out"

find "$BACKUP_DIR" -name 'galaxy-*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "OK ($(du -h "$out" | cut -f1))"
