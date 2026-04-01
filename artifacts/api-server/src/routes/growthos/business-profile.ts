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

  let websiteContent: string | null = null;
  if (formData.websiteUrl) {
    websiteContent = await scrapeWebsite(formData.websiteUrl);
  }

  const websiteSection = websiteContent
    ? `\n\nLIVE WEBSITE INTELLIGENCE (scraped from ${formData.websiteUrl}):\n"""\n${websiteContent}\n"""\n\nUse this real website copy, product language, and brand voice as primary source material — it reveals how the brand actually speaks and what it genuinely offers.`
    : "";

  const prompt = `You are a chief marketing strategist and brand consultant with 15+ years advising Indian businesses — from Tier 3 bootstrapped startups to Series B funded D2C brands. You've built positioning frameworks that have driven 10x growth, repositioned commodities as premium brands, and identified white spaces that competitors missed entirely. Your analysis is incisive, commercially grounded, and immediately actionable.

TASK: Conduct a deep strategic analysis of this Indian business and return a precise marketing intelligence profile. Every field must be specific, differentiated, and actionable — not generic category-level observations.

BUSINESS INPUTS:
${JSON.stringify({ ...formData, websiteUrl: undefined }, null, 2)}${websiteSection}

ANALYSIS FRAMEWORK:

SUMMARY: Write 2–3 sentences that capture the brand's core identity, commercial model, and market moment. Should read like the opening of a compelling investor pitch — specific, confident, with a point of view.

TARGET PERSONA: Go beyond demographics. Describe the psychographic: what does this person believe, fear, aspire to, and what does owning/using this brand say about them? Include specific Indian cultural references where relevant (city tier, life stage, social media behaviour, purchase triggers).

USP: Identify the single most defensible differentiator — the thing that would be hardest for a competitor to replicate. Frame it as a customer benefit, not a feature. If the brand has no clear differentiator yet, identify the territory they SHOULD own based on market gaps.

CONTENT PILLARS: Define 4 distinct content themes that together cover the full customer journey (awareness → consideration → loyalty → advocacy). Each pillar should have a clear editorial purpose and measurable engagement goal.

BRAND TONE: Choose one: professional/friendly/youthful/luxury/casual/bold/empathetic — and add one clarifying adjective (e.g. "youthful and aspirational", "professional but warm").

COMPETITOR INSIGHT: Name 2–3 actual Indian competitors in this category. Identify one gap in their content/positioning that this brand can exploit.

TOP HASHTAGS: 5 hashtags in this mix: 1 branded, 2 niche-specific (high engagement, lower competition), 2 broad-reach Indian category tags. No dead hashtags with zero community.

BEST POSTING TIMES: Based on the target persona's daily routine in India (IST). Be specific: "8:30 AM" not "morning".

RECOMMENDED PLATFORMS: Max 3 platforms ranked by ROI potential for this specific brand's goal of ${formData.primaryGoal}. Exclude platforms where this audience doesn't have high presence.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "businessName": "string",
  "summary": "2-3 sentences — specific, confident brand narrative",
  "targetPersona": "detailed psychographic + demographic portrait with Indian cultural context",
  "usp": "single most defensible differentiator framed as customer benefit",
  "contentPillars": ["pillar1", "pillar2", "pillar3", "pillar4"],
  "brandTone": "one word tone descriptor",
  "competitorInsight": "names 2-3 real Indian competitors + one exploitable gap",
  "topHashtags": ["#brand", "#niche1", "#niche2", "#broad1", "#broad2"],
  "bestPostingTimes": ["8:30 AM IST", "1:00 PM IST", "8:30 PM IST"],
  "recommendedPlatforms": ["Platform1", "Platform2", "Platform3"]
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
