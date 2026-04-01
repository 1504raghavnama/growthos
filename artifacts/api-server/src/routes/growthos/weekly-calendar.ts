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

  const prompt = `You are a social media strategist for Indian businesses. Create a 7-day content calendar.
Business Profile: ${JSON.stringify({
    businessName: profile.businessName,
    businessType: profile.businessType,
    targetPersona: profile.targetPersona,
    usp: profile.usp,
    contentPillars: profile.contentPillars,
    brandTone: profile.brandTone,
    topHashtags: profile.topHashtags,
  })}
Today's Date: ${new Date().toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", weekday: "long", year: "numeric", month: "long", day: "numeric" })}
Next 7 days: ${getNext7Days()}
Upcoming festivals in this period: ${JSON.stringify(upcomingFestivals)}

Return ONLY valid JSON (no markdown, no code blocks):
{
  "week": "week range string",
  "days": [
    {
      "date": "Weekday, Month Day, Year",
      "dayNumber": 1,
      "theme": "content theme",
      "postType": "Reel|Carousel|Static|Story",
      "caption": "full caption text with emojis and hashtags",
      "postingTime": "9:00 AM",
      "festival": null or "festival name",
      "contentIdea": "detailed content idea for creating the post"
    }
  ]
}
Make exactly 7 days. Use the business's brand tone and content pillars. Include festival references where applicable.`;

  const result = await callGemini(prompt, FALLBACK_CALENDAR);
  res.json(result);
});

export default router;
