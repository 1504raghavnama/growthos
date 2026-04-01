import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GeneratePostImageBody } from "@workspace/api-zod";
import { logger } from "../../lib/logger";
import { callGemini } from "../../lib/gemini";

const router: IRouter = Router();

async function buildUnsplashQuery(
  businessType: string,
  businessName: string,
  theme: string,
  platform: string,
  postType: string,
  captionText: string,
  location: string
): Promise<string> {
  const prompt = `You are a visual search expert. Generate the single best Unsplash search query (2-5 keywords only, no quotes) to find a professional marketing photo for:

Business: ${businessName} (${businessType})
Theme: ${theme}
Platform: ${platform} (${postType} format)
Caption context: ${captionText.slice(0, 150)}
Location: ${location}, India

Rules:
- 2-5 keywords maximum, space-separated
- No quotes, no punctuation
- Focus on the visual subject/scene, not the business name
- Prefer universally beautiful, commercial-grade photography keywords
- Include one mood/aesthetic keyword (e.g. "vibrant", "minimal", "cozy", "bold")
- If food/beverage business: include the food type
- If fashion/retail: include clothing type and aesthetic
- If services: include the human activity or emotion

Return ONLY the search query, nothing else.`;

  try {
    const result = await callGemini(prompt, `${businessType} ${theme} professional`, { plainText: true });
    return String(result).trim().slice(0, 80);
  } catch {
    return `${businessType} ${theme} professional India`;
  }
}

router.post("/generate-post-image", async (req, res) => {
  const parsed = GeneratePostImageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { businessProfileId, captionText, platform, theme, postType } = parsed.data;

  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.id, businessProfileId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Business profile not found" });
    return;
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    res.status(500).json({ error: "Unsplash API key not configured" });
    return;
  }

  try {
    const searchQuery = await buildUnsplashQuery(
      profile.businessType,
      profile.businessName,
      theme,
      platform,
      postType || "Static",
      captionText,
      profile.location
    );

    const orientation = platform === "Instagram" && postType === "Story" ? "portrait"
      : platform === "LinkedIn" || platform === "Twitter" ? "landscape"
      : "squarish";

    const unsplashUrl = new URL("https://api.unsplash.com/search/photos");
    unsplashUrl.searchParams.set("query", searchQuery);
    unsplashUrl.searchParams.set("per_page", "9");
    unsplashUrl.searchParams.set("orientation", orientation);
    unsplashUrl.searchParams.set("content_filter", "high");

    const response = await fetch(unsplashUrl.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error({ status: response.status, text }, "Unsplash API error");
      res.status(502).json({ error: "Could not fetch photos. Please try again." });
      return;
    }

    const data = await response.json() as {
      results: Array<{
        urls: { regular: string; small: string };
        user: { name: string; links: { html: string } };
        links: { html: string; download_location: string };
      }>;
    };

    if (!data.results || data.results.length === 0) {
      const fallbackUrl = new URL("https://api.unsplash.com/search/photos");
      fallbackUrl.searchParams.set("query", `${profile.businessType} professional`);
      fallbackUrl.searchParams.set("per_page", "9");
      fallbackUrl.searchParams.set("content_filter", "high");

      const fallbackResponse = await fetch(fallbackUrl.toString(), {
        headers: { Authorization: `Client-ID ${accessKey}`, "Accept-Version": "v1" },
      });
      const fallbackData = await fallbackResponse.json() as typeof data;
      data.results = fallbackData.results || [];
    }

    const photos = data.results.slice(0, 9).map((photo) => ({
      url: photo.urls.regular,
      thumbUrl: photo.urls.small,
      photographer: photo.user.name,
      photographerProfile: photo.user.links.html,
      unsplashLink: photo.links.html,
      downloadLocation: photo.links.download_location,
    }));

    res.json({ photos, searchQuery });
  } catch (err) {
    logger.error({ err }, "Image search failed");
    res.status(500).json({ error: "Image search failed. Please try again." });
  }
});

export default router;
