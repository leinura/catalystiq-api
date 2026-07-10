import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const INSTRUMENT_IDS = [
  'XAUUSD', 'XAGUSD', 'USOIL', 'UKOIL', 'USDJPY',
  'EURUSD', 'GBPUSD', 'NZDUSD', 'AUDUSD', 'USDCAD',
  'EURJPY', 'GBPJPY', 'SPX500', 'NAS100', 'BTCUSD',
];

const SEARCH_QUERIES = [
  'Federal Reserve interest rates FOMC',
  'Bank of Japan BOJ rates yen',
  'gold price XAU USD Federal Reserve',
  'oil price OPEC Iran crude',
  'forex EUR USD GBP central bank',
  'S&P 500 NASDAQ stock market',
  'Bitcoin crypto market',
  'inflation CPI economic data',
];

async function fetchNewsHeadlines(): Promise<string[]> {
  const key = process.env.NEWS_API_KEY;
  const headlines: string[] = [];

  try {
    for (const query of SEARCH_QUERIES.slice(0, 4)) {
      try {
        const res = await axios.get(
          `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&language=en&apiKey=${key}`,
          { timeout: 8000 }
        );
        const articles = res.data?.articles ?? [];
        articles.forEach((a: any) => {
          if (a.title && a.description) {
            headlines.push(`${a.title} — ${a.description}`);
          }
        });
      } catch {}
    }
  } catch (err) {
    console.error('❌ NewsAPI fetch failed:', err);
  }

  console.log(`[${new Date().toISOString()}] Fetched ${headlines.length} headlines`);
  return headlines.slice(0, 20);
}

async function analyzeWithClaude(headlines: string[]): Promise<any[]> {
  if (headlines.length === 0) return [];

  const prompt = `You are a professional forex and commodities market analyst.
Analyze these market news headlines and identify the most important catalysts affecting trading instruments.

Headlines:
${headlines.map((h, i) => `${i + 1}. ${h}`).join('\n')}

For each significant catalyst (maximum 6), respond with a JSON array. Each catalyst must have:
- title: concise professional title (max 80 chars)
- impact: "HIGH" or "MED"
- direction: "bear" or "bull"
- detail: 2-3 sentence professional analysis of market impact
- affects: comma-separated instrument names
- affectsIds: array of instrument IDs from this list only: ${INSTRUMENT_IDS.join(', ')}
- confidence: number 0-100

Only include catalysts with genuine market impact. Respond with valid JSON array only, no other text.

Example format:
[
  {
    "title": "Fed holds rates but signals hike — USD bullish",
    "impact": "HIGH",
    "direction": "bear",
    "detail": "Federal Reserve held rates but dot plot signals further hikes. USD strengthened across all pairs. Gold under pressure as real yields rise.",
    "affects": "XAU/USD · EUR/USD · GBP/USD",
    "affectsIds": ["XAUUSD", "EURUSD", "GBPUSD"],
    "confidence": 85
  }
]`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') return [];

    const text = content.text.trim();
    const jsonStart = text.indexOf('[');
    const jsonEnd = text.lastIndexOf(']') + 1;
    if (jsonStart === -1 || jsonEnd === 0) return [];

    const parsed = JSON.parse(text.slice(jsonStart, jsonEnd));
    console.log(`[${new Date().toISOString()}] Claude identified ${parsed.length} catalysts`);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('❌ Claude analysis failed:', err);
    return [];
  }
}

async function saveCatalystsToDatabase(catalysts: any[]): Promise<void> {
  if (catalysts.length === 0) return;

  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await prisma.catalyst.deleteMany({
      where: { publishedAt: { lt: oneDayAgo } },
    });

    let saved = 0;
    for (const cat of catalysts) {
      if (cat.confidence >= 60) {
        await prisma.catalyst.create({
          data: {
            title: cat.title,
            impact: cat.impact,
            direction: cat.direction,
            detail: cat.detail,
            affects: cat.affects,
          },
        });
        saved++;
      }
    }

    console.log(`[${new Date().toISOString()}] ✅ ${saved} AI catalysts saved to database`);
  } catch (err) {
    console.error('❌ Failed to save catalysts:', err);
  }
}

export async function runAICatalystAnalysis(): Promise<void> {
  console.log(`[${new Date().toISOString()}] 🤖 Running AI catalyst analysis...`);
  try {
    const headlines = await fetchNewsHeadlines();
    const catalysts = await analyzeWithClaude(headlines);
    await saveCatalystsToDatabase(catalysts);
  } catch (err) {
    console.error('❌ AI catalyst analysis failed:', err);
  }
}