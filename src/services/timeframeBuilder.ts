import prisma from "../lib/prisma";

export async function buildTimeframe(
    instrument: string,
    sourceTimeframe: string,
    targetTimeframe: string,
    minutes: number
) {

    const candles = await prisma.priceHistory.findMany({

        where: {

            instrument,

            timeframe: sourceTimeframe

        },

        orderBy: {

            timestamp: "desc"

        },

        take: minutes

    });

    if (candles.length < minutes) {

        return;

    }

    const ordered = [...candles].reverse();

    const open = ordered[0].open;

    const close = ordered[ordered.length - 1].close;

    const high = Math.max(...ordered.map(c => c.high));

    const low = Math.min(...ordered.map(c => c.low));

    const volume = ordered.reduce(

        (sum, c) => sum + (c.volume ?? 0),

        0

    );

    const timestamp = ordered[ordered.length - 1].timestamp;

    await prisma.priceHistory.upsert({

        where: {

            instrument_timeframe_timestamp: {

                instrument,

                timeframe: targetTimeframe,

                timestamp

            }

        },

        update: {

            open,

            high,

            low,

            close,

            volume,

            source: "CatalystIQ"

        },

        create: {

            instrument,

            timeframe: targetTimeframe,

            timestamp,

            open,

            high,

            low,

            close,

            volume,

            source: "CatalystIQ"

        }

    });

    console.log(

        `✅ ${instrument} ${targetTimeframe} candle built`

    );

}