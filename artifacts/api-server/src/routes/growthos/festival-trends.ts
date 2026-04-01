import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetFestivalTrendsBody } from "@workspace/api-zod";
import { callGemini } from "../../lib/gemini";
import { FALLBACK_FESTIVALS } from "../../lib/fallbackData";
import { getUpcomingFestivals, getFestivalUrgency } from "../../lib/festivals";

const router: IRouter = Router();

router.post("/festival-trends", async (req, res) => {
  const parsed = GetFestivalTrendsBody.safeParse(req.body);
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

  const upcoming = getUpcomingFestivals(30);

  if (upcoming.length === 0) {
    res.json(FALLBACK_FESTIVALS);
    return;
  }

  const prompt = `You are a cultural marketing strategist with 15+ years activating Indian festival campaigns for brands across FMCG, fashion, food, fintech, and lifestyle. You have architected viral festival moments — the kind that get reshared, screenshotted, and talked about at family dinners. You understand that the difference between a festival post that gets ignored and one that gets 50K shares is the depth of cultural resonance and the commercial hook's subtlety.

TASK: For each upcoming Indian festival, develop a campaign idea so specific and ownable that only ${profile.businessName} could run it. Generic "Wishing you joy this Diwali" content is disqualified.

BRAND CONTEXT:
- Brand: ${profile.businessName} (${profile.businessType})
- Location: ${profile.location}
- Brand Differentiation: ${profile.usp}
- Audience: ${profile.targetPersona}
- Brand Voice: ${profile.brandTone}
- Key Hashtags: ${profile.topHashtags.join(", ")}

FESTIVAL ACTIVATION PRINCIPLES:
1. CULTURAL TRUTH FIRST: Every campaign must be anchored in a genuine cultural insight about the festival — what it means emotionally to the audience, not just what it looks like
2. BRAND RELEVANCE: The link between festival and brand must feel earned, not forced. Find the natural tension/celebration point between what the brand does and what the festival represents
3. MECHANICS THAT TRAVEL: Give each campaign a shareable mechanic — UGC challenge, community pledge, limited edition concept, social experiment, or story series
4. COMMERCIAL INTENT WITH CULTURAL RESPECT: The offer or CTA must feel like a gift, not a transaction
5. PLATFORM FIT: Specify which platform the campaign activates on first and why

Upcoming festivals (next 30 days): ${JSON.stringify(upcoming)}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "festivals": [
    {
      "name": "festival name",
      "date": "YYYY-MM-DD",
      "type": "Hindu/Muslim/Christian/Sikh/National/Global",
      "urgency": "Today|This Week|This Month",
      "campaignIdea": "3–4 sentences: the cultural insight + the brand-ownable angle + the campaign mechanic + the platform activation strategy. This should be distinctive enough to brief a creative team.",
      "suggestedHashtags": ["#branded", "#festivalspecific", "#niche", "#trending"],
      "caption": "publication-ready caption: festival sentiment + brand tie-in + specific CTA. Should feel warm and authentic, not promotional. Include relevant emojis."
    }
  ]
}
Create a campaign for EACH of the ${upcoming.length} upcoming festivals. No two campaigns should use the same mechanic.`;

  const result = (await callGemini(prompt, FALLBACK_FESTIVALS)) as {
    festivals: Array<{
      name: string;
      date: string;
      type: string;
      urgency: string;
      campaignIdea: string;
      suggestedHashtags: string[];
      caption: string;
    }>;
  };

  if (result?.festivals) {
    result.festivals = result.festivals.map((f) => ({
      ...f,
      urgency: getFestivalUrgency(f.date),
    }));
  }

  res.json(result);
});

export default router;
