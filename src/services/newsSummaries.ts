// src/services/newsSummaries.ts
// Generates a 1-2 sentence real-time news summary for each instrument,
// using the live news feed + one Claude call for all instruments at once.
// Run hourly alongside runAICatalystAnalysis.

import Anthropic from "@anthropic-ai/sdk";
import { getNewsForInstrument, INSTRUMENTS } from "./newsService";

// Lazy init — the client is created on first use, AFTER dotenv.config() has run,
// so process.env.ANTHROPIC_API_KEY is guaranteed to be loaded.
let anthropic: Anthropic | null = null;
function getClient(): Anthropic {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

// symbol -> latest summary, e.g. "Oil holds near $80 as US-Iran strikes threaten Hormuz supply routes."
export const newsSummaries: Record<string, string> = {};

export async function updateNewsSummaries(): Promise<void> {
  try {
    const symbols = Object.keys(INSTRUMENTS);

    // Gather top headlines per instrument from the live feed
    const headlineBlocks: string[] = [];
    for (const sym of symbols) {
      const news = await getNewsForInstrument(sym, 5);
      if (news.length === 0) continue;
      const lines = news.map((n) => `- ${n.title}`).join("\n");
      headlineBlocks.push(`${sym}:\n${lines}`);
    }

    if (headlineBlocks.length === 0) {
      console.log(`[${new Date().toISOString()}] ⚠️ No news available for summaries`);
      return;
    }

    const prompt = `You are a market analyst for a forex/commodity trading platform. Below are the latest headlines (last 48 hours) grouped by instrument.

For each instrument, write ONE concise summary of 1-2 short sentences capturing the current market-moving story for that instrument. Be factual and specific (prices, events, central banks). No advice, no hype.

Respond ONLY with a JSON object mapping each symbol to its summary string, no markdown fences, no preamble. Only include symbols listed below.

${headlineBlocks.join("\n\n")}`;

    const response = await getClient().messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content
      .map((b: any) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const parsed: Record<string, string> = JSON.parse(text);

    let count = 0;
    for (const [sym, summary] of Object.entries(parsed)) {
      if (typeof summary === "string" && summary.length > 0) {
        newsSummaries[sym.toUpperCase()] = summary;
        count++;
      }
    }

    console.log(`[${new Date().toISOString()}] ✅ News summaries updated for ${count} instruments`);
  } catch (err: any) {
    console.error("❌ News summaries update failed:", err?.message || "unknown error");
  }
}