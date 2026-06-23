import OpenAI from "openai";

type AnalyzeInput = {
  imageBuffer: Buffer;
  mimeType: string;
};

export type ChartAnalysis = {
  trend: string;
  support: string;
  resistance: string;
  pattern: string;
  candlestick: string;
  entry: string;
  stopLoss: string;
  target: string;
  score: number;
  risk: string;
  advice: string;
};

const fallbackAnalysis: ChartAnalysis = {
  trend: "Bullish",
  support: "2345",
  resistance: "2380",
  pattern: "Ascending Triangle",
  candlestick: "Bullish Engulfing",
  entry: "2360",
  stopLoss: "2348",
  target: "2385",
  score: 8,
  risk: "Medium",
  advice: "Good setup, but wait for confirmation. Avoid entering near resistance and manage risk clearly."
};

export async function analyzeChart({ imageBuffer, mimeType }: AnalyzeInput): Promise<ChartAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY ?? process.env["API KEY"];

  if (!apiKey) {
    return fallbackAnalysis;
  }

  const client = new OpenAI({ apiKey });
  const imageBase64 = imageBuffer.toString("base64");

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a professional technical analyst. Do not guarantee profit. Explain risks clearly. Return only valid JSON."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "Analyze this trading chart screenshot. Provide: 1. Market trend 2. Support levels 3. Resistance levels 4. Candlestick patterns 5. Chart patterns 6. Possible entry zone 7. Stop loss area 8. Take profit area 9. Risk reward quality 10. Trade setup score from 1-10. Return JSON with keys: trend, support, resistance, pattern, candlestick, entry, stopLoss, target, score, risk, advice."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return fallbackAnalysis;

  try {
    return { ...fallbackAnalysis, ...JSON.parse(content) };
  } catch {
    return fallbackAnalysis;
  }
}
