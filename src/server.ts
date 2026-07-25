import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cron from 'node-cron';

import instrumentRoutes from './routes/instruments';
import catalystRoutes from './routes/catalysts';
import healthRoutes from './routes/health';
import authRoutes from './routes/auth';
import notificationRoutes from './routes/notifications';
import trackRecordRoutes from './routes/trackRecord';
import newsRouter from "./routes/news";

import { saveLatestMarketHistory } from './services/marketMemory';
import { calculateTechnicalIndicators } from "./services/indicatorService";
import { buildAllTimeframes } from "./services/timeframeManager";
import { generateTradeLevels } from "./services/tradeGenerator";

import {
  fetchAllPrices,
  fetchRetailSentiment,
  fetchInterestRates,
  fetchYahooCandles,
} from './services/priceFetcher';

import { updateAllScores } from './services/scoringEngine';
import { runAICatalystAnalysis } from './services/aiCatalysts';
import { updateNewsSummaries } from './services/newsSummaries';
import { instruments } from './data/instruments';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
}));

app.use(express.json());

app.use('/api/health', healthRoutes);
app.use('/api/instruments', instrumentRoutes);
app.use('/api/catalysts', catalystRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/track-record', trackRecordRoutes);
app.use("/api/news", newsRouter);

app.get('/', (req, res) => {
  res.json({
    message: 'CatalystIQ API is running'
  });
});

async function init() {

  console.log("🚀 CatalystIQ API starting...");

  // Fetch latest prices
  await fetchAllPrices();

  // Download market history
  await saveLatestMarketHistory();

  // Build higher timeframe candles
  await buildAllTimeframes();

  // Calculate indicators
  await calculateTechnicalIndicators();

  // Debug
  const candles = await fetchYahooCandles("CL=F");
  console.log(candles.slice(-3));

  // Fundamental data
  await fetchRetailSentiment();
  await fetchInterestRates();

  // AI
  await runAICatalystAnalysis();
  await updateNewsSummaries();

  // Scores
  updateAllScores(instruments);

  // Trade levels
  await generateTradeLevels();

  console.log("✅ Initial data loaded");

}

function startCronJobs() {

  console.log("🚀 Starting cron jobs...");

  // ==========================
  // Every 60 seconds
  // ==========================

  cron.schedule('*/60 * * * * *', async () => {

    try {

      console.log("🔄 1-minute update started");

      await fetchAllPrices();

      await saveLatestMarketHistory();

      await buildAllTimeframes();

      const now = new Date();

      const minute = now.getUTCMinutes();
      const hour = now.getUTCHours();

      const timeframes: string[] = ["1m"];

      if (minute % 5 === 0)
        timeframes.push("5m");

      if (minute % 15 === 0)
        timeframes.push("15m");

      if (minute % 30 === 0)
        timeframes.push("30m");

      if (minute === 0)
        timeframes.push("1h");

      if (minute === 0 && hour % 4 === 0)
        timeframes.push("4h");

      await calculateTechnicalIndicators(timeframes);

      console.log(
        `✅ Indicators updated: ${timeframes.join(", ")}`
      );

      console.log("✅ 1-minute update completed");

    } catch (err) {

      console.error("❌ 1-minute update failed:", err);

    }

  });

  // ==========================
  // Every 5 minutes
  // ==========================

  cron.schedule('*/5 * * * *', async () => {

    updateAllScores(instruments);

    await generateTradeLevels();

    await fetchRetailSentiment();

  });

  // ==========================
  // Every hour
  // ==========================

  cron.schedule('0 * * * *', async () => {

    await runAICatalystAnalysis();

    await updateNewsSummaries();

  });

  // ==========================
  // Every 6 hours
  // ==========================

  cron.schedule('0 */6 * * *', async () => {

    await fetchInterestRates();

  });

  // ==========================
  // Alerts
  // ==========================

  const previousScores: Record<string, number> = {};
  const previousActions: Record<string, string> = {};

  cron.schedule('*/5 * * * *', () => {

    instruments.forEach(inst => {

      const prevScore = previousScores[inst.id] ?? 0;

      if (
        prevScore < 55 &&
        inst.score >= 55 &&
        (inst.action === 'sell' || inst.action === 'buy')
      ) {

        console.log(
          `🎯 New setup: ${inst.sym} score crossed 55% → ${inst.score}%`
        );

      }

      if (
        inst.score >= 55 &&
        inst.entry_lo &&
        inst.entry_hi &&
        inst.price >= inst.entry_lo &&
        inst.price <= inst.entry_hi &&
        previousActions[inst.id] !== 'in_zone'
      ) {

        console.log(
          `⚡ Price alert: ${inst.sym} entered entry zone at ${inst.price}`
        );

        previousActions[inst.id] = 'in_zone';

      } else if (

        inst.price < (inst.entry_lo ?? 0) ||
        inst.price > (inst.entry_hi ?? 0)

      ) {

        if (previousActions[inst.id] === 'in_zone') {

          previousActions[inst.id] = inst.action;

        }

      }

      previousScores[inst.id] = inst.score;

      if (previousActions[inst.id] !== 'in_zone') {

        previousActions[inst.id] = inst.action;

      }

    });

  });

  console.log("✅ Cron jobs started");

}

app.listen(PORT, async () => {

  console.log(`✅ Server running on http://localhost:${PORT}`);

  try {

    await init();

    startCronJobs();

  } catch (err) {

    console.error("❌ Startup failed:", err);

  }

});

export default app;