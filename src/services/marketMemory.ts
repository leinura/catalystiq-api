import prisma from '../lib/prisma';
import { instruments } from '../data/instruments';
import { fetchYahooCandles, YahooCandle } from './priceFetcher';

/**
 * Yahoo symbol mapping.
 * Later we can move this into instruments.ts.
 */
const YAHOO_SYMBOLS: Record<string, string> = {
  USOIL: 'CL=F',
  UKOIL: 'BZ=F',
  XAUUSD: 'GC=F',
  XAGUSD: 'SI=F',
  BTCUSD: 'BTC-USD',
  SPX500: '^GSPC',
  NAS100: '^IXIC',

  EURUSD: 'EURUSD=X',
  GBPUSD: 'GBPUSD=X',
  USDJPY: 'JPY=X',
  AUDUSD: 'AUDUSD=X',
  NZDUSD: 'NZDUSD=X',
  USDCAD: 'CAD=X',
  EURJPY: 'EURJPY=X',
  GBPJPY: 'GBPJPY=X',
};

export async function saveMarketHistory(
  instrument: string,
  timeframe: string,
  candles: YahooCandle[],
  source = "Yahoo Finance"
): Promise<void> {

  if (!candles.length) return;

  let inserted = 0;

  for (const candle of candles) {

    await prisma.priceHistory.upsert({

      where: {

        instrument_timeframe_timestamp: {

          instrument,

          timeframe,

          timestamp: candle.timestamp,

        },

      },

      update: {

        open: candle.open,

        high: candle.high,

        low: candle.low,

        close: candle.close,

        volume: candle.volume,

        source,

      },

      create: {

        instrument,

        timeframe,

        timestamp: candle.timestamp,

        open: candle.open,

        high: candle.high,

        low: candle.low,

        close: candle.close,

        volume: candle.volume,

        source,

      },

    });

    inserted++;

  }

  console.log(

    `💾 ${instrument} : ${inserted} candles synchronized`

  );

}

export async function saveLatestMarketHistory(): Promise<void> {
  console.log('💾 Saving market history...');

  for (const inst of instruments) {
    const yahooSymbol = YAHOO_SYMBOLS[inst.id];

    if (!yahooSymbol) {
      console.warn(`⚠ No Yahoo symbol for ${inst.id}`);
      continue;
    }

    try {
      const candles = await fetchYahooCandles(
        yahooSymbol,
        '1m',
        '1d'
      );

      await saveMarketHistory(
        inst.id,
        '1m',
        candles
      );
    } catch (err) {
      console.error(`❌ ${inst.id}`, err);
    }
  }

  console.log('✅ Market history saved');
}