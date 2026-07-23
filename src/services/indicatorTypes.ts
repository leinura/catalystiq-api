export interface Candle {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MACDResult {
  macd: number;
  signal: number;
  histogram: number;
}

export interface BollingerResult {
  upper: number;
  middle: number;
  lower: number;
}

export interface IndicatorResult {
  instrument: string;
  timeframe: string;

  timestamp: Date;

  ema20: number;
  ema50: number;
  ema200: number;

  rsi14: number;

  macd: number;
  macdSignal: number;
  macdHistogram: number;

  atr14: number;

  adx14: number;

  bbUpper: number;
  bbMiddle: number;
  bbLower: number;

  trendDirection: 'Bullish' | 'Bearish' | 'Neutral';

  marketRegime: 'Trending' | 'Ranging' | 'Volatile';

  momentum:
    | 'Strong Bullish'
    | 'Bullish'
    | 'Neutral'
    | 'Bearish'
    | 'Strong Bearish';

  volatility:
    | 'Low'
    | 'Medium'
    | 'High';
}