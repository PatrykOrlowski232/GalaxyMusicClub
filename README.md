# Galaxy Music Club

Frontend + backend pod **Galaxy DB v0.2**.

## Baza danych

SQL zgodny z dokumentacją:

- [`db/schema.sql`](db/schema.sql) — 28 tabel, FK, indeksy
- [`db/seed.sql`](db/seed.sql) — słowniki + przykładowe eventy / loże / artyści

```bash
cp .env.example .env
npm run preview
# albo: npm run db:up && npm run dev
```

Podgląd lokalny (Windows + istniejący MySQL): baza `galaxy` / user `galaxy` / hasło `galaxy`, aplikacja na **http://localhost:3000**.

Panel Admin (osobna aplikacja): **http://localhost:3001** — `npm run dev:admin` (albo `npm run dev:all`).
Skaner biletów: **http://localhost:3001/skaner**. To samo logowanie (cookie + `AUTH_SECRET`), role Admin/Owner/Barman/Manager.

MySQL: `localhost:3306`, baza `galaxy`, user/hasło `galaxy` / `galaxy`.

## API (Next.js)

| Endpoint | Opis |
|---|---|
| `POST /api/auth/register` | `users` + rola Customer |
| `POST /api/auth/login` | sesja JWT (cookie) |
| `POST /api/auth/logout` | wylogowanie |
| `GET /api/auth/me` | bieżąca sesja |
| `GET /api/events` | wydarzenia + bilety + lineup |
| `GET /api/events/[id]` | szczegóły eventu |
| `GET /api/lounges` | loże + piętra |
| `POST /api/lounges/reservations` | `lounge_reservations` |
| `GET/POST /api/promoters/me` | portfel / aktywacja Promotor |
| `GET /api/promoters/[code]` | publiczne zaproszenie |

## Stripe Checkout

1. Klucze testowe w `.env`: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `APP_URL`
2. Lokalny webhook:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. Na stronie eventu: **Kup przez Stripe** (wymaga logowania)
4. Po sukcesie: bilety w `/konto`, rekordy w `orders` / `payments` / `tickets`

Bilety 0 zł (guestlist) omijają Stripe i od razu lądują w koncie.

## Konta staff (tylko lokalny CRUD)

Hasła seed są **wyłącznie do developmentu** (`npm run db:seed-staff`).
Na VPS nie uruchamiaj seed — utwórz Admin/Owner z silnymi hasłami albo
po seedzie natychmiast je zmień. W produkcji skrypt wymaga `ALLOW_SEED_STAFF=1`.

Panel: [/admin](http://localhost:3000/admin) — eventy, loże, rezerwacje, bilety, oferty, artyści, role użytkowników.

