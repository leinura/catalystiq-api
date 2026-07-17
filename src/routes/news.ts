// src/routes/news.ts
// Mount in server.ts:  app.use("/api/news", newsRouter);

import { Router, Request, Response } from "express";
import { getNewsForInstrument, getLatestNews, INSTRUMENTS } from "../services/newsService";

const router = Router();

// GET /api/news            -> latest market-wide news (all sources, <48h old)
router.get("/", async (req: Request, res: Response) => {
  try {
    const news = await getLatestNews(Number(req.query.limit) || 30);
    res.json({ success: true, count: news.length, news });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch news" });
  }
});

// GET /api/news/instruments -> list of supported symbols
router.get("/instruments", (_req: Request, res: Response) => {
  res.json({ success: true, instruments: Object.keys(INSTRUMENTS) });
});

// GET /api/news/:symbol     -> real-time news for one instrument (e.g. XAUUSD)
router.get("/:symbol", async (req: Request, res: Response) => {
  try {
    const symbol = String(req.params.symbol);
    const news = await getNewsForInstrument(symbol, Number(req.query.limit) || 20);
    res.json({
      success: true,
      symbol: symbol.toUpperCase(),
      count: news.length,
      news,
    });
  } catch (e) {
    res.status(500).json({ success: false, error: "Failed to fetch news" });
  }
});

export default router;