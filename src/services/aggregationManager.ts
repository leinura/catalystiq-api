import { instruments } from "../data/instruments";
import { aggregateAllTimeframes } from "./timeframeAggregator";

export async function aggregateEntireDatabase() {

    console.log("==================================");
    console.log("Building historical timeframes...");
    console.log("==================================");

    for (const inst of instruments) {

        try {

            await aggregateAllTimeframes(inst.id);

        }

        catch (err) {

            console.error(
                `❌ ${inst.id}`,
                err
            );

        }

    }

    console.log("==================================");
    console.log("Historical aggregation completed");
    console.log("==================================");

}