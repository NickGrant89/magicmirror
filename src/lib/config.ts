/**
 * Integration config hooks.
 * Set these env vars to swap mock widgets for live feeds when credentials exist.
 */
export const mirrorConfig = {
  apple: {
    /** CalDAV principal or calendar feed URL (iCloud CalDAV). */
    caldavUrl: process.env.APPLE_CALDAV_URL ?? "",
    /** Apple ID email used for CalDAV / Reminders. */
    appleId: process.env.APPLE_ID ?? "",
    /** App-specific password from appleid.apple.com. */
    appPassword: process.env.APPLE_APP_PASSWORD ?? "",
    /**
     * Public iCloud Shared Album token or full URL
     * (https://www.icloud.com/sharedalbum/#TOKEN — album must allow Public Website).
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
} as const;

export function hasAppleCalendarConfig() {
  const { caldavUrl, appleId, appPassword } = mirrorConfig.apple;
  return Boolean(caldavUrl && appleId && appPassword);
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
