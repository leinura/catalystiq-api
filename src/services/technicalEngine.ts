import prisma from "../lib/prisma";


/*
==========================================================
CatalystIQ Technical Engine
Version 1.0
==========================================================

Responsibilities

✓ Load historical candles
✓ Convert to chronological order
✓ Extract OHLCV arrays
✓ Utility math functions
✓ Ready for RSI, EMA, MACD, ATR, ADX

==========================================================
*/

export interface Candle {

    timestamp: Date;

    open: number;

    high: number;

    low: number;

    close: number;

    volume: number;

}






/*
==========================================================
Load candles from database
==========================================================
*/

export async function getPriceHistory(

    instrument: string,

    timeframe: string = "1m",

    limit: number = 300

): Promise<Candle[]> {

    const rows = await prisma.priceHistory.findMany({

        where: {

            instrument,

            timeframe

        },

        orderBy: {

            timestamp: "desc"

        },

        take: limit

    });

    return rows.map(r => ({

        timestamp: r.timestamp,

        open: Number(r.open),

        high: Number(r.high),

        low: Number(r.low),

        close: Number(r.close),

        volume: Number(r.volume)

    }));

}






/*
==========================================================
Oldest → Newest
Indicators require chronological data
==========================================================
*/

export function chronological(

    candles: Candle[]

): Candle[] {

    return [...candles].reverse();

}






/*
==========================================================
Close Prices
==========================================================
*/

export function getClosePrices(

    candles: Candle[]

): number[] {

    return candles.map(c => c.close);

}






/*
==========================================================
Open Prices
==========================================================
*/

export function getOpenPrices(

    candles: Candle[]

): number[] {

    return candles.map(c => c.open);

}






/*
==========================================================
High Prices
==========================================================
*/

export function getHighPrices(

    candles: Candle[]

): number[] {

    return candles.map(c => c.high);

}






/*
==========================================================
Low Prices
==========================================================
*/

export function getLowPrices(

    candles: Candle[]

): number[] {

    return candles.map(c => c.low);

}






/*
==========================================================
Volume
==========================================================
*/

export function getVolumes(

    candles: Candle[]

): number[] {

    return candles.map(c => c.volume);

}






/*
==========================================================
Latest Candle
==========================================================
*/

export function latest(

    candles: Candle[]

): Candle {

    return candles[candles.length - 1];

}






/*
==========================================================
Highest Value
==========================================================
*/

export function highest(

    values: number[]

): number {

    return Math.max(...values);

}






/*
==========================================================
Lowest Value
==========================================================
*/

export function lowest(

    values: number[]

): number {

    return Math.min(...values);

}






/*
==========================================================
Average
==========================================================
*/

export function average(

    values: number[]

): number {

    if (values.length === 0) return 0;

    const total = values.reduce(

        (sum, value) => sum + value,

        0

    );

    return total / values.length;

}






/*
==========================================================
Sum
==========================================================
*/

export function sum(

    values: number[]

): number {

    return values.reduce(

        (a, b) => a + b,

        0

    );

}






/*
==========================================================
Standard Deviation
Needed later for Bollinger Bands
==========================================================
*/

export function standardDeviation(

    values: number[]

): number {

    const avg = average(values);

    const variance = average(

        values.map(v => Math.pow(v - avg, 2))

    );

    return Math.sqrt(variance);

}






/*
==========================================================
Simple Moving Average
==========================================================
*/

export function SMA(

    values: number[],

    period: number

): number {

    if (values.length < period) return 0;

    const slice = values.slice(values.length - period);

    return average(slice);

}






/*
==========================================================
Exponential Moving Average
==========================================================
*/

export function EMA(

    values: number[],

    period: number

): number {

    if (values.length < period) return 0;

    const multiplier = 2 / (period + 1);

    let ema = average(values.slice(0, period));

    for (

        let i = period;

        i < values.length;

        i++

    ) {

        ema =

            (values[i] - ema) *

                multiplier +

            ema;

    }

    return ema;

}
/*
==========================================================
Simple Moving Average Series
Returns an array instead of only the latest value
==========================================================
*/

export function SMASeries(
    values: number[],
    period: number
): number[] {

    const sma: number[] = [];

    if (values.length < period) {
        return sma;
    }

    for (let i = period - 1; i < values.length; i++) {

        let total = 0;

        for (let j = i - period + 1; j <= i; j++) {
            total += values[j];
        }

        sma.push(total / period);

    }

    return sma;

}
/*
==========================================================
EMA Series
==========================================================
*/

export function EMASeries(
    values: number[],
    period: number
): number[] {

    const ema: number[] = [];

    if (values.length < period) {
        return ema;
    }

    const multiplier = 2 / (period + 1);

    let previousEMA = average(values.slice(0, period));

    ema.push(previousEMA);

    for (let i = period; i < values.length; i++) {

        previousEMA =
            ((values[i] - previousEMA) * multiplier) +
            previousEMA;

        ema.push(previousEMA);

    }

    return ema;

}
/*
==========================================================
Relative Strength Index (RSI)
Wilder's Method
==========================================================
*/

export function RSI(
    closes: number[],
    period = 14
): number {

    if (closes.length < period + 1) {
        return 50;
    }

    let gain = 0;
    let loss = 0;

    for (let i = 1; i <= period; i++) {

        const change = closes[i] - closes[i - 1];

        if (change >= 0) {
            gain += change;
        } else {
            loss += Math.abs(change);
        }

    }

    let avgGain = gain / period;
    let avgLoss = loss / period;

    for (let i = period + 1; i < closes.length; i++) {

        const change = closes[i] - closes[i - 1];

        const currentGain =
            change > 0 ? change : 0;

        const currentLoss =
            change < 0 ? Math.abs(change) : 0;

        avgGain =
            ((avgGain * (period - 1)) + currentGain) / period;

        avgLoss =
            ((avgLoss * (period - 1)) + currentLoss) / period;

    }

    if (avgLoss === 0) {
        return 100;
    }

    const rs = avgGain / avgLoss;

    return 100 - (100 / (1 + rs));

}
/*
==========================================================
Average True Range (ATR)
Wilder's Method
==========================================================
*/

export function ATR(
    highs: number[],
    lows: number[],
    closes: number[],
    period = 14
): number {

    if (
        highs.length < period + 1 ||
        lows.length < period + 1 ||
        closes.length < period + 1
    ) {
        return 0;
    }

    const trueRanges: number[] = [];

    for (let i = 1; i < closes.length; i++) {

        const highLow =
            highs[i] - lows[i];

        const highClose =
            Math.abs(highs[i] - closes[i - 1]);

        const lowClose =
            Math.abs(lows[i] - closes[i - 1]);

        trueRanges.push(
            Math.max(
                highLow,
                highClose,
                lowClose
            )
        );

    }

    let atr =
        average(
            trueRanges.slice(0, period)
        );

    for (let i = period; i < trueRanges.length; i++) {

        atr =
            ((atr * (period - 1)) + trueRanges[i]) /
            period;

    }

    return atr;

}
/*
==========================================================
MACD
Returns latest MACD values
==========================================================
*/

export function MACD(
    closes: number[],
    fastPeriod = 12,
    slowPeriod = 26,
    signalPeriod = 9
): {
    macd: number;
    signal: number;
    histogram: number;
} {

    if (closes.length < slowPeriod + signalPeriod) {
        return {
            macd: 0,
            signal: 0,
            histogram: 0
        };
    }

    const emaFastSeries = EMASeries(closes, fastPeriod);
    const emaSlowSeries = EMASeries(closes, slowPeriod);

    const diff =
        emaFastSeries.length - emaSlowSeries.length;

    const macdSeries: number[] = [];

    for (let i = 0; i < emaSlowSeries.length; i++) {

        macdSeries.push(
            emaFastSeries[i + diff] - emaSlowSeries[i]
        );

    }

    const signalSeries =
        EMASeries(macdSeries, signalPeriod);

    const latestMACD =
        macdSeries[macdSeries.length - 1];

    const latestSignal =
        signalSeries[signalSeries.length - 1];

    return {

        macd: latestMACD,

        signal: latestSignal,

        histogram:
            latestMACD - latestSignal

    };

}
/*
==========================================================
Bollinger Bands
==========================================================
*/

export function BollingerBands(
    closes: number[],
    period = 20,
    multiplier = 2
): {

    upper: number;

    middle: number;

    lower: number;

} {

    if (closes.length < period) {

        return {

            upper: 0,

            middle: 0,

            lower: 0

        };

    }

    const slice =
        closes.slice(closes.length - period);

    const middle =
        average(slice);

    const deviation =
        standardDeviation(slice);

    return {

        upper:
            middle + (multiplier * deviation),

        middle,

        lower:
            middle - (multiplier * deviation)

    };

}
