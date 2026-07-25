import { instruments } from "../data/instruments";
import { buildTimeframe } from "./timeframeBuilder";

export async function buildAllTimeframes() {

    console.log("🕒 Building higher timeframes...");

    const now = new Date();

    const minute = now.getUTCMinutes();
    const hour = now.getUTCHours();

    for (const inst of instruments) {

        try {

            // Every minute -> build latest 5m candle if needed
            if (minute % 5 === 0) {

                await buildTimeframe(
                    inst.id,
                    "1m",
                    "5m",
                    5
                );

            }

            // Every 15 minutes
            if (minute % 15 === 0) {

                await buildTimeframe(
                    inst.id,
                    "1m",
                    "15m",
                    15
                );

            }

            // Every 30 minutes
            if (minute % 30 === 0) {

                await buildTimeframe(
                    inst.id,
                    "1m",
                    "30m",
                    30
                );

            }

            // Every hour
            if (minute === 0) {

                await buildTimeframe(
                    inst.id,
                    "1m",
                    "1h",
                    60
                );

            }

            // Every 4 hours
            if (minute === 0 && hour % 4 === 0) {

                await buildTimeframe(
                    inst.id,
                    "1m",
                    "4h",
                    240
                );

            }

        } catch (err) {

            console.error(
                `❌ ${inst.id} timeframe build failed`,
                err
            );

        }

    }

    console.log("✅ Higher timeframe build complete");

}