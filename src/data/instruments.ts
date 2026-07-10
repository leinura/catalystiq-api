export interface Instrument {
  id: string;
  sym: string;
  name: string;
  cat: string;
  price: number;
  open: number;
  bias: 'bull' | 'bear' | 'neu';
  score: number;
  action: 'sell' | 'buy' | 'wait' | 'skip';
  entry_lo: number | null;
  entry_hi: number | null;
  sl: number | null;
  tp1: number | null;
  tp2: number | null;
  rr: string;
  reason: string;
  cotLong: number;
  cotShort: number;
  retailLong: number;
  retailShort: number;
}

export const instruments: Instrument[] = [
  {
    id: 'USOIL', sym: 'WTI Oil', name: 'Crude Oil', cat: 'energy',
    price: 64.50, open: 71.50, bias: 'bear', score: 76, action: 'sell',
    entry_lo: 67, entry_hi: 70, sl: 75, tp1: 60, tp2: 55, rr: '3.5:1',
    reason: 'Iran peace deal signed. Hormuz reopening. Oil fell 8.5%. This is the Hormuz canal trade CatalystIQ was built around.',
    cotLong: 35, cotShort: 65, retailLong: 40, retailShort: 60,
  },
  {
    id: 'XAUUSD', sym: 'XAU/USD', name: 'Gold', cat: 'metals',
    price: 4153, open: 4222, bias: 'bear', score: 72, action: 'sell',
    entry_lo: 4200, entry_hi: 4280, sl: 4390, tp1: 4050, tp2: 3900, rr: '2.8:1',
    reason: 'FOMC hawkish dot plot confirmed. 9 of 18 officials project rate hike. Peace deal removed war premium. DXY 103.2 above 200 EMA.',
    cotLong: 61, cotShort: 39, retailLong: 38, retailShort: 62,
  },
  {
    id: 'USDJPY', sym: 'USD/JPY', name: 'Yen', cat: 'forex',
    price: 154.80, open: 158.87, bias: 'bear', score: 68, action: 'sell',
    entry_lo: 156, entry_hi: 158, sl: 159.5, tp1: 152, tp2: 149, rr: '2.9:1',
    reason: 'BoJ hiked to 1.0% highest since 1995. Carry trade unwind. CFTC 65% institutional shorts. Retail 72% long.',
    cotLong: 35, cotShort: 65, retailLong: 72, retailShort: 28,
  },
  {
    id: 'NZDUSD', sym: 'NZD/USD', name: 'Kiwi', cat: 'forex',
    price: 0.5920, open: 0.6040, bias: 'bear', score: 64, action: 'sell',
    entry_lo: 0.5960, entry_hi: 0.6020, sl: 0.6080, tp1: 0.5800, tp2: 0.5700, rr: '3.0:1',
    reason: 'RBNZ cuts structural plus FOMC hawkish tactical equals double bearish. Best R:R forex this week.',
    cotLong: 43, cotShort: 57, retailLong: 62, retailShort: 38,
  },
  {
    id: 'GBPUSD', sym: 'GBP/USD', name: 'Cable', cat: 'forex',
    price: 1.3480, open: 1.3590, bias: 'bear', score: 60, action: 'sell',
    entry_lo: 1.3550, entry_hi: 1.3620, sl: 1.3700, tp1: 1.3300, tp2: 1.3200, rr: '2.5:1',
    reason: 'FOMC hawkish boosted USD. BoE dovish. Weekly neutral — use 75% position size.',
    cotLong: 44, cotShort: 56, retailLong: 65, retailShort: 35,
  },
  {
    id: 'SPX500', sym: 'S&P 500', name: 'US Stocks', cat: 'indices',
    price: 7180, open: 7353, bias: 'bear', score: 62, action: 'sell',
    entry_lo: 7300, entry_hi: 7400, sl: 7550, tp1: 7000, tp2: 6800, rr: '2.5:1',
    reason: 'FOMC hawkish sent yields higher and equities lower. S&P fell 170 points from 7353.',
    cotLong: 42, cotShort: 58, retailLong: 52, retailShort: 48,
  },
  {
    id: 'EURUSD', sym: 'EUR/USD', name: 'Euro', cat: 'forex',
    price: 1.1476, open: 1.1580, bias: 'bear', score: 55, action: 'sell',
    entry_lo: 1.1550, entry_hi: 1.1620, sl: 1.1720, tp1: 1.1350, tp2: 1.1200, rr: '2.2:1',
    reason: 'FOMC resolved ECB vs Fed standoff. Score 55% minimum threshold. Half size only.',
    cotLong: 50, cotShort: 50, retailLong: 58, retailShort: 42,
  },
  {
    id: 'XAGUSD', sym: 'XAG/USD', name: 'Silver', cat: 'metals',
    price: 67.20, open: 68.70, bias: 'bear', score: 62, action: 'wait',
    entry_lo: 70, entry_hi: 71, sl: 73, tp1: 65, tp2: 62, rr: '4.0:1',
    reason: 'At $67 industrial floor. Sell only from $70-71. Never short near $67 floor.',
    cotLong: 58, cotShort: 42, retailLong: 30, retailShort: 70,
  },
  {
    id: 'BTCUSD', sym: 'BTC/USD', name: 'Bitcoin', cat: 'crypto',
    price: 101500, open: 103250, bias: 'neu', score: 52, action: 'skip',
    entry_lo: null, entry_hi: null, sl: null, tp1: null, tp2: null, rr: '—',
    reason: 'Score 52% below 55% threshold. FOMC and peace deal forces cancel out.',
    cotLong: 48, cotShort: 52, retailLong: 55, retailShort: 45,
  },
  {
    id: 'AUDUSD', sym: 'AUD/USD', name: 'Aussie', cat: 'forex',
    price: 0.7050, open: 0.7020, bias: 'neu', score: 42, action: 'skip',
    entry_lo: null, entry_hi: null, sl: null, tp1: null, tp2: null, rr: '—',
    reason: 'RBA held rates giving AUD unexpected support. FOMC and RBA forces cancel out.',
    cotLong: 48, cotShort: 52, retailLong: 55, retailShort: 45,
  },
  {
    id: 'UKOIL', sym: 'Brent Crude', name: 'Brent Oil', cat: 'energy',
    price: 67.80, open: 73.50, bias: 'bear', score: 74, action: 'sell',
    entry_lo: 69, entry_hi: 72, sl: 78, tp1: 62, tp2: 57, rr: '3.2:1',
    reason: 'Iran peace deal + Hormuz reopening. Brent falls alongside WTI. Global oil supply returning.',
    cotLong: 36, cotShort: 64, retailLong: 42, retailShort: 58,
  },
  {
    id: 'NAS100', sym: 'NASDAQ 100', name: 'US Tech', cat: 'indices',
    price: 19850, open: 20420, bias: 'bear', score: 65, action: 'sell',
    entry_lo: 20200, entry_hi: 20500, sl: 21000, tp1: 19000, tp2: 18500, rr: '2.6:1',
    reason: 'FOMC hawkish hits tech hardest. Rate hike = higher discount rate = tech valuations compressed.',
    cotLong: 40, cotShort: 60, retailLong: 58, retailShort: 42,
  },
  {
    id: 'EURJPY', sym: 'EUR/JPY', name: 'Euro Yen', cat: 'forex',
    price: 175.20, open: 179.50, bias: 'bear', score: 66, action: 'sell',
    entry_lo: 177.0, entry_hi: 179.0, sl: 181.0, tp1: 172.0, tp2: 169.0, rr: '2.8:1',
    reason: 'BoJ hike + ECB dovish = double bearish. JPY strengthening on all crosses.',
    cotLong: 38, cotShort: 62, retailLong: 68, retailShort: 32,
  },
  {
    id: 'GBPJPY', sym: 'GBP/JPY', name: 'Sterling Yen', cat: 'forex',
    price: 203.50, open: 208.20, bias: 'bear', score: 64, action: 'sell',
    entry_lo: 206.0, entry_hi: 208.0, sl: 210.5, tp1: 199.0, tp2: 196.0, rr: '2.7:1',
    reason: 'BoJ hike + BoE dovish = bearish GBP/JPY. Most volatile JPY cross. High R:R setup.',
    cotLong: 36, cotShort: 64, retailLong: 70, retailShort: 30,
  },
  {
    id: 'USDCAD', sym: 'USD/CAD', name: 'Loonie', cat: 'forex',
    price: 1.3650, open: 1.3540, bias: 'bull', score: 58, action: 'sell',
    entry_lo: 1.3550, entry_hi: 1.3600, sl: 1.3480, tp1: 1.3750, tp2: 1.3850, rr: '2.3:1',
    reason: 'Oil collapse = CAD weakness = USD/CAD rises. Iran deal bearish for CAD directly.',
    cotLong: 55, cotShort: 45, retailLong: 42, retailShort: 58,
  },
];