import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "./logger";

export async function callGemini(
  prompt: string,
  fallback: unknown,
  options: { plainText?: boolean } = {}
): Promise<unknown> {
  try {
    const config: Record<string, unknown> = { maxOutputTokens: 8192 };
    if (!options.plainText) {
      config.responseMimeType = "application/json";
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config,
    });

    const text = response.text ?? "";

    if (options.plainText) {
      return text.trim();
    }

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
