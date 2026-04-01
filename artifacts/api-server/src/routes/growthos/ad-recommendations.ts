import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetAdRecommendationsBody } from "@workspace/api-zod";
import { callGemini } from "../../lib/gemini";
import { FALLBACK_ADS } from "../../lib/fallbackData";

const router: IRouter = Router();

router.post("/ad-recommendations", async (req, res) => {
  const parsed = GetAdRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.id, parsed.data.businessProfileId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Business profile not found" });
    return;
  }

  const prompt = `You are a performance marketing director with 15+ years of managing ₹10Cr+ annual ad budgets for Indian brands across Meta, Google, and emerging platforms. You have consistently delivered 3–8x ROAS for Indian SMBs in competitive categories. You think in funnels, cohorts, and lifetime value — not just clicks.

TASK: Build 3 data-backed, immediately actionable paid media campaign recommendations for this business. Each campaign must serve a distinct funnel stage and be specific enough to brief a media buyer.

BUSINESS INTEL:
- Brand: ${profile.businessName} (${profile.businessType})
- Location: ${profile.location}
- Core Differentiation: ${profile.usp}
- Audience Psychographic: ${profile.targetPersona}
- Total Monthly Ad Budget: ${profile.monthlyBudget}
- Primary Business Objective: ${profile.primaryGoal}
- Recommended Platforms: ${profile.recommendedPlatforms.join(", ")}
- Brand Hashtags (for audience affinity targeting): ${profile.topHashtags.join(", ")}

CAMPAIGN FRAMEWORK:
Build campaigns across 3 funnel stages:
1. TOP OF FUNNEL (Awareness/Discovery): Maximum reach, lowest CPM, broad but interest-targeted. Goal: Get the brand in front of new audiences who fit the persona but don't know the brand yet.
2. MIDDLE OF FUNNEL (Consideration/Engagement): Retarget video viewers, website visitors, social engagers. Goal: Move warm audiences from awareness to intent.
3. BOTTOM OF FUNNEL (Conversion/Revenue): Tight retargeting of high-intent signals (add-to-cart, product page visits, DM inquiries). Goal: Close the sale efficiently.

BUDGET ALLOCATION PRINCIPLE: 40% TOFU / 35% MOFU / 25% BOFU (adjust if primaryGoal is brand awareness: shift 20% more to TOFU).

For each campaign, provide:
- Specific audience targeting parameters (demographics, interests, behaviours available on Indian Meta/Google)
- Exact creative format recommendation with rationale
- Expected performance benchmarks (CPM, CTR, CPC, ROAS ranges based on Indian market benchmarks)
- Bid strategy (lowest cost / target CPA / manual CPC) and why

IMPORTANT: This is SIMULATED planning data for demonstration. No real ads will be placed.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "campaigns": [
    {
      "name": "campaign name with funnel stage",
      "platform": "Meta (Instagram + Facebook)|Google Ads|YouTube",
      "audienceTargeting": "specific targeting: age, gender, tier cities, interests, behaviours, lookalike seeds",
      "budgetSplit": "₹X,XXX/month (XX% of total — rationale)",
      "expectedReach": "XX,XXX–XX,XXX unique accounts/month",
      "adFormat": "specific format: e.g. 15-sec Reel Ad, Responsive Search Ad, Performance Max",
      "insight": "one sharp strategic insight about why this channel-audience combination wins for this specific business right now",
      "whyItWorks": "4–5 sentence strategic rationale covering: audience match quality, platform algorithm advantage, creative format fit, expected conversion pathway, and one risk/mitigation"
    }
  ],
  "totalBudget": "${profile.monthlyBudget}"
}
Create exactly 3 campaigns. Make the targeting hyper-specific to ${profile.businessName}'s audience in ${profile.location} and the goal of ${profile.primaryGoal}.`;

  const result = await callGemini(prompt, FALLBACK_ADS);
  res.json(result);
});

export default router;
