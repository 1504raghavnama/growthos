import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateCaptionsBody } from "@workspace/api-zod";
import { callGemini } from "../../lib/gemini";
import { FALLBACK_CAPTIONS } from "../../lib/fallbackData";

const router: IRouter = Router();

router.post("/generate-captions", async (req, res) => {
  const parsed = GenerateCaptionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { businessProfileId, postDescription, platform, tone } = parsed.data;

  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.id, businessProfileId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Business profile not found" });
    return;
  }

  const prompt = `You are a social media copywriter specializing in Indian businesses. Generate 3 distinct caption variations.
Business: ${profile.businessName} (${profile.businessType}), Brand Tone: ${profile.brandTone}, Location: ${profile.location}
Post Description: ${postDescription}
Platform: ${platform}
Tone Style: ${tone}
Business's Top Hashtags to incorporate: ${profile.topHashtags.join(", ")}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "captions": [
    {
      "id": 1,
      "style": "Direct",
      "caption": "full caption text with emojis and hashtags",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "cta": "clear call to action text",
      "charCount": 280
    },
    {
      "id": 2,
      "style": "Storytelling",
      "caption": "full caption text with emojis and hashtags",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "cta": "clear call to action text",
      "charCount": 300
    },
    {
      "id": 3,
      "style": "Question-Hook",
      "caption": "full caption text with emojis and hashtags",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "cta": "clear call to action text",
      "charCount": 260
    }
  ]
}
Make captions relevant for ${platform} and ${tone} style. Include emojis appropriate for Indian SMBs.`;

  const result = await callGemini(prompt, FALLBACK_CAPTIONS);
  res.json(result);
});

export default router;
