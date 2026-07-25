import { prisma } from "../lib/prisma";

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
            timestamp: "asc"
        }

    });

    if (candles.length < minutes) {
        return;
    }

    let built = 0;

    for (let i = minutes - 1; i < candles.length; i += minutes) {

        const group = candles.slice(i - minutes + 1, i + 1);

        const open = group[0].open;
        const close = group[group.length - 1].close;
        const high = Math.max(...group.map(c => c.high));
        const low = Math.min(...group.map(c => c.low));

        const volume = group.reduce(
            (sum, c) => sum + (c.volume ?? 0),
            0
        );

        const timestamp = group[group.length - 1].timestamp;

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

        built++;

    }

    console.log(
        `✅ ${instrument} ${targetTimeframe}: ${built} candles built`
    );

}