import { instruments } from "../data/instruments";
import { buildTimeframe } from "./timeframeBuilder";

export async function buildAllTimeframes() {

    console.log("🕒 Building higher timeframes...");

    for (const inst of instruments) {

        try {

            // 5 Minute
            await buildTimeframe(
                inst.id,
                "1m",
                "5m",
                5
            );

            // 15 Minute
            await buildTimeframe(
                inst.id,
                "1m",
                "15m",
                15
            );

            // 30 Minute
            await buildTimeframe(
                inst.id,
                "1m",
                "30m",
                30
            );

            // 1 Hour
            await buildTimeframe(
                inst.id,
                "1m",
                "1h",
                60
            );

            // 4 Hour
            await buildTimeframe(
                inst.id,
                "1m",
                "4h",
                240
            );

        }

        catch (err) {

            console.error(
                `❌ ${inst.id} timeframe build failed`,
                err
            );

        }

    }

    console.log("✅ Higher timeframe build complete");

}