import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy album image bytes so the Pi kiosk can load iCloud CDN URLs
 * (those hosts often reject requests without a photos.icloud.com Referer).
 */
function isAllowedHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return (
    h === "images.unsplash.com" ||
    h.endsWith(".icloud-content.com") ||
    h.endsWith(".icloud.com") ||
    h === "icloud.com"
  );
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) {
    return NextResponse.json({ error: "Missing u" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ error: "Bad url" }, { status: 400 });
  }

  if (target.protocol !== "https:" || !isAllowedHost(target.hostname)) {
    return NextResponse.json({ error: "Host not allowed" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: {
        Accept: "image/*,*/*;q=0.8",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        Referer: "https://photos.icloud.com/",
        Origin: "https://photos.icloud.com",
      },
      cache: "no-store",
      redirect: "follow",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 },
      );
    }

    const contentType =
      upstream.headers.get("content-type") ?? "image/jpeg";
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=1800",
      },
    });
  } catch {
    return NextResponse.json({ error: "Fetch failed" }, { status: 502 });
  }
}
