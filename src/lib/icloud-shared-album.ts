/**
 * Fetch photos from Apple shared albums.
 *
 * Supports:
 * 1) Classic Public Website albums:
 *    https://www.icloud.com/sharedalbum/#TOKEN
 * 2) Newer share links (no Apple ID required when public access is on):
 *    https://photos.icloud.com/shared/album/TOKEN
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
};

type WebAssetUrlsResponse = {
  items?: Record<string, { url_location?: string; url_path?: string }>;
  locations?: Record<
    string,
    { scheme?: string; hosts?: string[]; url_location?: string }
  >;
};

type CloudKitResolveResult = {
  shortGUID?: { value?: string };
  zoneID?: { zoneName?: string; ownerRecordName?: string };
  share?: {
    fields?: Record<string, { value?: unknown }>;
  };
  anonymousPublicAccess?: {
    token?: string;
    databasePartition?: string;
  };
  requireAppleLogin?: boolean;
  ownerIdentity?: {
    nameComponents?: { givenName?: string; familyName?: string };
  };
};

type CloudKitRecord = {
  recordName?: string;
  recordType?: string;
  fields?: Record<string, { value?: unknown; type?: string }>;
};

type AssetResource = {
  downloadURL?: string;
  fileChecksum?: string;
  size?: number;
};

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15";

export function extractSharedAlbumToken(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";

  try {
    const url = new URL(trimmed);
    const albumMatch = url.pathname.match(
      /\/shared\/(?:album|gallery)\/([^/]+)/i,
    );
    if (albumMatch?.[1]) return decodeURIComponent(albumMatch[1]);
    if (url.hash) return decodeURIComponent(url.hash.replace(/^#/, ""));
  } catch {
    // plain token / non-URL
  }

  const hashIdx = trimmed.indexOf("#");
  if (hashIdx >= 0) return decodeURIComponent(trimmed.slice(hashIdx + 1));

  return trimmed.replace(/^icloud:/i, "");
}

export function isPhotosIcloudShareUrl(input: string): boolean {
  return /photos\.icloud\.com\/shared\/(?:album|gallery)\//i.test(input.trim());
}

function partitionCandidates(token: string): number[] {
  const fromToken = Number.parseInt(
    token.replace(/[^0-9a-z]/gi, "").slice(0, 2),
    36,
  );
  const seeds = Number.isFinite(fromToken) ? [fromToken % 220] : [];
  return [
    ...new Set([64, 63, 62, 27, 17, 18, 19, 20, 21, 22, ...seeds, 1, 2, 3]),
  ];
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
  const preferred =
    entries.find(
      (d) => Number(d.width ?? 0) >= 800 && Number(d.width ?? 0) <= 2048,
    ) ??
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

async function fetchClassicSharedAlbum(
  token: string,
  limit: number,
): Promise<{ albumName: string; photos: SharedAlbumPhoto[] }> {
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

function decodeFilename(enc?: string): string {
  if (!enc) return "image.jpeg";
  try {
    const padded = enc + "=".repeat((4 - (enc.length % 4)) % 4);
    const decoded = Buffer.from(padded, "base64").toString("utf8").trim();
    return decoded || "image.jpeg";
  } catch {
    return "image.jpeg";
  }
}

function materializeDownloadUrl(
  resource: AssetResource | undefined,
  filenameHint: string,
): string | null {
  const raw = resource?.downloadURL;
  if (!raw) return null;
  const baseName = filenameHint.replace(/\.[^.]+$/, "") || "image";
  const jpegName = `${baseName}.JPG`;
  return raw.split("${f}").join(encodeURIComponent(jpegName));
}

function pickMasterImageUrl(fields: CloudKitRecord["fields"]): string | null {
  if (!fields) return null;
  const filename = decodeFilename(
    typeof fields.filenameEnc?.value === "string"
      ? fields.filenameEnc.value
      : undefined,
  );
  const med = fields.resJPEGMedRes?.value as AssetResource | undefined;
  const thumb = fields.resJPEGThumbRes?.value as AssetResource | undefined;
  const original = fields.resOriginalRes?.value as AssetResource | undefined;
  const originalType =
    typeof fields.resOriginalFileType?.value === "string"
      ? fields.resOriginalFileType.value
      : "";

  return (
    materializeDownloadUrl(med, filename) ??
    materializeDownloadUrl(thumb, filename) ??
    (originalType.includes("jpeg") || originalType.includes("png")
      ? materializeDownloadUrl(original, filename)
      : null)
  );
}

async function resolveCloudKitShare(token: string): Promise<CloudKitResolveResult> {
  const res = await fetch(
    "https://ckdatabasews.icloud.com/database/1/com.apple.photos.cloud/production/public/records/resolve",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://photos.icloud.com",
        "User-Agent": USER_AGENT,
      },
      body: JSON.stringify({ shortGUIDs: [{ value: token }] }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new Error(`CloudKit resolve failed (${res.status})`);
  }
  const payload = (await res.json()) as { results?: CloudKitResolveResult[] };
  const result = payload.results?.[0];
  if (!result) {
    throw new Error("CloudKit share not found");
  }
  return result;
}

async function fetchCloudKitShareAlbum(
  token: string,
  limit: number,
): Promise<{ albumName: string; photos: SharedAlbumPhoto[] }> {
  const resolved = await resolveCloudKitShare(token);
  if (resolved.requireAppleLogin) {
    throw new Error(
      "This share requires Apple ID login — enable Anyone with the link can view, or use Public Website.",
    );
  }
  const anon = resolved.anonymousPublicAccess;
  const zone = resolved.zoneID;
  if (!anon?.token || !anon.databasePartition || !zone?.zoneName || !zone.ownerRecordName) {
    throw new Error("Share has no anonymous public access — check link permissions.");
  }

  const base = anon.databasePartition.replace(/\/$/, "");
  const qs = new URLSearchParams({
    publicAccessAuthToken: anon.token,
    sharing_url_key: token,
  });

  const records: CloudKitRecord[] = [];
  let syncToken: string | undefined;
  for (let page = 0; page < 25; page += 1) {
    const body: Record<string, unknown> = {
      zoneID: {
        zoneName: zone.zoneName,
        ownerRecordName: zone.ownerRecordName,
      },
      resultsLimit: 200,
    };
    if (syncToken) body.syncToken = syncToken;

    const res = await fetch(
      `${base}/database/1/com.apple.photos.cloud/production/shared/records/changes?${qs}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://photos.icloud.com",
          "User-Agent": USER_AGENT,
        },
        body: JSON.stringify(body),
        cache: "no-store",
      },
    );
    if (!res.ok) {
      throw new Error(`CloudKit changes failed (${res.status})`);
    }
    const data = (await res.json()) as {
      records?: CloudKitRecord[];
      moreComing?: boolean;
      syncToken?: string;
    };
    records.push(...(data.records ?? []));
    syncToken = data.syncToken;
    if (!data.moreComing) break;
  }

  const titleField = resolved.share?.fields?.["cloudkit.title"]?.value;
  const albumName =
    (typeof titleField === "string" && titleField) ||
    [
      resolved.ownerIdentity?.nameComponents?.givenName,
      resolved.ownerIdentity?.nameComponents?.familyName,
    ]
      .filter(Boolean)
      .join(" ") ||
    "Shared Album";

  const masters = records.filter((r) => r.recordType === "CPLMaster");
  // Prefer full JPEG masters; skip thumb-only duplicates of the same filename.
  const ranked = [...masters].sort((a, b) => {
    const aScore = a.fields?.resJPEGMedRes ? 2 : a.fields?.resJPEGThumbRes ? 1 : 0;
    const bScore = b.fields?.resJPEGMedRes ? 2 : b.fields?.resJPEGThumbRes ? 1 : 0;
    return bScore - aScore;
  });

  const photos: SharedAlbumPhoto[] = [];
  const seenNames = new Set<string>();

  for (const master of ranked) {
    if (!master.recordName) continue;
    const filename = decodeFilename(
      typeof master.fields?.filenameEnc?.value === "string"
        ? master.fields.filenameEnc.value
        : undefined,
    );
    const caption = filename.replace(/\.[^.]+$/, "").toLowerCase();
    if (caption && seenNames.has(caption)) continue;
    const url = pickMasterImageUrl(master.fields);
    if (!url) continue;
    if (caption) seenNames.add(caption);
    photos.push({
      id: master.recordName,
      url,
      caption: filename.replace(/\.[^.]+$/, ""),
    });
    if (photos.length >= limit) break;
  }

  return { albumName, photos };
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

  // photos.icloud.com/shared/album/… uses CloudKit anonymous access.
  // Classic icloud.com/sharedalbum/#… uses sharedstreams webstream.
  if (isPhotosIcloudShareUrl(tokenOrUrl)) {
    return fetchCloudKitShareAlbum(token, limit);
  }

  try {
    return await fetchClassicSharedAlbum(token, limit);
  } catch {
    // Plain token pasted from a photos.icloud.com link.
    return fetchCloudKitShareAlbum(token, limit);
  }
}
