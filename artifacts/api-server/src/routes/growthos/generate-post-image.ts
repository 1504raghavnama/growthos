import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GeneratePostImageBody } from "@workspace/api-zod";
import { logger } from "../../lib/logger";

const router: IRouter = Router();

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

  const platformAspect: Record<string, string> = {
    Instagram: "square (1:1) or portrait (4:5) format, vibrant and scroll-stopping",
    LinkedIn: "landscape (1.91:1) format, clean professional aesthetic",
    Facebook: "landscape (1.91:1) or square, warm community-oriented visual",
    Twitter: "landscape (16:9) or square, bold and punchy",
  };

  const toneStyle: Record<string, string> = {
    professional: "clean minimal design, muted sophisticated colour palette, plenty of white space, editorial photography aesthetic",
    friendly: "warm inviting colours, natural lighting, approachable everyday scenes, candid-style photography",
    youthful: "bold vibrant colours, energetic compositions, modern Gen-Z aesthetic, dynamic angles",
    luxury: "dark rich tones or pure whites, premium textures, dramatic lighting, high-fashion editorial style",
    casual: "relaxed lifestyle photography, natural settings, authentic unposed moments, earthy warm tones",
    bold: "high contrast, strong graphic elements, punchy colour blocks, confident compositions",
    empathetic: "soft warm lighting, genuine human moments, community and connection themes",
  };

  const postTypeGuide: Record<string, string> = {
    Reel: "eye-catching thumbnail/cover frame, dynamic subject placement, bright foreground",
    Carousel: "clean first slide composition, strong visual hierarchy, space for text overlays",
    Static: "single powerful hero image, uncluttered composition, strong focal point",
    Story: "vertical full-bleed composition, 9:16 format, central subject placement safe from UI overlays",
  };

  const imagePrompt = `Professional social media marketing photograph for an Indian ${profile.businessType} brand called "${profile.businessName}".

CONTENT BRIEF: ${theme}
CAPTION CONTEXT: ${captionText.slice(0, 200)}

VISUAL DIRECTION:
- Platform: ${platform} — ${platformAspect[platform] || platformAspect.Instagram}
- Post Format: ${postType || "Static"} — ${postTypeGuide[postType || "Static"] || postTypeGuide.Static}
- Brand Aesthetic: ${toneStyle[profile.brandTone] || toneStyle.friendly}
- Location feel: ${profile.location}, India — authentic Indian context where appropriate

PHOTOGRAPHY REQUIREMENTS:
- Photorealistic, commercial-grade quality
- No text, watermarks, logos, or typography of any kind — pure visual only
- Lighting: natural, professional, flattering
- Composition: rule of thirds, clear focal point, intentional negative space
- Colour grading: cohesive, platform-optimised
- Model diversity: if people shown, reflect authentic Indian demographics
- Avoid: stock photo clichés, overly staged setups, Western-centric aesthetics

The image must immediately communicate: ${theme} and make a viewer stop scrolling.`;

  try {
    const { generateImage } = await import("@workspace/integrations-gemini-ai/image");
    const { b64_json, mimeType } = await generateImage(imagePrompt);
    const imageUrl = `data:${mimeType};base64,${b64_json}`;
    res.json({ imageUrl, mimeType });
  } catch (err) {
    logger.error({ err }, "Image generation failed");
    res.status(500).json({ error: "Image generation failed. Please try again." });
  }
});

export default router;
