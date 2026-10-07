# Deploy Galaxy na VPS (Node + MySQL + Nginx + PM2)

## Checklist `.env` (produkcja)

```env
DATABASE_URL=mysql://...
AUTH_SECRET=…          # openssl rand -base64 48 (≥32 znaki, nie z example)
APP_URL=https://twoja-domena.pl
STRIPE_SECRET_KEY=sk_live_…
STRIPE_WEBHOOK_SECRET=whsec_…
# bez STRIPE_TLS_INSECURE i SMTP_TLS_INSECURE
SENTRY_DSN=…           # zalecane
```

## Pierwszy raz

```bash
sudo mkdir -p /var/www/galaxy
# wgraj kod do /var/www/galaxy
cd /var/www/galaxy
cp .env.example .env
nano .env   # checklist powyżej

chmod +x scripts/migrate.sh scripts/backup-mysql.sh
set -a && . ./.env && set +a
./scripts/migrate.sh    # pusta baza → schemat z db/init/ + słowniki
# baza przeniesiona z innego serwera (wszystkie migracje już są): ./scripts/migrate.sh --baseline

npm ci
npm run build
# ecosystem.config.cjs ładuje .env z katalogu aplikacji
pm2 start ecosystem.config.cjs
pm2 save && pm2 startup
```

Nginx + Certbot:

```nginx
location /api/health {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    access_log off;
}

location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

`X-Real-IP` jest wymagany — rate-limit logowania/rejestracji opiera się na nim.

Probe: `curl -fsS https://twoja-domena.pl/api/health` → `{"ok":true,"db":"up",…}`.

## Stripe webhook

W Stripe Dashboard (live) włącz:
`checkout.session.completed`,
`checkout.session.async_payment_succeeded`,
`checkout.session.expired`
(to ostatnie zwalnia zarezerwowane bilety po 30 min bez płatności).

Endpoint: `https://twoja-domena.pl/api/webhooks/stripe`

## Aktualizacja

```bash
cd /var/www/galaxy
# git pull / rsync
set -a && . ./.env && set +a
./scripts/migrate.sh
npm ci
npm run build
pm2 reload ecosystem.config.cjs --update-env
```

## Backup MySQL (cron)

```cron
0 3 * * * cd /var/www/galaxy && set -a && . ./.env && set +a && ./scripts/backup-mysql.sh
```

Kopie w `backups/galaxy-*.sql.gz` (domyślnie 14 dni).

## Sentry

W `.env`:

```env
SENTRY_DSN=https://…@….ingest.sentry.io/…
```

Błędy webhooków Stripe i inne `captureException` trafiają do Sentry.

## Panel Admin (osobna aplikacja, port 3001)

```bash
npm run build:admin
pm2 start ecosystem.config.cjs   # startuje galaxy (3000) + galaxy-admin (3001)
```

Lokalnie: `npm run dev:admin` albo oba naraz `npm run dev:all`.

Nginx — osobny host lub lokalizacja, np. `admin.twoja-domena.pl` → `127.0.0.1:3001`.
To samo `AUTH_SECRET` i baza — logowanie staff działa jak na stronie publicznej.

## Skaner drzwi

`http://localhost:3001/skaner` (aplikacja staff) — role Admin / Owner / Barman / Manager.

## Staff

Nie uruchamiaj `npm run db:seed-staff` na VPS (hasła deweloperskie).
Utwórz Admin/Owner ręcznie albo z `ALLOW_SEED_STAFF=1` i natychmiast zmień hasła.
