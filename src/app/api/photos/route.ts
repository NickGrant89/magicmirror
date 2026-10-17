import { NextResponse } from "next/server";
import {
  hasAppleSharedAlbumConfig,
  mirrorConfig,
} from "@/lib/config";
import { fetchSharedAlbumPhotos } from "@/lib/icloud-shared-album";
import type { PhotosPayload } from "@/lib/types";

const MOCK_PHOTOS = [
  {
    id: "mock-1",
    url: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80",
    caption: "Mountain light",
  },
  {
    id: "mock-2",
    url: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1200&q=80",
    caption: "Forest path",
  },
  {
    id: "mock-3",
    url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
    caption: "Lakeside",
  },
  {
    id: "mock-4",
    url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
    caption: "Foggy hills",
  },
  {
    id: "mock-5",
    url: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
    caption: "Sun through trees",
  },
  {
    id: "mock-6",
    url: "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1200&q=80",
    caption: "Night peaks",
  },
];

function mockPayload(note: string): PhotosPayload {
  return {
    source: "mock",
    albumName: mirrorConfig.photos.albumLabel,
    photos: MOCK_PHOTOS,
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
        30,
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
        photos: album.photos,
      };
      return NextResponse.json(payload);
    } catch {
      return NextResponse.json(
        mockPayload(
          "Apple Shared Album fetch failed — showing mock photos. Check token / Public Website.",
        ),
      );
    }
  }

  return NextResponse.json(
    mockPayload(
      "Mock album. Set APPLE_SHARED_ALBUM_TOKEN (or APPLE_SHARED_ALBUM_URL) for iCloud Shared Album.",
    ),
  );
}
