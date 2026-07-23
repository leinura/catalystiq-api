import {
  EMA,
  RSI,
  MACD,
  ATR,
  ADX,
  BollingerBands,
} from "technicalindicators";

import {
  Candle,
  IndicatorResult,
} from "./indicatorTypes";

/**
 * Minimum candles required.
 * EMA200 needs at least 200 candles.
 * We use 250 to provide stable calculations.
 */
const MIN_CANDLES = 250;

/**
 * Return last value of an array.
 */
function last<T>(arr: T[]): T {
  return arr[arr.length - 1];
}

/**
 * Main calculator.
 */
export function calculateIndicators(
  instrument: string,
  timeframe: string,
  candles: Candle[]
): IndicatorResult | null {

  if (candles.length < MIN_CANDLES) {
    console.warn(
      `Not enough candles for ${instrument}. ${candles.length}/${MIN_CANDLES}`
    );
    return null;
  }

  const closes = candles.map(c => c.close);
  const highs = candles.map(c => c.high);
  const lows = candles.map(c => c.low);

  // ------------------------
  // EMA
  // ------------------------

  const ema20 = last(
    EMA.calculate({
      period: 20,
      values: closes,
    })
  );

  const ema50 = last(
    EMA.calculate({
      period: 50,
      values: closes,
    })
  );

  const ema200 = last(
    EMA.calculate({
      period: 200,
      values: closes,
    })
  );

  // ------------------------
  // RSI
  // ------------------------

  const rsi14 = last(
    RSI.calculate({
      values: closes,
      period: 14,
    })
  );

  // ------------------------
  // MACD
  // ------------------------

  const macd = last(
    MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    })
  );

  // ------------------------
  // ATR
  // ------------------------

  const atr14 = last(
    ATR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    })
  );

  // ------------------------
  // ADX
  // ------------------------

  const adx = last(
    ADX.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    })
  );

  // ------------------------
  // Bollinger Bands
  // ------------------------

  const bb = last(
    BollingerBands.calculate({
      period: 20,
      values: closes,
      stdDev: 2,
    })
  );

  // ===================================================
  // Trend
  // ===================================================

  let trendDirection: IndicatorResult["trendDirection"] = "Neutral";

  if (
    ema20 > ema50 &&
    ema50 > ema200 &&
    adx.adx >= 25
  ) {
    trendDirection = "Bullish";
  }

  if (
    ema20 < ema50 &&
    ema50 < ema200 &&
    adx.adx >= 25
  ) {
    trendDirection = "Bearish";
  }

  // ===================================================
  // Market Regime
  // ===================================================

  let marketRegime: IndicatorResult["marketRegime"] = "Ranging";

  if (adx.adx >= 25)
    marketRegime = "Trending";

  if (atr14 > closes[closes.length - 1] * 0.02)
    marketRegime = "Volatile";

  // ===================================================
  // Momentum
  // ===================================================

  let momentum: IndicatorResult["momentum"] = "Neutral";

  if (
    macd.MACD > macd.signal &&
    rsi14 > 60
  )
    momentum = "Strong Bullish";

  else if (
    macd.MACD > macd.signal
  )
    momentum = "Bullish";

  else if (
    macd.MACD < macd.signal &&
    rsi14 < 40
  )
    momentum = "Strong Bearish";

  else if (
    macd.MACD < macd.signal
  )
    momentum = "Bearish";

  // ===================================================
  // Volatility
  // ===================================================

  const bandWidth =
    (bb.upper - bb.lower) /
    bb.middle;

  let volatility: IndicatorResult["volatility"] = "Medium";

  if (bandWidth < 0.01)
    volatility = "Low";

  if (bandWidth > 0.04)
    volatility = "High";

  return {

    instrument,

    timeframe,

    timestamp:
      candles[candles.length - 1].timestamp,

    ema20,

    ema50,

    ema200,

    rsi14,

    macd: macd.MACD,

    macdSignal: macd.signal,

    macdHistogram: macd.histogram,

    atr14,

    adx14: adx.adx,

    bbUpper: bb.upper,

    bbMiddle: bb.middle,

    bbLower: bb.lower,

    trendDirection,

    marketRegime,

    momentum,

    volatility,

  };
}