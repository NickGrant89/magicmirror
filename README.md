# Magic Mirror

Full-bleed smart-mirror dashboard tuned for a **9″ Raspberry Pi landscape screen** (~1024×600 / 1280×720): large clock, Apple album photo frame, upcoming calendar, reminders, Blink doorbell, guest Wi‑Fi QR card, Capital XTRA radio, crypto (BTC / VET / XRP in USDT + GBP), weather, and next-event countdown — on an animated night-sky background.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43127](http://127.0.0.1:43127).

Production-style (recommended on the Pi):

```bash
npm run build
npm start
```

## Use on a Raspberry Pi (9″ screen)

Layout is locked to one viewport for ~1024×600 / 1280×720 landscape panels.

### 1. Put Node on the Pi

Raspberry Pi OS (Bookworm+) example:

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # should be 20+
```

### 2. Get this project onto the Pi

Clone your repo (after you create/push one), or copy the folder over with `scp`/`rsync`:

```bash
git clone <your-repo-url> magic-mirror
cd magic-mirror
git checkout cursor/magic-mirror-dashboard-a8ca   # if needed
```

### 3. Full update + run on the Pi (recommended)

Do this whenever you get a new `magic_mirror_for_mac.zip`.

**A. On your Mac — copy the zip to the Pi**

```bash
scp "/Users/Nick/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-49af559d-8e32-415f-8dc0-796abe65ea0f/files/artifacts/magic_mirror_for_mac.zip" nick@192.168.1.144:~/
```

(Change the Pi hostname/IP if yours is different.)

**B. On the Pi — replace the app and rebuild**

```bash
# stop old mirror + browser
sudo fuser -k 43127/tcp 2>/dev/null
sudo pkill -9 -f "next start" 2>/dev/null
pkill -9 chromium 2>/dev/null
pkill -9 chromium-browser 2>/dev/null

# clean leftover junk from earlier mistakes
rm -f ~/package.json ~/package-lock.json
rm -rf ~/node_modules ~/.next

# install fresh copy
cd ~
rm -rf magic-mirror
unzip -o magic_mirror_for_mac.zip -d magic-mirror
cd magic-mirror
pwd
# must show: /home/nick/magic-mirror

# prove new files are there
ls src/components/mirror/guest-wifi-card.tsx
ls src/components/mirror/photo-frame.tsx
grep "v5" src/components/mirror/mirror-board.tsx

# build + start
node -v          # need v20+
npm install
rm -rf .next
npm run build
npm start
```

Leave that terminal open. App listens on **http://127.0.0.1:43127**.

**C. Open fullscreen on the Pi desktop** (VNC or local keyboard — not plain SSH without DISPLAY):

```bash
DISPLAY=:0 chromium-browser --kiosk --new-window http://127.0.0.1:43127
```

Top-right should say **`9″ Pi · v5`**. If it still says v3/v4, the old process is still running — repeat the kill steps.

**D. Restart later**

```bash
sudo fuser -k 43127/tcp
cd ~/magic-mirror
npm start
DISPLAY=:0 chromium-browser --kiosk --new-window http://127.0.0.1:43127
```

### 4. If you insist on building on the Pi

```bash
node -v   # must be v20+ — not the old apt node 12/16/18
npm install
NODE_OPTIONS=--max-old-space-size=2048 npm run build
npm start
```

Add swap if the build is killed (`Killed` / exit `137`):

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### 5. Open fullscreen (kiosk)

```bash
chromium-browser --kiosk --noerrdialogs --disable-infobars \
  --check-for-update-interval=31536000 \
  http://127.0.0.1:43127
```

On some Pi OS builds the binary is `chromium` instead of `chromium-browser`.

### 6. Optional: start on boot

```bash
# terminal 1
cd ~/magic-mirror && npm start

# terminal 2
chromium-browser --kiosk http://127.0.0.1:43127
```

### Pi troubleshooting

| Symptom | Fix |
| --- | --- |
| `node: not found` / old Node | Install Node 22 (Nodesource) — Next 16 needs **20+** |
| `npm run build` → `Killed` / 137 | Out of RAM — build on Mac instead, or add 2G swap |
| `next: not found` | Run `npm install` inside the project folder first |
| Unzip leaves files in home | `mkdir magic-mirror && unzip … -d magic-mirror && cd magic-mirror` |
| Port in use | `lsof -i :43127` then stop the other process |

Tips:
- Landscape at the panel’s native resolution
- Never use `npm run dev` on the Pi for daily use
- Weather/crypto/radio need internet; calendar/Blink stay mock until configured

## What’s live vs mock

| Widget | Source |
| --- | --- |
| Clock | Live (browser local time) |
| Weather | Live via [Open-Meteo](https://open-meteo.com/) (no key). Override location with `MIRROR_*` env vars. Falls back to mock if the API fails. |
| Crypto | Live via [CoinGecko](https://www.coingecko.com/) public API (USD treated as USDT). Falls back to mock if rate-limited/offline. |
| Radio | Live [Capital XTRA](https://www.capitalxtra.com/) stream (play/pause). Override with `NEXT_PUBLIC_RADIO_*`. |
| Guest Wi‑Fi | Live QR + SSID/password card (`DIGI-Guest` by default). Override with `NEXT_PUBLIC_WIFI_*`. |
| Photo frame | Mock slideshow by default. Live via public **iCloud Shared Album** (`APPLE_SHARED_ALBUM_TOKEN` / URL). |
| Bluetooth speaker | Status + volume on the Pi (`pactl` / `bluetoothctl`). Pair once in Pi OS, set `BLUETOOTH_SPEAKER_MAC`. |
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
- **Apple Photos (Shared Album):** `APPLE_SHARED_ALBUM_TOKEN` or `APPLE_SHARED_ALBUM_URL` — enable **Public Website** on the album, then paste the link/token. Optional `NEXT_PUBLIC_PHOTO_ALBUM_NAME`, `NEXT_PUBLIC_PHOTO_INTERVAL_MS`
- **Blink:** `BLINK_EMAIL`, `BLINK_PASSWORD`, optional `BLINK_CLIENT_ID`
- **Weather location:** `MIRROR_LATITUDE`, `MIRROR_LONGITUDE`, `MIRROR_LOCATION_LABEL`
- **Radio:** `NEXT_PUBLIC_RADIO_STREAM_URL`, `NEXT_PUBLIC_RADIO_STATION_NAME`, `NEXT_PUBLIC_RADIO_STATION_TAGLINE`
- **Guest Wi‑Fi:** `NEXT_PUBLIC_WIFI_SSID`, `NEXT_PUBLIC_WIFI_PASSWORD`, `NEXT_PUBLIC_WIFI_SECURITY`, `NEXT_PUBLIC_WIFI_LABEL`
- **Bluetooth speaker:** Pair in Pi Bluetooth settings first, then set `BLUETOOTH_SPEAKER_MAC` (from `bluetoothctl devices`) and optional `BLUETOOTH_SPEAKER_NAME`. Mirror **Connect** / volume buttons call `bluetoothctl` + `pactl`.

API route handlers under `src/app/api/*` check these env vars and are ready for live clients; until wired, polished mocks keep the UI usable.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui
