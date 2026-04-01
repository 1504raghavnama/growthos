import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "./logger";

export async function callGemini(
  prompt: string,
  fallback: unknown
): Promise<unknown> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    });

    const text = response.text ?? "";
    const cleaned = text
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    logger.error({ err: error }, "Gemini API error, using fallback");
    return fallback;
  }
}
