/**
 * Integration config hooks.
 * Set these env vars to swap mock widgets for live feeds when credentials exist.
 */
export const mirrorConfig = {
  apple: {
    /** CalDAV server (defaults to iCloud). */
    caldavUrl: process.env.APPLE_CALDAV_URL ?? "https://caldav.icloud.com",
    /** Apple ID email used for CalDAV / Reminders. */
    appleId: process.env.APPLE_ID ?? "",
    /** App-specific password from appleid.apple.com (not your normal password). */
    appPassword: process.env.APPLE_APP_PASSWORD ?? "",
    /**
     * Shared album URL — photos.icloud.com/shared/album/… or classic Public Website.
     */
    sharedAlbum:
      process.env.APPLE_SHARED_ALBUM_TOKEN ??
      process.env.APPLE_SHARED_ALBUM_URL ??
      "",
  },
  blink: {
    email: process.env.BLINK_EMAIL ?? "",
    password: process.env.BLINK_PASSWORD ?? "",
    /** Optional Blink client / device id if your bridge requires it. */
    clientId: process.env.BLINK_CLIENT_ID ?? "",
  },
  weather: {
    latitude: Number(process.env.MIRROR_LATITUDE ?? "51.5074"),
    longitude: Number(process.env.MIRROR_LONGITUDE ?? "-0.1278"),
    locationLabel: process.env.MIRROR_LOCATION_LABEL ?? "London",
  },
  photos: {
    intervalMs: Number(process.env.NEXT_PUBLIC_PHOTO_INTERVAL_MS ?? "12000"),
    albumLabel: process.env.NEXT_PUBLIC_PHOTO_ALBUM_NAME ?? "Family Album",
  },
  news: {
    feedLabel: process.env.NEWS_FEED_LABEL ?? "Tech & Crypto",
    limit: Number(process.env.NEWS_LIMIT ?? "8"),
    /** Optional single-feed override. Otherwise tech + crypto feeds below. */
    feeds: [
      {
        tag: "Tech",
        url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
      },
      {
        tag: "Crypto",
        url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
      },
    ],
  },
} as const;

export function hasAppleCalendarConfig() {
  const { appleId, appPassword } = mirrorConfig.apple;
  return Boolean(appleId && appPassword);
}

export function hasAppleTasksConfig() {
  const { appleId, appPassword } = mirrorConfig.apple;
  return Boolean(appleId && appPassword);
}

export function hasBlinkConfig() {
  const { email, password } = mirrorConfig.blink;
  return Boolean(email && password);
}

export function hasAppleSharedAlbumConfig() {
  return Boolean(mirrorConfig.apple.sharedAlbum.trim());
}
