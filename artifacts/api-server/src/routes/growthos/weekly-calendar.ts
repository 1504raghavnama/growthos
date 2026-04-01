import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateWeeklyCalendarBody } from "@workspace/api-zod";
import { callGemini } from "../../lib/gemini";
import { FALLBACK_CALENDAR } from "../../lib/fallbackData";
import { getNext7Days, getUpcomingFestivals } from "../../lib/festivals";

const router: IRouter = Router();

router.post("/weekly-calendar", async (req, res) => {
  const parsed = GenerateWeeklyCalendarBody.safeParse(req.body);
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

  const upcomingFestivals = getUpcomingFestivals(7);

  const prompt = `You are a senior content strategist and editorial director with 15+ years building award-winning social media programmes for Indian brands across FMCG, D2C, retail, and services. You have managed editorial calendars for brands with 1M+ followers and understand what drives organic reach, saves, shares, and sales on every major Indian social platform.

TASK: Build a precision-engineered 7-day content calendar for this brand. Every single day must have a distinct strategic purpose — no filler days, no generic content.

BRAND BRIEF:
- Brand: ${profile.businessName} (${profile.businessType})
- Location: ${profile.location}
- Core USP: ${profile.usp}
- Target Audience Persona: ${profile.targetPersona}
- Brand Voice: ${profile.brandTone}
- Content Pillars: ${profile.contentPillars.join(" | ")}
- Power Hashtags: ${profile.topHashtags.join(", ")}
- Primary Business Goal: ${profile.primaryGoal}

STRATEGIC CONTEXT:
Today's Date (IST): ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Next 7 calendar days: ${getNext7Days()}
Upcoming festivals in this window: ${JSON.stringify(upcomingFestivals)}

CONTENT MIX RULES (non-negotiable):
- Follow the 3-2-2 framework: 3 value/educational posts, 2 entertainment/storytelling posts, 2 conversion/promotional posts
- Festival days MUST leverage the cultural moment with a brand-relevant tie-in — never generic "Happy XYZ" posts
- Vary post formats to beat algorithm fatigue: Reels for discovery, Carousels for saves & shares, Stories for community, Static for brand moments
- Never schedule two promotional posts back-to-back

POST TYPE STRATEGY:
- Reel: Hook in first 3 seconds. Trending audio where possible. Script the visual concept explicitly.
- Carousel: Slide 1 = thumb-stopping hook, Slides 2–6 = value delivery, Last slide = CTA. Title each slide.
- Static: Bold visual hierarchy. One core message. High memorability.
- Story: Interactive (poll, quiz, question sticker). 24-hour urgency. Behind-the-scenes or community-building.

CAPTION QUALITY STANDARDS:
- Every caption must open with a hook that earns the next line
- Include relevant emojis purposefully (not decoratively)
- End with a clear, specific CTA matched to the post's goal
- Hashtag strategy: 3 brand hashtags + 4 niche hashtags + 3 trending Indian tags

Return ONLY valid JSON (no markdown, no code blocks):
{
  "week": "week range string e.g. April 1–7, 2026",
  "days": [
    {
      "date": "YYYY-MM-DD",
      "dayNumber": 1,
      "theme": "specific compelling content theme (not generic e.g. 'The hidden cost of X most Indians ignore')",
      "postType": "Reel|Carousel|Static|Story",
      "caption": "complete publication-ready caption with emojis and hashtags — hook, body, CTA",
      "postingTime": "HH:MM AM/PM IST",
      "festival": null,
      "contentIdea": "director-level brief: exact visual concept, scene description, on-screen text suggestions, and the strategic reason this content will perform"
    }
  ]
}
Make exactly 7 days. Each day's contentIdea should be detailed enough that a content creator can execute without briefing.`;

  const result = await callGemini(prompt, FALLBACK_CALENDAR);
  res.json(result);
});

export default router;
