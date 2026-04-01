import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { businessProfilesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GenerateCaptionsBody } from "@workspace/api-zod";
import { callGemini } from "../../lib/gemini";
import { FALLBACK_CAPTIONS } from "../../lib/fallbackData";

const router: IRouter = Router();

router.post("/generate-captions", async (req, res) => {
  const parsed = GenerateCaptionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { businessProfileId, postDescription, platform, tone } = parsed.data;

  const [profile] = await db
    .select()
    .from(businessProfilesTable)
    .where(eq(businessProfilesTable.id, businessProfileId))
    .limit(1);

  if (!profile) {
    res.status(404).json({ error: "Business profile not found" });
    return;
  }

  const platformRules: Record<string, string> = {
    Instagram: "Max 2,200 characters. Lead with a scroll-stopping hook in the first line (the 'above the fold' text before 'more'). Use line breaks for scannability. Close with a single strong CTA. 5–10 hashtags max — mix niche and broad.",
    LinkedIn: "Max 3,000 characters. Open with a bold insight or counterintuitive statement. Use short paragraphs (2–3 lines max). Avoid hashtag stuffing — 3–5 relevant hashtags only. Professional but human voice. End with a thought-provoking question or CTA.",
    Facebook: "Max 63,206 characters but optimal 40–80 words for feed. Lead with emotion or community belonging. Encourage reactions/shares by creating relatability. 2–3 hashtags max.",
    Twitter: "Max 280 characters. Punchy, no-fluff. One idea, one tweet. Optional: thread opener. 1–2 hashtags only.",
  };

  const toneGuide: Record<string, string> = {
    Promotional: "Urgency-driven. Use scarcity, time-bound offers, and loss-aversion psychology. Power words: exclusive, limited, only, today, unlock.",
    Educational: "Authority-building. Lead with a surprising data point or counterintuitive insight. Use numbered lists. Position the brand as the expert.",
    Inspirational: "Aspirational narrative. Tie the product/service to identity transformation. 'You' language. Story arc: problem → journey → breakthrough.",
    Festive: "Culturally warm and celebratory. Reference the festival's core emotion (joy, reflection, family, new beginnings). Tie the brand to the celebration without being transactional.",
    Casual: "Conversational and witty. Speak like a friend texting, not a brand broadcasting. Slang/colloquialisms where authentic. Self-aware humour where appropriate.",
  };

  const prompt = `You are a world-class social media copywriter with 15+ years of experience crafting high-converting content for Indian brands — from early-stage startups to Fortune 500s. Your work has driven measurable engagement lifts of 3–10x across categories. You understand Indian consumer psychology, festival cycles, regional nuances, and platform algorithms intimately.

TASK: Write 3 distinct, publication-ready caption variations for the following brief. Each must be immediately usable — no placeholders, no generic filler.

BUSINESS CONTEXT:
- Brand: ${profile.businessName} (${profile.businessType})
- Location: ${profile.location}
- Brand Positioning: ${profile.usp}
- Target Audience: ${profile.targetPersona}
- Brand Voice: ${profile.brandTone}
- Established Hashtags: ${profile.topHashtags.join(", ")}

CAMPAIGN BRIEF:
- Post Topic: ${postDescription}
- Platform: ${platform}
- Tone/Style: ${tone}

PLATFORM RULES FOR ${platform.toUpperCase()}:
${platformRules[platform] || platformRules.Instagram}

TONE EXECUTION GUIDE FOR ${tone.toUpperCase()}:
${toneGuide[tone] || toneGuide.Promotional}

CAPTION REQUIREMENTS:
1. Variation 1 — "Power Hook": Open with a bold, scroll-stopping first line that creates pattern interruption. Use direct address, a provocative question, or a surprising statement. Conversion-optimised CTA.
2. Variation 2 — "Story Arc": Micro-narrative structure (before → after, or problem → solution). Build emotional resonance. End with an invitation, not a command.
3. Variation 3 — "Social Proof / Insight-Led": Lead with a credibility signal (stat, customer truth, category insight). Authoritative but approachable. CTA tied to the insight.

QUALITY STANDARDS (non-negotiable):
- Zero generic phrases: no "We are excited to announce", "Check it out", "Don't miss out", "We are passionate about"
- Every caption must feel tailor-made for ${profile.businessName}, not copy-pasted from a template
- Emojis must be purposeful — max 3–5, placed to enhance rhythm, not decorate
- Hashtags must include a mix of branded (${profile.topHashtags.slice(0,2).join(", ")}), niche, and trending Indian tags
- CTAs must be specific and action-oriented: "DM us 'STYLE' to get a free lookbook" beats "Click the link in bio"

Return ONLY valid JSON (no markdown, no code blocks):
{
  "captions": [
    {
      "id": 1,
      "style": "Power Hook",
      "caption": "full publication-ready caption text",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "cta": "specific call-to-action text",
      "charCount": 280
    },
    {
      "id": 2,
      "style": "Story Arc",
      "caption": "full publication-ready caption text",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "cta": "specific call-to-action text",
      "charCount": 320
    },
    {
      "id": 3,
      "style": "Insight-Led",
      "caption": "full publication-ready caption text",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "cta": "specific call-to-action text",
      "charCount": 260
    }
  ]
}`;

  const result = await callGemini(prompt, FALLBACK_CAPTIONS);
  res.json(result);
});

export default router;
