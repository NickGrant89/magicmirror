# Magic Mirror

Full-bleed black smart-mirror dashboard for a wall display: large clock, upcoming calendar, reminders, Blink doorbell, crypto (BTC / VET / XRP in USDT + GBP), weather, and next-event countdown.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

Production-style:

```bash
npm run build
npm start
```

## What’s live vs mock

| Widget | Source |
| --- | --- |
| Clock | Live (browser local time) |
| Weather | Live via [Open-Meteo](https://open-meteo.com/) (no key). Override location with `MIRROR_*` env vars. Falls back to mock if the API fails. |
| Crypto | Live via [CoinGecko](https://www.coingecko.com/) public API (USD treated as USDT). Falls back to mock if rate-limited/offline. |
| Calendar | Mock + CalDAV config hook |
| Reminders | Mock + Apple config hook |
| Blink doorbell | Mock + Blink config hook |
| Next-event countdown | Derived from calendar events |

## Config hooks (optional)

Copy `.env.example` to `.env.local` and fill in credentials when ready:

```bash
cp .env.example .env.local
```

- **Apple Calendar / Reminders:** `APPLE_CALDAV_URL`, `APPLE_ID`, `APPLE_APP_PASSWORD`
- **Blink:** `BLINK_EMAIL`, `BLINK_PASSWORD`, optional `BLINK_CLIENT_ID`
- **Weather location:** `MIRROR_LATITUDE`, `MIRROR_LONGITUDE`, `MIRROR_LOCATION_LABEL`

API route handlers under `src/app/api/*` check these env vars and are ready for live clients; until wired, polished mocks keep the UI usable.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui
