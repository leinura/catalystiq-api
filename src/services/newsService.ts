// src/services/newsService.ts
// Real-time per-instrument news for CatalystIQ
// Sources: Finnhub (real-time, free tier) + RSS feeds (ForexLive, FXStreet, Investing.com)
// Deps: axios, rss-parser (already installed)

import axios from "axios";
import Parser from "rss-parser";

const rss = new Parser({ timeout: 8000 });
const FINNHUB_KEY = process.env.FINNHUB_API_KEY;

export interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  source: string;
  image: string | null;
  publishedAt: string;
}

// ---- Instrument -> keyword mapping ----------------------------------------
export const INSTRUMENTS: Record<string, string[]> = {
  XAUUSD: ["gold", "xau", "bullion", "precious metals"],
  XAGUSD: ["silver", "xag"],
  EURUSD: ["eurusd", "euro", "ecb", "eurozone"],
  GBPUSD: ["gbpusd", "pound", "sterling", "boe", "uk economy"],
  USDJPY: ["usdjpy", "yen", "boj", "japan"],
  AUDUSD: ["audusd", "aussie", "rba", "australia"],
  USDCAD: ["usdcad", "loonie", "boc", "canada"],
  USDCHF: ["usdchf", "franc", "snb", "switzerland"],
  NZDUSD: ["nzdusd", "kiwi", "rbnz"],
  USOIL:  ["crude", "wti", "oil price", "opec", "brent", "hormuz"],
  BTCUSD: ["bitcoin", "btc", "crypto"],
  US30:   ["dow jones", "dow futures"],
  NAS100: ["nasdaq", "tech stocks"],
  SPX500: ["s&p 500", "sp500", "us stocks"],
  DXY:    ["dollar index", "dxy", "fed", "fomc", "us dollar"],
};

// USD-driven instruments also react to Fed/US macro news
const USD_MACRO = ["fed", "fomc", "powell", "cpi", "nonfarm", "nfp", "us inflation", "rate cut", "rate hike"];
const USD_PAIRS = new Set([
  "XAUUSD","XAGUSD","EURUSD","GBPUSD","USDJPY","AUDUSD","USDCAD","USDCHF",
  "NZDUSD","DXY","US30","NAS100","SPX500","BTCUSD",
]);

// ---- RSS sources (free, updated within minutes) ---------------------------
const RSS_FEEDS = [
  "https://www.forexlive.com/feed/news",
  "https://www.fxstreet.com/rss/news",
  "https://www.investing.com/rss/news_1.rss",   // forex news
  "https://www.investing.com/rss/news_11.rss",  // commodities news
];

// ---- Simple in-memory cache (5 min TTL) -----------------------------------
const cache = new Map<string, { at: number; data: NewsArticle[] }>();
const TTL_MS = 5 * 60 * 1000;

function getCached(key: string): NewsArticle[] | null {
  const hit = cache.get(key);
  return hit && Date.now() - hit.at < TTL_MS ? hit.data : null;
}
function setCached(key: string, data: NewsArticle[]): void {
  cache.set(key, { at: Date.now(), data });
}

// ---- Fetchers -------------------------------------------------------------
async function fetchFinnhub(category: string): Promise<NewsArticle[]> {
  if (!FINNHUB_KEY) return [];
  try {
    const { data } = await axios.get("https://finnhub.io/api/v1/news", {
      params: { category, token: FINNHUB_KEY },
      timeout: 8000,
    });
    return (data || []).map((a: any): NewsArticle => ({
      title: a.headline,
      summary: a.summary || "",
      url: a.url,
      source: a.source || "Finnhub",
      image: a.image || null,
      publishedAt: new Date(a.datetime * 1000).toISOString(),
    }));
  } catch (e: any) {
    console.error("Finnhub fetch failed:", e.message);
    return [];
  }
}

async function fetchAllRSS(): Promise<NewsArticle[]> {
  const results = await Promise.allSettled(RSS_FEEDS.map((url) => rss.parseURL(url)));
  const items: NewsArticle[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const item of r.value.items || []) {
      items.push({
        title: item.title || "",
        summary: (item.contentSnippet || "").slice(0, 300),
        url: item.link || "",
        source: r.value.title || "RSS",
        image: null,
        publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
      });
    }
  }
  return items;
}

// ---- Aggregation ----------------------------------------------------------
async function getRawNewsPool(): Promise<NewsArticle[]> {
  const cached = getCached("pool");
  if (cached) return cached;

  const [finnhubForex, finnhubGeneral, rssItems] = await Promise.all([
    fetchFinnhub("forex"),
    fetchFinnhub("general"),
    fetchAllRSS(),
  ]);

  // Merge + dedupe by normalized title
  const seen = new Set<string>();
  const pool: NewsArticle[] = [];
  for (const a of [...finnhubForex, ...rssItems, ...finnhubGeneral]) {
    const key = (a.title || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 80);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    pool.push(a);
  }

  // Only keep last 48 hours, newest first
  const cutoff = Date.now() - 48 * 3600 * 1000;
  const fresh = pool
    .filter((a) => new Date(a.publishedAt).getTime() > cutoff)
    .sort((x, y) => new Date(y.publishedAt).getTime() - new Date(x.publishedAt).getTime());

  setCached("pool", fresh);
  return fresh;
}

function matchesInstrument(article: NewsArticle, symbol: string): boolean {
  const keywords = INSTRUMENTS[symbol] || [symbol.toLowerCase()];
  const text = `${article.title} ${article.summary}`.toLowerCase();
  if (keywords.some((k) => text.includes(k))) return true;
  if (USD_PAIRS.has(symbol) && USD_MACRO.some((k) => text.includes(k))) return true;
  return false;
}

// ---- Public API -----------------------------------------------------------
export async function getNewsForInstrument(symbol: string, limit = 20): Promise<NewsArticle[]> {
  const sym = symbol.toUpperCase();
  const cacheKey = `news:${sym}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const pool = await getRawNewsPool();
  const matched = pool.filter((a) => matchesInstrument(a, sym)).slice(0, limit);
  setCached(cacheKey, matched);
  return matched;
}

export async function getLatestNews(limit = 30): Promise<NewsArticle[]> {
  const pool = await getRawNewsPool();
  return pool.slice(0, limit);
}