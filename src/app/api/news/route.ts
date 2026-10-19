import { NextResponse } from "next/server";
import { mirrorConfig } from "@/lib/config";
import { fetchNewsHeadlines } from "@/lib/news-feed";
import type { NewsPayload } from "@/lib/types";

export async function GET() {
  try {
    const feed = await fetchNewsHeadlines();
    const payload: NewsPayload = {
      source: "live",
      feedTitle: feed.feedTitle || mirrorConfig.news.feedLabel,
      items: feed.items,
      note:
        feed.items.length === 0
          ? "Feed returned no headlines."
          : undefined,
    };
    return NextResponse.json(payload);
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Feed unavailable";
    return NextResponse.json({
      source: "mock",
      feedTitle: mirrorConfig.news.feedLabel,
      items: [
        {
          id: "mock-1",
          title: "Mirror news feed offline — check internet on the Pi",
        },
        {
          id: "mock-2",
          title: "Tech & crypto headlines appear here when feeds are reachable",
        },
      ],
      note: detail,
    } satisfies NewsPayload);
  }
}
