import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetPerformanceMetricsBody } from "@workspace/api-zod";
import { callGemini } from "../../lib/gemini";
import { FALLBACK_PERFORMANCE } from "../../lib/fallbackData";

const router: IRouter = Router();

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

router.post("/performance-metrics", async (req, res) => {
  const parsed = GetPerformanceMetricsBody.safeParse(req.body);
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

  const seed = profile.id
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rand = seededRandom(seed);

  const ctr = +(1.8 + rand() * 1.2).toFixed(1);
  const cpc = +(6 + rand() * 6).toFixed(2);
  const roas = +(2.5 + rand() * 2).toFixed(1);
  const conversionRate = +(1.2 + rand() * 1.5).toFixed(1);

  const baseReach = 1000 + Math.floor(rand() * 1000);
  const weeklyReach = [0, 1, 2, 3, 4, 5, 6].map((i) =>
    Math.round(baseReach * (0.8 + rand() * 0.7) * (1 + i * 0.1))
  );

  const ig = 50 + Math.floor(rand() * 25);
  const fb = 15 + Math.floor(rand() * 15);
  const li = 100 - ig - fb;
  const platformEngagement = { instagram: ig, facebook: fb, linkedin: li };

  const mockMetrics = {
    ctr,
    cpc,
    roas,
    conversionRate,
    weeklyReach,
    platformEngagement,
  };

  const prompt = `You are a digital marketing analyst. Based on these simulated performance metrics for an Indian SMB, provide an actionable AI insight in 3-4 sentences.
Business: ${profile.businessName} (${profile.businessType}), Goal: ${profile.primaryGoal}
Metrics: CTR ${ctr}%, CPC ₹${cpc}, ROAS ${roas}x, Conversion Rate ${conversionRate}%
Weekly Reach Trend: ${weeklyReach.join(", ")} (growing/declining pattern)
Platform Split: Instagram ${ig}%, Facebook ${fb}%, LinkedIn ${li}%

Return ONLY a plain text insight (no JSON, no markdown). Write in a helpful, data-driven tone. Include specific numbers. End with 1 actionable recommendation.`;

  let aiInsight = FALLBACK_PERFORMANCE.aiInsight;
  try {
    const result = await callGemini(prompt, { text: aiInsight }) as { text?: string };
    if (typeof result === "string") aiInsight = result;
    else if (result?.text) aiInsight = result.text;
  } catch {
    aiInsight = FALLBACK_PERFORMANCE.aiInsight;
  }

  res.json({
    ...mockMetrics,
    aiInsight,
    topPost: {
      caption:
        profile.topHashtags.length > 0
          ? `Our latest collection is here! Don't miss out on exclusive designs crafted just for you. Shop now and discover the difference. ${profile.topHashtags.slice(0, 3).join(" ")}`
          : FALLBACK_PERFORMANCE.topPost.caption,
      platform:
        profile.recommendedPlatforms[0] ||
        FALLBACK_PERFORMANCE.topPost.platform,
      reach: weeklyReach[weeklyReach.length - 1],
      engagement: +(ctr * 1.5).toFixed(1),
    },
  });
});

export default router;
