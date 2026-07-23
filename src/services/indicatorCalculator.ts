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
 */
const MIN_CANDLES = 250;

/**
 * Safe last item.
 */
function last<T>(arr: T[]): T | undefined {
  if (!arr.length) return undefined;
  return arr[arr.length - 1];
}

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

  //---------------------------------------
  // EMA
  //---------------------------------------

  const ema20 =
    last(
      EMA.calculate({
        period: 20,
        values: closes,
      })
    ) ?? 0;

  const ema50 =
    last(
      EMA.calculate({
        period: 50,
        values: closes,
      })
    ) ?? 0;

  const ema200 =
    last(
      EMA.calculate({
        period: 200,
        values: closes,
      })
    ) ?? 0;

  //---------------------------------------
  // RSI
  //---------------------------------------

  const rsi14 =
    last(
      RSI.calculate({
        values: closes,
        period: 14,
      })
    ) ?? 50;

  //---------------------------------------
  // MACD
  //---------------------------------------

  const macd =
    last(
      MACD.calculate({
        values: closes,
        fastPeriod: 12,
        slowPeriod: 26,
        signalPeriod: 9,
        SimpleMAOscillator: false,
        SimpleMASignal: false,
      })
    );

  const macdValue = macd?.MACD ?? 0;
  const signalValue = macd?.signal ?? 0;
  const histogramValue = macd?.histogram ?? 0;

  //---------------------------------------
  // ATR
  //---------------------------------------

  const atr14 =
    last(
      ATR.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: 14,
      })
    ) ?? 0;

  //---------------------------------------
  // ADX
  //---------------------------------------

  const adx =
    last(
      ADX.calculate({
        high: highs,
        low: lows,
        close: closes,
        period: 14,
      })
    );

  const adx14 = adx?.adx ?? 0;

  //---------------------------------------
  // Bollinger Bands
  //---------------------------------------

  const bb =
    last(
      BollingerBands.calculate({
        period: 20,
        values: closes,
        stdDev: 2,
      })
    );

  const bbUpper = bb?.upper ?? 0;
  const bbMiddle = bb?.middle ?? 0;
  const bbLower = bb?.lower ?? 0;

  //---------------------------------------
  // Trend
  //---------------------------------------

  let trendDirection: IndicatorResult["trendDirection"] = "Neutral";

  if (
    ema20 > ema50 &&
    ema50 > ema200 &&
    adx14 >= 25
  ) {
    trendDirection = "Bullish";
  }

  if (
    ema20 < ema50 &&
    ema50 < ema200 &&
    adx14 >= 25
  ) {
    trendDirection = "Bearish";
  }

  //---------------------------------------
  // Market Regime
  //---------------------------------------

  let marketRegime: IndicatorResult["marketRegime"] = "Ranging";

  if (adx14 >= 25)
    marketRegime = "Trending";

  if (atr14 > closes[closes.length - 1] * 0.02)
    marketRegime = "Volatile";

  //---------------------------------------
  // Momentum
  //---------------------------------------

  let momentum: IndicatorResult["momentum"] = "Neutral";

  if (
    macdValue > signalValue &&
    rsi14 > 60
  ) {
    momentum = "Strong Bullish";
  }
  else if (
    macdValue > signalValue
  ) {
    momentum = "Bullish";
  }
  else if (
    macdValue < signalValue &&
    rsi14 < 40
  ) {
    momentum = "Strong Bearish";
  }
  else if (
    macdValue < signalValue
  ) {
    momentum = "Bearish";
  }

  //---------------------------------------
  // Volatility
  //---------------------------------------

  const bandWidth =
    bbMiddle === 0
      ? 0
      : (bbUpper - bbLower) / bbMiddle;

  let volatility: IndicatorResult["volatility"] = "Medium";

  if (bandWidth < 0.01)
    volatility = "Low";

  if (bandWidth > 0.04)
    volatility = "High";

  //---------------------------------------
  // Return
  //---------------------------------------

  return {

    instrument,

    timeframe,

    timestamp:
      candles[candles.length - 1].timestamp,

    ema20,

    ema50,

    ema200,

    rsi14,

    macd: macdValue,

    macdSignal: signalValue,

    macdHistogram: histogramValue,

    atr14,

    adx14,

    bbUpper,

    bbMiddle,

    bbLower,

    trendDirection,

    marketRegime,

    momentum,

    volatility,

  };
}