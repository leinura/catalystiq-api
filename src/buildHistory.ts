import dotenv from "dotenv";

dotenv.config();

import { aggregateEntireDatabase } from "./services/aggregationManager";

async function main() {

    console.log("Starting historical aggregation...");

    await aggregateEntireDatabase();

    console.log("Done.");

    process.exit(0);

}

main().catch(err => {

    console.error(err);

    process.exit(1);

});