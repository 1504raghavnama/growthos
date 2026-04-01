import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetFestivalTrendsBody } from "@workspace/api-zod";
import { callGemini } from "../../lib/gemini";
import {
  FALLBACK_FESTIVALS,
} from "../../lib/fallbackData";
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

  const prompt = `You are a digital marketing expert for Indian businesses. Create campaign ideas for upcoming Indian festivals.
Business: ${profile.businessName} (${profile.businessType}), Location: ${profile.location}
Products/Services context: ${profile.usp}
Target Audience: ${profile.targetPersona}
Brand Tone: ${profile.brandTone}
Top Hashtags: ${profile.topHashtags.join(", ")}

Upcoming festivals (next 30 days): ${JSON.stringify(upcoming)}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "festivals": [
    {
      "name": "festival name",
      "date": "YYYY-MM-DD",
      "type": "Hindu/Muslim/Christian/Sikh/National/Global",
      "urgency": "Today|This Week|This Month",
      "campaignIdea": "specific campaign idea for THIS business (2-3 sentences)",
      "suggestedHashtags": ["#tag1", "#tag2", "#tag3", "#tag4"],
      "caption": "ready-to-post caption with emojis for this festival and business"
    }
  ]
}
Create a campaign for EACH of the ${upcoming.length} upcoming festivals. Make campaigns specific to ${profile.businessName}'s products and target audience.`;

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
