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

  const prompt = `You are a digital advertising expert for Indian SMBs. Create 3 ad campaign recommendations.
Business: ${profile.businessName} (${profile.businessType})
Location: ${profile.location}
Target Audience: ${profile.targetPersona}
Monthly Budget: ${profile.monthlyBudget}
Primary Goal: ${profile.primaryGoal}
USP: ${profile.usp}
Recommended Platforms: ${profile.recommendedPlatforms.join(", ")}

IMPORTANT: This is SIMULATED data for demonstration purposes only. No real ads will be placed.

Return ONLY valid JSON (no markdown, no code blocks):
{
  "campaigns": [
    {
      "name": "campaign name",
      "platform": "Instagram|Facebook|Google",
      "audienceTargeting": "detailed audience targeting description relevant for India",
      "budgetSplit": "₹X,XXX/month (XX% of total budget)",
      "expectedReach": "XX,XXX - XX,XXX people/month",
      "adFormat": "ad format type",
      "insight": "1-2 sentence insight about why this channel works for this business",
      "whyItWorks": "3-4 sentence detailed explanation of why this campaign strategy works for this specific business"
    }
  ],
  "totalBudget": "${profile.monthlyBudget}"
}
Create exactly 3 campaigns across different platforms. Make recommendations specific to ${profile.businessName}'s goal of ${profile.primaryGoal} with a budget of ${profile.monthlyBudget}.`;

  const result = await callGemini(prompt, FALLBACK_ADS);
  res.json(result);
});

export default router;
