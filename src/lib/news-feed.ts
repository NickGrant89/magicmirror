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

function parseFeedItems(xml: string, sourceTag: string, perFeed: number) {
  const items: NewsItem[] = [];
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const block of itemBlocks) {
    const title = tagValue(block, "title");
    if (!title) continue;
    const link = tagValue(block, "link");
    const publishedAt =
      tagValue(block, "pubDate") ?? tagValue(block, "dc:date");
    items.push({
      id: link || `${sourceTag}-${title}-${publishedAt ?? items.length}`,
      title: `[${sourceTag}] ${title}`,
      link,
      publishedAt,
    });
    if (items.length >= perFeed) break;
  }
  return items;
}

async function fetchOneFeed(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MagicMirror/1.0",
      Accept: "application/rss+xml, application/xml, text/xml, */*",
    },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`News feed HTTP ${res.status} (${url})`);
  }
  return res.text();
}

function publishMs(item: NewsItem) {
  if (!item.publishedAt) return 0;
  const t = Date.parse(item.publishedAt);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Pull tech + crypto headlines (or a single NEWS_FEED_URL override).
 */
export async function fetchNewsHeadlines(limit = mirrorConfig.news.limit) {
  const override = process.env.NEWS_FEED_URL?.trim();
  if (override) {
    const xml = await fetchOneFeed(override);
    const items = parseFeedItems(xml, "News", limit).map((item) => ({
      ...item,
      title: item.title.replace(/^\[News\]\s*/, ""),
    }));
    return {
      feedTitle: mirrorConfig.news.feedLabel,
      items,
    };
  }

  const feeds = mirrorConfig.news.feeds;
  const perFeed = Math.max(3, Math.ceil(limit / Math.max(feeds.length, 1)) + 1);
  const collected: NewsItem[] = [];

  await Promise.all(
    feeds.map(async (feed) => {
      try {
        const xml = await fetchOneFeed(feed.url);
        collected.push(...parseFeedItems(xml, feed.tag, perFeed));
      } catch {
        // one failed feed should not blank the whole panel
      }
    }),
  );

  const seen = new Set<string>();
  const items = collected
    .sort((a, b) => publishMs(b) - publishMs(a))
    .filter((item) => {
      const key = item.title.replace(/^\[[^\]]+\]\s*/, "").toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit);

  return {
    feedTitle: mirrorConfig.news.feedLabel,
    items,
  };
}
