// import { prisma } from "../lib/prisma";
// import { instruments } from "../data/instruments";
// import { fetchYahooCandles, YahooCandle } from "./priceFetcher";

// const YAHOO_SYMBOLS: Record<string, string> = {
//     USOIL: "CL=F",
//     UKOIL: "BZ=F",

//     XAUUSD: "GC=F",
//     XAGUSD: "SI=F",

//     BTCUSD: "BTC-USD",

//     SPX500: "^GSPC",
//     NAS100: "^IXIC",

//     EURUSD: "EURUSD=X",
//     GBPUSD: "GBPUSD=X",
//     USDJPY: "JPY=X",

//     AUDUSD: "AUDUSD=X",
//     NZDUSD: "NZDUSD=X",

//     USDCAD: "CAD=X",

//     EURJPY: "EURJPY=X",
//     GBPJPY: "GBPJPY=X",
// };

// export async function saveMarketHistory(
//     instrument: string,
//     timeframe: string,
//     candles: YahooCandle[],
//     source = "Yahoo Finance"
// ): Promise<void> {

//     if (!candles.length) return;

//     let inserted = 0;

//     for (const candle of candles) {

//         await prisma.priceHistory.upsert({

//             where: {

//                 instrument_timeframe_timestamp: {

//                     instrument,
//                     timeframe,
//                     timestamp: candle.timestamp,

//                 },

//             },

//             update: {

//                 open: candle.open,
//                 high: candle.high,
//                 low: candle.low,
//                 close: candle.close,
//                 volume: candle.volume,
//                 source,

//             },

//             create: {

//                 instrument,
//                 timeframe,
//                 timestamp: candle.timestamp,
//                 open: candle.open,
//                 high: candle.high,
//                 low: candle.low,
//                 close: candle.close,
//                 volume: candle.volume,
//                 source,

//             },

//         });

//         inserted++;

//     }

//     console.log(
//         `💾 ${instrument} ${timeframe}: ${inserted} candles synchronized`
//     );

// }

// export async function saveLatestMarketHistory(): Promise<void> {

//     console.log("💾 Saving market history...");

//     await Promise.all(

//         instruments.map(async (inst) => {

//             const yahooSymbol = YAHOO_SYMBOLS[inst.id];

//             if (!yahooSymbol) {

//                 console.warn(`⚠️ No Yahoo symbol for ${inst.id}`);
//                 return;

//             }

//             try {

//                 const candles1m = await fetchYahooCandles(
//                     yahooSymbol,
//                     "1m",
//                     "5d"
//                 );

//                 console.log(
//                     `📈 Yahoo ${yahooSymbol} 1m: ${candles1m.length} candles`
//                 );

//                 await saveMarketHistory(
//                     inst.id,
//                     "1m",
//                     candles1m
//                 );

//             } catch (err) {

//                 console.error(`❌ ${inst.id}`, err);

//             }

//         })

//     );

//     console.log("✅ Market history saved");

// }


import { prisma } from "../lib/prisma";
import { instruments } from "../data/instruments";
import { fetchYahooCandles, YahooCandle } from "./priceFetcher";

const YAHOO_SYMBOLS: Record<string, string> = {
    USOIL: "CL=F",
    UKOIL: "BZ=F",

    XAUUSD: "GC=F",
    XAGUSD: "SI=F",

    BTCUSD: "BTC-USD",

    SPX500: "^GSPC",
    NAS100: "^IXIC",

    EURUSD: "EURUSD=X",
    GBPUSD: "GBPUSD=X",
    USDJPY: "JPY=X",

    AUDUSD: "AUDUSD=X",
    NZDUSD: "NZDUSD=X",

    USDCAD: "CAD=X",

    EURJPY: "EURJPY=X",
    GBPJPY: "GBPJPY=X",
};

// Write candles in small batched transactions instead of one upsert per candle.
// A batch transaction (prisma.$transaction([...])) uses a SINGLE connection for
// the whole array, so this cuts connection usage from "one per candle" to
// "one per chunk" — critical when the pool is limited to a handful of connections.
const CHUNK_SIZE = 50;

async function upsertCandlesInChunks(
    instrument: string,
    timeframe: string,
    candles: YahooCandle[],
    source: string
): Promise<number> {
    let inserted = 0;

    for (let i = 0; i < candles.length; i += CHUNK_SIZE) {
        const chunk = candles.slice(i, i + CHUNK_SIZE);

        await prisma.$transaction(
            chunk.map((candle) =>
                prisma.priceHistory.upsert({
                    where: {
                        instrument_timeframe_timestamp: {
                            instrument,
                            timeframe,
                            timestamp: candle.timestamp,
                        },
                    },
                    update: {
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        volume: candle.volume,
                        source,
                    },
                    create: {
                        instrument,
                        timeframe,
                        timestamp: candle.timestamp,
                        open: candle.open,
                        high: candle.high,
                        low: candle.low,
                        close: candle.close,
                        volume: candle.volume,
                        source,
                    },
                })
            )
        );

        inserted += chunk.length;
    }

    return inserted;
}

export async function saveMarketHistory(
    instrument: string,
    timeframe: string,
    candles: YahooCandle[],
    source = "Yahoo Finance"
): Promise<void> {
    if (!candles.length) return;

    const inserted = await upsertCandlesInChunks(instrument, timeframe, candles, source);

    console.log(
        `💾 ${instrument} ${timeframe}: ${inserted} candles synchronized`
    );
}

// Simple concurrency limiter — runs at most `limit` instruments at once
// instead of firing all 15 in parallel and starving the connection pool.
async function runWithConcurrencyLimit<T>(
    items: T[],
    limit: number,
    task: (item: T) => Promise<void>
): Promise<void> {
    const queue = [...items];

    async function worker(): Promise<void> {
        while (queue.length > 0) {
            const item = queue.shift();
            if (item === undefined) return;
            await task(item);
        }
    }

    await Promise.all(new Array(limit).fill(null).map(() => worker()));
}

export async function saveLatestMarketHistory(): Promise<void> {
    console.log("💾 Saving market history...");

    await runWithConcurrencyLimit(instruments, 3, async (inst) => {
        const yahooSymbol = YAHOO_SYMBOLS[inst.id];

        if (!yahooSymbol) {
            console.warn(`⚠️ No Yahoo symbol for ${inst.id}`);
            return;
        }

        try {
            const candles1m = await fetchYahooCandles(yahooSymbol, "1m", "5d");

            console.log(`📈 Yahoo ${yahooSymbol} 1m: ${candles1m.length} candles`);

            await saveMarketHistory(inst.id, "1m", candles1m);
        } catch (err) {
            console.error(`❌ ${inst.id}`, err);
        }
    });

    console.log("✅ Market history saved");
}