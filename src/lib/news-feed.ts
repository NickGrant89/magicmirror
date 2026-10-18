import { mirrorConfig } from "@/lib/config";
import type { NewsItem } from "@/lib/types";

function decodeXml(text: string) {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .trim();
}

function tagValue(block: string, tag: string): string | undefined {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const match = block.match(re);
  if (!match?.[1]) return undefined;
  return decodeXml(match[1]);
}

export async function fetchNewsHeadlines(limit = mirrorConfig.news.limit) {
  const res = await fetch(mirrorConfig.news.feedUrl, {
    headers: {
      "User-Agent": "MagicMirror/1.0",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`News feed HTTP ${res.status}`);
  }
  const xml = await res.text();
  const channelMatch = xml.match(/<channel[\s\S]*?>([\s\S]*?)<item/i);
  const channelTitle =
    (channelMatch ? tagValue(channelMatch[1], "title") : undefined) ??
    mirrorConfig.news.feedLabel;

  const items: NewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemBlocks) {
    const title = tagValue(block, "title");
    if (!title) continue;
    const link = tagValue(block, "link");
    const publishedAt =
      tagValue(block, "pubDate") ?? tagValue(block, "dc:date");
    items.push({
      id: link || `${title}-${publishedAt ?? items.length}`,
      title,
      link,
      publishedAt,
    });
    if (items.length >= limit) break;
  }

  return {
    feedTitle: channelTitle.replace(/\s*-\s*UK$/i, "").trim() || "News",
    items,
  };
}
