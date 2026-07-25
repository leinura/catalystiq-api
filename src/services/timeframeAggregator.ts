import { prisma } from '../lib/prisma';

async function aggregateTimeframe(
    instrument: string,
    source: string,
    target: string,
    size: number
) {

    console.log(`🔄 ${instrument} ${target}`);

    const candles = await prisma.priceHistory.findMany({

        where: {

            instrument,

            timeframe: source

        },

        orderBy: {

            timestamp: "asc"

        }

    });

    if (candles.length < size) {

        console.log(`${instrument} not enough candles`);

        return;

    }

    for (let i = 0; i + size <= candles.length; i += size) {

        const group = candles.slice(i, i + size);

        const first = group[0];
        const last = group[group.length - 1];

        const high = Math.max(...group.map(c => c.high));

        const low = Math.min(...group.map(c => c.low));

        const volume = group.reduce(
            (sum, c) => sum + (c.volume ?? 0),
            0
        );

        await prisma.priceHistory.upsert({

            where: {

                instrument_timeframe_timestamp: {

                    instrument,

                    timeframe: target,

                    timestamp: last.timestamp

                }

            },

            update: {

                open: first.open,

                high,

                low,

                close: last.close,

                volume,

                source: "CatalystIQ"

            },

            create: {

                instrument,

                timeframe: target,

                timestamp: last.timestamp,

                open: first.open,

                high,

                low,

                close: last.close,

                volume,

                source: "CatalystIQ"

            }

        });

    }

    console.log(`✅ ${instrument} ${target} completed`);

}

export async function aggregateAllTimeframes(
    instrument: string
) {

    await aggregateTimeframe(
        instrument,
        "1m",
        "5m",
        5
    );

    await aggregateTimeframe(
        instrument,
        "1m",
        "15m",
        15
    );

    await aggregateTimeframe(
        instrument,
        "1m",
        "30m",
        30
    );

    await aggregateTimeframe(
        instrument,
        "1m",
        "1h",
        60
    );

    await aggregateTimeframe(
        instrument,
        "1m",
        "4h",
        240
    );

}