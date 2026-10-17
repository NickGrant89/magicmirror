/**
 * Fetch photos from a public iCloud Shared Album.
 * Album must have “Public Website” enabled in Photos.
 * Token = the part after # in https://www.icloud.com/sharedalbum/#TOKEN
 */

type WebStreamPhoto = {
  photoGuid?: string;
  mediaAssetType?: string;
  derivatives?: Record<
    string,
    { checksum?: string; width?: string | number; height?: string | number }
  >;
};

type WebStreamResponse = {
  photos?: WebStreamPhoto[];
  streamName?: string;
  userFirstName?: string;
  userLastName?: string;
};

type WebAssetUrlsResponse = {
  items?: Record<string, { url_location?: string; url_path?: string }>;
  locations?: Record<
    string,
    { scheme?: string; hosts?: string[]; url_location?: string }
  >;
};

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export function extractSharedAlbumToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const hashIdx = trimmed.indexOf("#");
  if (hashIdx >= 0) return decodeURIComponent(trimmed.slice(hashIdx + 1));
  try {
    const url = new URL(trimmed);
    if (url.hash) return decodeURIComponent(url.hash.replace(/^#/, ""));
  } catch {
    // plain token
  }
  return trimmed.replace(/^icloud:/i, "");
}

function partitionCandidates(token: string): number[] {
  const fromToken = Number.parseInt(token.replace(/[^0-9a-z]/gi, "").slice(0, 2), 36);
  const seeds = Number.isFinite(fromToken) ? [fromToken % 220] : [];
  return [...new Set([64, 63, 62, 27, 17, 18, 19, 20, 21, 22, ...seeds, 1, 2, 3])];
}

async function postWebstream(partition: number, token: string) {
  const url = `https://p${partition}-sharedstreams.icloud.com/${encodeURIComponent(token)}/sharedstreams/webstream`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache",
      "User-Agent": USER_AGENT,
    },
    body: JSON.stringify({ streamCtag: null }),
    cache: "no-store",
  });
}

async function resolveWebstream(token: string): Promise<{
  data: WebStreamResponse;
  partition: number;
}> {
  for (const partition of partitionCandidates(token)) {
    const res = await postWebstream(partition, token);
    if (res.status === 200) {
      return { data: (await res.json()) as WebStreamResponse, partition };
    }
    if (res.status === 330) {
      const headerHost = res.headers.get("x-apple-mme-host");
      let bodyHost: string | undefined;
      try {
        const body = (await res.json()) as { "X-Apple-MMe-Host"?: string };
        bodyHost = body["X-Apple-MMe-Host"];
      } catch {
        bodyHost = undefined;
      }
      const host = bodyHost || headerHost;
      if (host) {
        const redirect = await fetch(
          `https://${host}/${encodeURIComponent(token)}/sharedstreams/webstream`,
          {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
              "Cache-Control": "no-cache",
              "User-Agent": USER_AGENT,
            },
            body: JSON.stringify({ streamCtag: null }),
            cache: "no-store",
          },
        );
        if (redirect.ok) {
          const match = host.match(/p(\d+)-/);
          return {
            data: (await redirect.json()) as WebStreamResponse,
            partition: match ? Number(match[1]) : partition,
          };
        }
      }
    }
  }
  throw new Error("Unable to reach iCloud shared album webstream");
}

function pickDerivativeChecksum(photo: WebStreamPhoto): string | null {
  const derivatives = photo.derivatives ?? {};
  const entries = Object.values(derivatives).filter((d) => d?.checksum);
  if (entries.length === 0) return null;
  entries.sort(
    (a, b) =>
      Number(b.width ?? 0) * Number(b.height ?? 0) -
      Number(a.width ?? 0) * Number(a.height ?? 0),
  );
  // Prefer a mid/large size for the Pi screen — skip enormous originals when possible.
  const preferred =
    entries.find((d) => Number(d.width ?? 0) >= 800 && Number(d.width ?? 0) <= 2048) ??
    entries[Math.min(1, entries.length - 1)] ??
    entries[0];
  return preferred.checksum ?? null;
}

async function fetchAssetUrls(
  partition: number,
  token: string,
  photoGuids: string[],
): Promise<WebAssetUrlsResponse> {
  const res = await fetch(
    `https://p${partition}-sharedstreams.icloud.com/${encodeURIComponent(token)}/sharedstreams/webasseturls`,
    {
      method: "POST",
      headers: {
        "Content-Type": "text/plain",
        "Cache-Control": "no-cache",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ photoGuids }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`webasseturls failed (${res.status})`);
  }
  return (await res.json()) as WebAssetUrlsResponse;
}

function buildAssetUrl(
  assets: WebAssetUrlsResponse,
  checksum: string,
): string | null {
  const item = assets.items?.[checksum];
  if (!item?.url_path) return null;
  const locationKey = item.url_location;
  const location = locationKey ? assets.locations?.[locationKey] : undefined;
  const host = location?.hosts?.[0];
  const scheme = location?.scheme ?? "https";
  if (!host) return null;
  const path = item.url_path.startsWith("/") ? item.url_path : `/${item.url_path}`;
  return `${scheme}://${host}${path}`;
}

export type SharedAlbumPhoto = {
  id: string;
  url: string;
  caption?: string;
};

export async function fetchSharedAlbumPhotos(
  tokenOrUrl: string,
  limit = 24,
): Promise<{ albumName: string; photos: SharedAlbumPhoto[] }> {
  const token = extractSharedAlbumToken(tokenOrUrl);
  if (!token) {
    throw new Error("Missing shared album token");
  }

  const { data, partition } = await resolveWebstream(token);
  const images = (data.photos ?? [])
    .filter((p) => (p.mediaAssetType ?? "image") !== "video")
    .slice(0, limit);

  const guids = images
    .map((p) => p.photoGuid)
    .filter((g): g is string => Boolean(g));

  if (guids.length === 0) {
    return {
      albumName: data.streamName ?? "Shared Album",
      photos: [],
    };
  }

  const assets = await fetchAssetUrls(partition, token, guids);
  const photos: SharedAlbumPhoto[] = [];

  for (const photo of images) {
    if (!photo.photoGuid) continue;
    const checksum = pickDerivativeChecksum(photo);
    if (!checksum) continue;
    const url = buildAssetUrl(assets, checksum);
    if (!url) continue;
    photos.push({
      id: photo.photoGuid,
      url,
    });
  }

  return {
    albumName: data.streamName ?? "Shared Album",
    photos,
  };
}
