import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  AnalyzeBusinessProfileBody,
  GetBusinessProfileParams,
} from "@workspace/api-zod";
import { callGemini } from "../../lib/gemini";
import { FALLBACK_BUSINESS_PROFILE } from "../../lib/fallbackData";
import { scrapeWebsite } from "../../lib/scraper";

const router: IRouter = Router();

router.post("/business-profile", async (req, res) => {
  const parsed = AnalyzeBusinessProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }
  const formData = parsed.data;

  // Scrape website content if URL provided
  let websiteContent: string | null = null;
  if (formData.websiteUrl) {
    websiteContent = await scrapeWebsite(formData.websiteUrl);
  }

  const websiteSection = websiteContent
    ? `\n\nWebsite content scraped from ${formData.websiteUrl}:\n"""\n${websiteContent}\n"""\n\nUse this real website content to enrich your analysis.`
    : "";

  const prompt = `You are a digital marketing expert specializing in Indian SMBs. Analyze this Indian business and return ONLY a valid JSON object (no markdown, no code blocks):
Business details: ${JSON.stringify({ ...formData, websiteUrl: undefined })}${websiteSection}

Return this exact JSON structure:
{
  "businessName": "string",
  "summary": "2-3 sentence business description",
  "targetPersona": "detailed audience description",
  "usp": "unique selling proposition",
  "contentPillars": ["pillar1", "pillar2", "pillar3", "pillar4"],
  "brandTone": "professional/friendly/youthful/luxury/casual",
  "competitorInsight": "brief competitor landscape in India",
  "topHashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
  "bestPostingTimes": ["9:00 AM", "1:00 PM", "7:00 PM"],
  "recommendedPlatforms": ["Instagram", "Facebook", "LinkedIn"]
}`;

  const aiResult = (await callGemini(prompt, {
    ...FALLBACK_BUSINESS_PROFILE,
    businessName: formData.businessName,
  })) as typeof FALLBACK_BUSINESS_PROFILE;

  const [saved] = await db
    .insert(businessProfilesTable)
    .values({
      businessName: aiResult.businessName || formData.businessName,
      businessType: formData.businessType,
      location: formData.location,
      monthlyBudget: formData.monthlyBudget,
      primaryGoal: formData.primaryGoal,
      summary: aiResult.summary,
      targetPersona: aiResult.targetPersona,
      usp: aiResult.usp,
      brandTone: aiResult.brandTone,
      competitorInsight: aiResult.competitorInsight,
      contentPillars: aiResult.contentPillars,
      topHashtags: aiResult.topHashtags,
      bestPostingTimes: aiResult.bestPostingTimes,
      recommendedPlatforms: aiResult.recommendedPlatforms,
      rawInput: formData as Record<string, string>,
    })
    .returning();

  res.json({
    id: saved.id,
    businessName: saved.businessName,
    summary: saved.summary,
    targetPersona: saved.targetPersona,
    usp: saved.usp,
    contentPillars: saved.contentPillars,
    brandTone: saved.brandTone,
    competitorInsight: saved.competitorInsight,
    topHashtags: saved.topHashtags,
    bestPostingTimes: saved.bestPostingTimes,
    recommendedPlatforms: saved.recommendedPlatforms,
    monthlyBudget: saved.monthlyBudget,
    primaryGoal: saved.primaryGoal,
    businessType: saved.businessType,
    location: saved.location,
  });
});

router.get("/business-profile/:id", async (req, res) => {
  const parsed = GetBusinessProfileParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }

  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.id, parsed.data.id))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Business profile not found" });
    return;
  }

  res.json({
    id: profile.id,
    businessName: profile.businessName,
    summary: profile.summary,
    targetPersona: profile.targetPersona,
    usp: profile.usp,
    contentPillars: profile.contentPillars,
    brandTone: profile.brandTone,
    competitorInsight: profile.competitorInsight,
    topHashtags: profile.topHashtags,
    bestPostingTimes: profile.bestPostingTimes,
    recommendedPlatforms: profile.recommendedPlatforms,
    monthlyBudget: profile.monthlyBudget,
    primaryGoal: profile.primaryGoal,
    businessType: profile.businessType,
    location: profile.location,
  });
});

export default router;
