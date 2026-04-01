import { logger } from "./logger";

const SCRAPE_TIMEOUT_MS = 8000;
const MAX_TEXT_LENGTH = 3000;

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function scrapeWebsite(rawUrl: string): Promise<string | null> {
  const url = normalizeUrl(rawUrl);
  if (!url) return null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), SCRAPE_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; GrowthOS-Bot/1.0; +https://growthos.in)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      logger.warn({ url, status: response.status }, "Website scrape returned non-OK status");
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      logger.warn({ url, contentType }, "Website scrape returned non-HTML content");
      return null;
    }

    const html = await response.text();
    const text = extractText(html);
    const truncated = text.length > MAX_TEXT_LENGTH
      ? text.slice(0, MAX_TEXT_LENGTH) + "..."
      : text;

    logger.info({ url, chars: truncated.length }, "Website scraped successfully");
    return truncated;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ url, err: message }, "Website scrape failed — proceeding without it");
    return null;
  }
}
