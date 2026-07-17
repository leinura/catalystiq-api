import axios from 'axios';
import { instruments } from '../data/instruments';
import { irDifferentials } from './scoringEngine';

// Safe error logging — never dump full axios errors (they contain API keys in headers)
function logFetchError(label: string, err: any): void {
  const detail = err?.response?.data?.error || err?.response?.status || err?.message || 'unknown error';
  console.error(`❌ ${label} fetch failed:`, detail);
}

// Shared Yahoo Finance price fetcher — free, no API key required
async function fetchYahooPrice(symbol: string): Promise<number | null> {
  try {
    const res = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}`,
      {
        params: { interval: '1m', range: '1d' },
        timeout: 8000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );
    const price = res.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    return typeof price === 'number' && price > 0 ? price : null;
  } catch (err) {
    logFetchError(`Yahoo ${symbol}`, err);
    return null;
  }
}

export async function fetchForexPrices(): Promise<void> {
  try {
    const res = await axios.get(
      'https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,AUD,NZD,CAD',
      { timeout: 5000 }
    );
    const r = res.data.rates;
    const map: Record<string, number> = {
      EURUSD: 1 / r.EUR,
      GBPUSD: 1 / r.GBP,
      USDJPY: r.JPY,
      AUDUSD: 1 / r.AUD,
      NZDUSD: 1 / r.NZD,
      USDCAD: r.CAD,
      EURJPY: r.JPY / r.EUR,
      GBPJPY: r.JPY / r.GBP,
    };
    instruments.forEach(inst => {
      if (map[inst.id] !== undefined) {
        inst.price = parseFloat(map[inst.id].toFixed(5));
      }
    });
    console.log(`[${new Date().toISOString()}] ✅ Forex prices updated`);
  } catch (err) {
    logFetchError('Forex', err);
  }
}

export async function fetchMetalPrices(): Promise<void> {
  try {
    // Use gold-api.com — completely free, no key needed
    const [goldRes, silverRes] = await Promise.all([
      axios.get('https://api.gold-api.com/price/XAU', { timeout: 8000 }),
      axios.get('https://api.gold-api.com/price/XAG', { timeout: 8000 }),
    ]);

    const goldPrice = goldRes.data?.price;
    const silverPrice = silverRes.data?.price;

    const gold = instruments.find(i => i.id === 'XAUUSD');
    const silver = instruments.find(i => i.id === 'XAGUSD');

    if (gold && goldPrice > 0) gold.price = parseFloat(goldPrice.toFixed(2));
    if (silver && silverPrice > 0) silver.price = parseFloat(silverPrice.toFixed(2));

    console.log(`[${new Date().toISOString()}] ✅ Metal prices updated — Gold: $${goldPrice} Silver: $${silverPrice}`);
  } catch (err) {
    logFetchError('Metal', err);
  }
}

export async function fetchCryptoPrices(): Promise<void> {
  const price = await fetchYahooPrice('BTC-USD');
  const btc = instruments.find(i => i.id === 'BTCUSD');
  if (btc && price) {
    btc.price = parseFloat(price.toFixed(2));
    console.log(`[${new Date().toISOString()}] ✅ Crypto prices updated — BTC: $${btc.price}`);
  }
}

export async function fetchOilPrice(): Promise<void> {
  // WTI Crude from Yahoo Finance (CL=F) — replaces API Ninjas, no key needed
  const price = await fetchYahooPrice('CL=F');
  const oil = instruments.find(i => i.id === 'USOIL');
  if (oil && price) {
    oil.price = parseFloat(price.toFixed(2));
    console.log(`[${new Date().toISOString()}] ✅ Oil (WTI) price updated: $${oil.price}`);
  }
}

export async function fetchBrentPrice(): Promise<void> {
  const price = await fetchYahooPrice('BZ=F');
  const brent = instruments.find(i => i.id === 'UKOIL');
  if (brent && price) {
    brent.price = parseFloat(price.toFixed(2));
    console.log(`[${new Date().toISOString()}] ✅ Brent price updated: $${brent.price}`);
  }
}

export async function fetchNASDAQPrice(): Promise<void> {
  const price = await fetchYahooPrice('NQ=F');
  const nas = instruments.find(i => i.id === 'NAS100');
  if (nas && price) {
    nas.price = parseFloat(price.toFixed(2));
    console.log(`[${new Date().toISOString()}] ✅ NASDAQ price updated: ${nas.price}`);
  }
}

export async function fetchIndicesPrices(): Promise<void> {
  const [spxPrice, nasPrice] = await Promise.all([
    fetchYahooPrice('^GSPC'),
    fetchYahooPrice('^IXIC'),
  ]);

  const spx = instruments.find(i => i.id === 'SPX500');
  const nas = instruments.find(i => i.id === 'NAS100');

  if (spx && spxPrice) spx.price = parseFloat(spxPrice.toFixed(2));
  if (nas && nasPrice) nas.price = parseFloat(nasPrice.toFixed(2));

  console.log(`[${new Date().toISOString()}] ✅ Indices updated — SPX: ${spxPrice} NAS: ${nasPrice}`);
}

export async function fetchRetailSentiment(): Promise<void> {
  const sentimentMap: Record<string, { long: number; short: number }> = {
    EURUSD: { long: 58, short: 42 },
    GBPUSD: { long: 65, short: 35 },
    USDJPY: { long: 72, short: 28 },
    AUDUSD: { long: 55, short: 45 },
    NZDUSD: { long: 62, short: 38 },
    USDCAD: { long: 42, short: 58 },
    XAUUSD: { long: 38, short: 62 },
    XAGUSD: { long: 30, short: 70 },
    BTCUSD: { long: 55, short: 45 },
    USOIL:  { long: 40, short: 60 },
    UKOIL:  { long: 42, short: 58 },
    SPX500: { long: 52, short: 48 },
    NAS100: { long: 58, short: 42 },
    EURJPY: { long: 68, short: 32 },
    GBPJPY: { long: 70, short: 30 },
  };

  instruments.forEach(inst => {
    const sentiment = sentimentMap[inst.id];
    if (sentiment) {
      inst.retailLong = sentiment.long;
      inst.retailShort = sentiment.short;
    }
  });

  console.log(`[${new Date().toISOString()}] ✅ Retail sentiment loaded`);
}

export async function fetchInterestRates(): Promise<void> {
  try {
    const key = process.env.FRED_API_KEY;
    const [usRes, jpRes, gbRes, euRes, nzRes] = await Promise.all([
      axios.get(
        `https://api.stlouisfed.org/fred/series/observations?series_id=FEDFUNDS&api_key=${key}&limit=1&sort_order=desc&file_type=json`,
        { timeout: 15000 }
      ),
      axios.get(
        `https://api.stlouisfed.org/fred/series/observations?series_id=IRSTCI01JPM156N&api_key=${key}&limit=1&sort_order=desc&file_type=json`,
        { timeout: 15000 }
      ),
      axios.get(
        `https://api.stlouisfed.org/fred/series/observations?series_id=IUDSOIA&api_key=${key}&limit=1&sort_order=desc&file_type=json`,
        { timeout: 15000 }
      ),
      axios.get(
        `https://api.stlouisfed.org/fred/series/observations?series_id=ECBDFR&api_key=${key}&limit=1&sort_order=desc&file_type=json`,
        { timeout: 15000 }
      ),
      axios.get(
        `https://api.stlouisfed.org/fred/series/observations?series_id=IRSTCI01NZM156N&api_key=${key}&limit=1&sort_order=desc&file_type=json`,
        { timeout: 15000 }
      ),
    ]);

    const usRate = parseFloat(usRes.data?.observations?.[0]?.value ?? '0');
    const jpRate = parseFloat(jpRes.data?.observations?.[0]?.value ?? '0');
    const gbRate = parseFloat(gbRes.data?.observations?.[0]?.value ?? '0');
    const euRate = parseFloat(euRes.data?.observations?.[0]?.value ?? '0');
    const nzRate = parseFloat(nzRes.data?.observations?.[0]?.value ?? '0');

    irDifferentials.USDJPY = parseFloat((usRate - jpRate).toFixed(2));
    irDifferentials.GBPUSD = parseFloat((gbRate - usRate).toFixed(2));
    irDifferentials.EURUSD = parseFloat((euRate - usRate).toFixed(2));
    irDifferentials.NZDUSD = parseFloat((nzRate - usRate).toFixed(2));
    irDifferentials.AUDUSD = parseFloat((3.85 - usRate).toFixed(2));
    irDifferentials.USDCAD = parseFloat((usRate - 4.75).toFixed(2));
    irDifferentials.EURJPY = parseFloat((euRate - jpRate).toFixed(2));
    irDifferentials.GBPJPY = parseFloat((gbRate - jpRate).toFixed(2));

    console.log(`[${new Date().toISOString()}] ✅ Interest rates — US:${usRate}% JP:${jpRate}% GB:${gbRate}% EU:${euRate}% NZ:${nzRate}%`);
  } catch (err) {
    logFetchError('Interest rates', err);
  }
}

export async function fetchAllPrices(): Promise<void> {
  await Promise.all([
    fetchForexPrices(),
    fetchMetalPrices(),
    fetchCryptoPrices(),
    fetchOilPrice(),
    fetchBrentPrice(),
    fetchNASDAQPrice(),
    fetchIndicesPrices(),
  ]);
}