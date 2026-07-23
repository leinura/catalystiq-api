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

import {
  fetchAllPrices,
  fetchRetailSentiment,
  fetchInterestRates,
} from './services/priceFetcher';
import { updateAllScores } from './services/scoringEngine';
import { runAICatalystAnalysis } from './services/aiCatalysts';
import { updateNewsSummaries } from './services/newsSummaries';
import { instruments } from './data/instruments';
import { fetchYahooCandles } from './services/priceFetcher';

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
  res.json({ message: 'CatalystIQ API is running' });
});

async function init() {
  console.log('🚀 CatalystIQ API starting...');
  await fetchAllPrices();
  await calculateTechnicalIndicators();
  await saveLatestMarketHistory();

  const candles = await fetchYahooCandles('CL=F');

  console.log(candles.slice(-3));
  await fetchRetailSentiment();
  await fetchInterestRates();
  await runAICatalystAnalysis();
  await updateNewsSummaries();
  updateAllScores(instruments);
  console.log('✅ Initial data loaded');
}

cron.schedule('*/60 * * * * *', async () => {
  await fetchAllPrices();
  await calculateTechnicalIndicators();
  await saveLatestMarketHistory();
});

cron.schedule('*/5 * * * *', async () => {
  updateAllScores(instruments);
  await fetchRetailSentiment();
});

cron.schedule('0 * * * *', async () => {
  await runAICatalystAnalysis();
  await updateNewsSummaries();
});

cron.schedule('0 */6 * * *', async () => {
  await fetchInterestRates();
});

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
      console.log(`🎯 New setup: ${inst.sym} score crossed 55% → ${inst.score}%`);
    }

    if (
      inst.score >= 55 &&
      inst.entry_lo &&
      inst.entry_hi &&
      inst.price >= inst.entry_lo &&
      inst.price <= inst.entry_hi &&
      previousActions[inst.id] !== 'in_zone'
    ) {
      console.log(`⚡ Price alert: ${inst.sym} entered entry zone at ${inst.price}`);
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

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  init();
});

export default app;