import { prisma } from "../lib/prisma";
import { instruments } from "../data/instruments";
import { analyzeTrend } from "./trendEngine";

import {
    getPriceHistory,
    chronological,
    getClosePrices,
    getHighPrices,
    getLowPrices,
    EMA,
    RSI,
    ATR,
    MACD,
    BollingerBands,
    ADX
} from "./technicalEngine";

async function calculateInstrumentIndicators(

    instrumentId: string,

    timeframe: string

) {

    const candles = await getPriceHistory(

        instrumentId,

        timeframe,

        220

    );

    if (candles.length < 50) {

        console.log(

            `⚠️ ${instrumentId} ${timeframe} skipped (${candles.length})`

        );

        return;

    }

    const latest = candles[candles.length - 1];

    const existing =
        await prisma.technicalIndicator.findFirst({

            where: {

                instrument: instrumentId,

                timeframe

            },

            orderBy: {

                timestamp: "desc"

            }

        });

    if (

        existing &&

        existing.timestamp.getTime() === latest.timestamp.getTime()

    ) {

        return;

    }

    const ordered = chronological(candles);

    const closes = getClosePrices(ordered);

    const highs = getHighPrices(ordered);

    const lows = getLowPrices(ordered);

    const ema20 = EMA(closes,20);
    const ema50 = EMA(closes,50);

    const ema200 =
        closes.length >= 200
            ? EMA(closes,200)
            : closes[closes.length-1];

    const rsi14 = RSI(closes,14);

    const atr14 = ATR(
        highs,
        lows,
        closes,
        14
    );

    const adx14 = ADX(
        highs,
        lows,
        closes,
        14
    );

    const macd = MACD(closes);

    const bb = BollingerBands(closes);

    const trend = analyzeTrend({

        ema20,

        ema50,

        ema200,

        adx14,

        rsi14,

        macd: macd.macd,

        macdSignal: macd.signal

    });

    await prisma.technicalIndicator.upsert({

        where: {

            instrument_timeframe_timestamp: {

                instrument: instrumentId,

                timeframe,

                timestamp: latest.timestamp

            }

        },

        update: {

            ema20,
            ema50,
            ema200,
            rsi14,
            atr14,
            adx14,
            macd: macd.macd,
            macdSignal: macd.signal,
            macdHist: macd.histogram,
            bbUpper: bb.upper,
            bbMiddle: bb.middle,
            bbLower: bb.lower,
            volume: latest.volume

        },

        create: {

            instrument: instrumentId,

            timeframe,

            timestamp: latest.timestamp,

            ema20,
            ema50,
            ema200,
            rsi14,
            atr14,
            adx14,
            macd: macd.macd,
            macdSignal: macd.signal,
            macdHist: macd.histogram,
            bbUpper: bb.upper,
            bbMiddle: bb.middle,
            bbLower: bb.lower,
            volume: latest.volume

        }

    });

    console.log(

        `✅ ${instrumentId} ${timeframe} | ${trend.direction}`

    );

}

export async function calculateTechnicalIndicators(

    timeframes: string[] = [

        "1m",

        "5m",

        "15m",

        "30m",

        "1h",

        "4h"

    ]

) {

    console.log("📈 Calculating technical indicators...");

    const jobs: Promise<void>[] = [];

    for (const inst of instruments) {

        for (const tf of timeframes) {

            jobs.push(

                calculateInstrumentIndicators(

                    inst.id,

                    tf

                )

            );

        }

    }

    await Promise.all(jobs);

    console.log("✅ Technical indicator calculation complete");

}