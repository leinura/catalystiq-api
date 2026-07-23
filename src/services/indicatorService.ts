import prisma from "../lib/prisma";
import { instruments } from "../data/instruments";

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
    BollingerBands

} from "./technicalEngine";

export async function calculateTechnicalIndicators() {

    console.log("📈 Calculating technical indicators...");

    for (const inst of instruments) {

        try {

            const candles =
                await getPriceHistory(inst.id, "1m", 300);

            if (candles.length < 200) {

                console.log(`${inst.id} skipped (not enough candles)`);

                continue;

            }

            const ordered =
                chronological(candles);

            const closes =
                getClosePrices(ordered);
            
            const highs =
                getHighPrices(ordered);

            const lows =
                getLowPrices(ordered);

            const ema20 =
                EMA(closes,20);

            const ema50 =
                EMA(closes,50);

            const ema200 =
                EMA(closes,200);

            const rsi14 =
                RSI(closes,14);
            
            const atr14 =
                ATR(
                    highs,
                    lows,
                    closes,
                    14
                );

            const macd =
                MACD(closes);

            const bb =
                BollingerBands(closes);

            const latest =
                ordered[ordered.length-1];

            await prisma.technicalIndicator.upsert({

                where: {

                    instrument_timeframe_timestamp: {

                        instrument: inst.id,

                        timeframe: "1m",

                        timestamp: latest.timestamp

                    }

                },

                update: {

                    ema20,

                    ema50,

                    ema200,

                    rsi14,

                    atr14,

                    macd: macd.macd,

                    macdSignal: macd.signal,

                    macdHist: macd.histogram,

                    volume: latest.volume,
                    bbUpper: bb.upper,

                    bbMiddle: bb.middle,

                    bbLower: bb.lower,

                },

                create: {

                    instrument: inst.id,

                    timeframe: "1m",

                    timestamp: latest.timestamp,

                    ema20,

                    ema50,

                    ema200,

                    rsi14,

                    atr14,

                    macd: macd.macd,

                    macdSignal: macd.signal,

                    macdHist: macd.histogram,

                    volume: latest.volume,
                    bbUpper: bb.upper,

                    bbMiddle: bb.middle,

                    bbLower: bb.lower,

                },

            });

            console.log(

            `✅ ${inst.id}
            EMA20:${ema20.toFixed(2)}
            RSI:${rsi14.toFixed(2)}
            ATR:${atr14.toFixed(3)}
            MACD:${macd.macd.toFixed(3)}
            BB:${bb.lower.toFixed(2)} | ${bb.middle.toFixed(2)} | ${bb.upper.toFixed(2)}`

            );

        }

        catch(err){

            console.error(

                `❌ ${inst.id}`,

                err

            );

        }

    }

    console.log("✅ Technical indicators updated");

}