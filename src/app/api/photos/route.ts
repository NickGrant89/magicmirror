import { NextResponse } from "next/server";
import {
  hasAppleSharedAlbumConfig,
  mirrorConfig,
} from "@/lib/config";
import { fetchSharedAlbumPhotos } from "@/lib/icloud-shared-album";
import type { AlbumPhoto, PhotosPayload } from "@/lib/types";

const MOCK_PHOTOS: AlbumPhoto[] = [
  {
    id: "mock-1",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "mock-2",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "mock-3",
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "mock-4",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "mock-5",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: "mock-6",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
  },
];

function proxied(photos: AlbumPhoto[]): AlbumPhoto[] {
  return photos.map((p) => ({
    id: p.id,
    // Serve via local proxy so Chromium on the Pi can load iCloud CDN assets.
    url: `/api/photos/img?u=${encodeURIComponent(p.url)}`,
  }));
}

function mockPayload(note: string): PhotosPayload {
  return {
    source: "mock",
    albumName: mirrorConfig.photos.albumLabel,
    photos: proxied(MOCK_PHOTOS),
    note,
  };
}

/**
 * Returns album photos for the frame.
 * Live path: public iCloud Shared Album (APPLE_SHARED_ALBUM_TOKEN / URL).
 */
export async function GET() {
  if (hasAppleSharedAlbumConfig()) {
    try {
      const album = await fetchSharedAlbumPhotos(
        mirrorConfig.apple.sharedAlbum,
        40,
      );
      if (album.photos.length === 0) {
        return NextResponse.json(
          mockPayload(
            "Shared album returned no photos — showing mock frame until images appear.",
          ),
        );
      }
      const payload: PhotosPayload = {
        source: "live",
        albumName: album.albumName || mirrorConfig.photos.albumLabel,
        photos: proxied(album.photos),
      };
      return NextResponse.json(payload);
    } catch (err) {
      const detail =
        err instanceof Error ? err.message : "Check album link / permissions.";
      return NextResponse.json(
        mockPayload(
          `Apple album fetch failed — showing mock photos. ${detail}`,
        ),
      );
    }
  }

  return NextResponse.json(
    mockPayload(
      "Mock album. Set APPLE_SHARED_ALBUM_URL to a photos.icloud.com share link.",
    ),
  );
}
