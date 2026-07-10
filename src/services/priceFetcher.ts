import axios from 'axios';
import { instruments } from '../data/instruments';
import { irDifferentials } from './scoringEngine';

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
    console.error('❌ Forex fetch failed:', err);
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
    console.error('❌ Metal fetch failed:', err);
  }
}

export async function fetchCryptoPrices(): Promise<void> {
  try {
    const res = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { timeout: 5000 }
    );
    const btc = instruments.find(i => i.id === 'BTCUSD');
    if (btc && res.data?.bitcoin?.usd) {
      btc.price = res.data.bitcoin.usd;
    }
    console.log(`[${new Date().toISOString()}] ✅ Crypto prices updated`);
  } catch (err) {
    console.error('❌ Crypto fetch failed:', err);
  }
}

export async function fetchOilPrice(): Promise<void> {
  try {
    const res = await axios.get(
      'https://api.api-ninjas.com/v1/commodityprice?name=crude_oil',
      {
        timeout: 5000,
        headers: { 'X-Api-Key': process.env.API_NINJAS_KEY || '' },
      }
    );
    const price = res.data?.price;
    const oil = instruments.find(i => i.id === 'USOIL');
    if (oil && price) oil.price = price;
    console.log(`[${new Date().toISOString()}] ✅ Oil price updated: ${price}`);
  } catch (err) {
    console.error('❌ Oil fetch failed:', err);
  }
}

export async function fetchBrentPrice(): Promise<void> {
  try {
    const res = await axios.get(
      'https://query1.finance.yahoo.com/v8/finance/chart/BZ=F?interval=1m&range=1d',
      {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );
    const price = res.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    const brent = instruments.find(i => i.id === 'UKOIL');
    if (brent && price) brent.price = parseFloat(price.toFixed(2));
    console.log(`[${new Date().toISOString()}] ✅ Brent price updated: $${price}`);
  } catch (err) {
    console.error('❌ Brent fetch failed:', err);
  }
}

export async function fetchNASDAQPrice(): Promise<void> {
  try {
    const res = await axios.get(
      'https://query1.finance.yahoo.com/v8/finance/chart/NQ=F?interval=1m&range=1d',
      {
        timeout: 5000,
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }
    );
    const price = res.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    const nas = instruments.find(i => i.id === 'NAS100');
    if (nas && price) nas.price = parseFloat(price.toFixed(2));
    console.log(`[${new Date().toISOString()}] ✅ NASDAQ price updated: ${price}`);
  } catch (err) {
    console.error('❌ NASDAQ fetch failed:', err);
  }
}

export async function fetchIndicesPrices(): Promise<void> {
  try {
    const [spxRes, nasRes] = await Promise.all([
      axios.get(
        'https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC?interval=1m&range=1d',
        { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } }
      ),
      axios.get(
        'https://query1.finance.yahoo.com/v8/finance/chart/%5EIXIC?interval=1m&range=1d',
        { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } }
      ),
    ]);

    const spxPrice = spxRes.data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    const nasPrice = nasRes.data?.chart?.result?.[0]?.meta?.regularMarketPrice;

    const spx = instruments.find(i => i.id === 'SPX500');
    const nas = instruments.find(i => i.id === 'NAS100');

    if (spx && spxPrice > 0) spx.price = parseFloat(spxPrice.toFixed(2));
    if (nas && nasPrice > 0) nas.price = parseFloat(nasPrice.toFixed(2));

    console.log(`[${new Date().toISOString()}] ✅ Indices updated — SPX: ${spxPrice} NAS: ${nasPrice}`);
  } catch (err) {
    console.error('❌ Indices fetch failed:', err);
  }
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
    console.error('❌ Interest rates fetch failed:', err);
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