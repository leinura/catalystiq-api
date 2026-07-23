import prisma from "../lib/prisma";
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


export async function calculateTechnicalIndicators() {

    console.log("📈 Calculating technical indicators...");


    const timeframes = [

        "1m",
        "5m",
        "15m",
        "30m",
        "1h",
        "4h"

    ];


    for (const inst of instruments) {


        for (const timeframe of timeframes) {


            try {


                const candles =
                    await getPriceHistory(
                        inst.id,
                        timeframe,
                        300
                    );


                if (candles.length < 200) {

                    console.log(
                        `${inst.id} ${timeframe} skipped`
                    );

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
                    RSI(
                        closes,
                        14
                    );



                const atr14 =
                    ATR(
                        highs,
                        lows,
                        closes,
                        14
                    );



                const adx14 =
                    ADX(
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
                    ordered[ordered.length - 1];



                const trend =
                    analyzeTrend({

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

                            instrument: inst.id,

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


                        instrument: inst.id,


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

                    `✅ ${inst.id} ${timeframe} | Trend: ${trend.direction} | ADX: ${adx14}`

                );


            }


            catch(err){

                console.error(
                    `❌ ${inst.id} ${timeframe}`,
                    err
                );

            }


        }

    }

}