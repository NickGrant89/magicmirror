# Magic Mirror

Full-bleed smart-mirror dashboard tuned for a **9″ Raspberry Pi landscape screen** (~1024×600 / 1280×720): large clock, Apple album photo frame, upcoming calendar, reminders, Blink doorbell, guest Wi‑Fi QR card, Capital XTRA radio, crypto (BTC / VET / XRP / BNB / HOT in USDT + GBP), weather, and next-event countdown — on an animated night-sky background.

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

### 3. AFTER EVERY UPDATE (GitHub)

**Repo:** https://github.com/NickGrant89/magicmirror  

**Preferred:** the Pi polls GitHub Releases about every **2 minutes** and applies new zips automatically (no Mac `scp`). That is as close to “instant” as a home Pi gets without a public webhook URL. Overlapping applies are serialized with `~/.magic-mirror/apply.lock`.

**One-time on the Pi** (after this release is installed once):

```bash
cd ~/magic-mirror
bash scripts/pi/install-autoupdate.sh
```

That enables linger (`loginctl enable-linger`), the app + Chromium kiosk on boot, the zip watcher, and the GitHub fetch timer (~2 min poll). After reboot the kiosk waits for `:0` and `http://127.0.0.1:43127` before opening Chromium.

**Publish a new release** (Mac, with [GitHub CLI](https://cli.github.com/) logged in):

```bash
cd /path/to/magicmirror
bash scripts/publish-github-release.sh v16.5-signals
```

**Manual pull on the Pi** (optional — timer also does this):

```bash
bash ~/magic-mirror/scripts/pi/fetch-github-release.sh
tail -f ~/.magic-mirror/update.log
```

Or one-shot:

```bash
curl -fsSL -o ~/magic_mirror_for_mac.zip \
  https://github.com/NickGrant89/magicmirror/releases/latest/download/magic_mirror_for_mac.zip
MAGIC_MIRROR_FORCE=1 bash ~/magic-mirror/scripts/pi/apply-update.sh
```

**Fallback** (no GitHub release yet): download `magic_mirror_for_mac.zip` from the Cursor agent Artifacts into `~/Downloads`, then:

```bash
scp ~/Downloads/magic_mirror_for_mac.zip nick@192.168.1.144:~/
```

**First install / recovery** (if `~/magic-mirror` is missing):

```bash
curl -fsSL -o ~/magic_mirror_for_mac.zip \
  https://github.com/NickGrant89/magicmirror/releases/latest/download/magic_mirror_for_mac.zip
cd ~ && rm -rf magic-mirror && unzip -o magic_mirror_for_mac.zip -d magic-mirror
# flatten if nested as magic_mirror_for_mac/, then:
cd ~/magic-mirror && npm install && npm run build
bash scripts/pi/install-autoupdate.sh
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
| Calendar | Live via iCloud CalDAV when `APPLE_ID` + `APPLE_APP_PASSWORD` are set |
| News | BBC Technology + CoinDesk crypto (override with `NEWS_FEED_URL`, `NEWS_LIMIT`) |
| Calendar | Live iCloud — all events for today |
| Blink doorbell | Mock + Blink config hook |
| Next-event countdown | Derived from calendar events |

## Config hooks (optional)

Copy `.env.example` to `.env.local` and fill in credentials when ready:

```bash
cp .env.example .env.local
```

- **Apple Calendar / Reminders:** create an **app-specific password** at [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security → App-Specific Passwords. Set `APPLE_ID` (email) and `APPLE_APP_PASSWORD`. Optional `APPLE_CALDAV_URL` (defaults to `https://caldav.icloud.com`).
- **Apple Photos:** paste a share link into `APPLE_SHARED_ALBUM_URL` — either `https://photos.icloud.com/shared/album/…` (Copy Link) or classic Public Website `https://www.icloud.com/sharedalbum/#…`. Optional `NEXT_PUBLIC_PHOTO_ALBUM_NAME`, `NEXT_PUBLIC_PHOTO_INTERVAL_MS`
- **Blink:** `BLINK_EMAIL`, `BLINK_PASSWORD`, optional `BLINK_CLIENT_ID`
- **Weather location:** `MIRROR_LATITUDE`, `MIRROR_LONGITUDE`, `MIRROR_LOCATION_LABEL`
- **Radio:** `NEXT_PUBLIC_RADIO_STREAM_URL`, `NEXT_PUBLIC_RADIO_STATION_NAME`, `NEXT_PUBLIC_RADIO_STATION_TAGLINE`
- **Guest Wi‑Fi:** `NEXT_PUBLIC_WIFI_SSID`, `NEXT_PUBLIC_WIFI_PASSWORD`, `NEXT_PUBLIC_WIFI_SECURITY`, `NEXT_PUBLIC_WIFI_LABEL`
- **News:** defaults to BBC Technology + CoinDesk. Optional `NEWS_FEED_URL` (single feed), `NEWS_FEED_LABEL`, `NEWS_LIMIT` (default 8)
API route handlers under `src/app/api/*` check these env vars; until wired, polished mocks keep the UI usable.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui
