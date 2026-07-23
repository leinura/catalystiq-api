import {
    getPriceHistory,
    chronological,
    getClosePrices,
    RSI,
    EMA
} from "./services/technicalEngine";

async function test() {

    const candles =
        await getPriceHistory("USOIL");

    const ordered =
        chronological(candles);

    const closes =
        getClosePrices(ordered);

    console.log("Candles:", closes.length);

    console.log("Latest EMA20:",
        EMA(closes,20));

    console.log("Latest RSI:",
        RSI(closes));

}

test();