import { logger } from "./logger";

type GeminiClient = {
  models: {
    generateContent: (opts: {
      model: string;
      contents: { role: string; parts: { text: string }[] }[];
      config?: Record<string, unknown>;
    }) => Promise<{ text?: string }>;
  };
};

let _client: GeminiClient | null = null;
let _clientInitAttempted = false;

async function getClient(): Promise<GeminiClient | null> {
  if (_clientInitAttempted) return _client;
  _clientInitAttempted = true;
  try {
    const mod = await import("@workspace/integrations-gemini-ai");
    _client = mod.ai as GeminiClient;
  } catch (err) {
    logger.warn(
      { err },
      "Gemini AI client unavailable — will use fallback data for all AI calls"
    );
  }
  return _client;
}

export async function callGemini(
  prompt: string,
  fallback: unknown,
  options: { plainText?: boolean } = {}
): Promise<unknown> {
  const client = await getClient();
  if (!client) return fallback;

  try {
    const config: Record<string, unknown> = { maxOutputTokens: 8192 };
    if (!options.plainText) {
      config.responseMimeType = "application/json";
    }

    const response = await client.models.generateContent({
      model: "gemini-3-flash-preview",
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
