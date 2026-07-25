import { prisma } from "../lib/prisma";
import { instruments } from "../data/instruments";

export async function generateTradeLevels() {

    console.log("🎯 Generating trade levels...");


    for (const inst of instruments) {

        try {

            console.log(`\n🔍 Processing ${inst.id}`);


            // ---------------------------------------
            // Get latest technical indicator (5m)
            // ---------------------------------------

            const tech = await prisma.technicalIndicator.findFirst({

                where: {
                    instrument: inst.id,
                    timeframe: "5m"
                },

                orderBy: {
                    timestamp: "desc"
                }

            });


            if (!tech) {

                console.log(
                    `⚠️ No technical indicator found for ${inst.id}`
                );

                continue;
            }



            // ---------------------------------------
            // Get latest market price from database
            // ---------------------------------------

            const latestPrice = await prisma.priceHistory.findFirst({

                where: {
                    instrument: inst.id
                },

                orderBy: {
                    timestamp: "desc"
                }

            });



            if (!latestPrice) {

                console.log(
                    `⚠️ No price history found for ${inst.id}`
                );

                continue;
            }



            const price = latestPrice.close;

            const atr = tech.atr14;

            const ema20 = tech.ema20;



            console.log(
                `📊 ${inst.id}`,
                {
                    price,
                    atr,
                    ema20,
                    action: inst.action
                }
            );



            if (
                !price ||
                !atr ||
                !ema20
            ) {

                console.log(
                    `⚠️ Missing calculation data for ${inst.id}`
                );

                continue;
            }



            let entryLo = 0;
            let entryHi = 0;
            let sl = 0;
            let tp1 = 0;
            let tp2 = 0;
            let rr = 0;



            const action = inst.action?.toLowerCase();



            // ---------------------------------------
            // BUY SETUP
            // ---------------------------------------

            if (action === "buy") {


                // Entry zone around EMA20 pullback

                entryLo = ema20 - atr * 0.30;

                entryHi = ema20 + atr * 0.30;



                sl = entryLo - atr * 1.5;


                tp1 = price + atr * 2;

                tp2 = price + atr * 4;


            }



            // ---------------------------------------
            // SELL SETUP
            // ---------------------------------------

            else if (action === "sell") {


                // Entry zone around EMA20 rally

                entryLo = ema20 - atr * 0.30;

                entryHi = ema20 + atr * 0.30;



                sl = entryHi + atr * 1.5;


                tp1 = price - atr * 2;

                tp2 = price - atr * 4;


            }


            else {


                console.log(
                    `⚠️ Invalid action ${inst.id}: ${inst.action}`
                );


                continue;

            }



            // ---------------------------------------
            // Risk Reward calculation
            // ---------------------------------------

            const risk = Math.abs(
                sl - entryHi
            );


            const reward = Math.abs(
                tp2 - entryHi
            );


            if (risk === 0) {

                console.log(
                    `⚠️ Zero risk ${inst.id}`
                );

                continue;
            }



            rr = reward / risk;



            // ---------------------------------------
            // Update memory object
            // ---------------------------------------

            inst.entry_lo = Number(
                entryLo.toFixed(2)
            );

            inst.entry_hi = Number(
                entryHi.toFixed(2)
            );

            inst.sl = Number(
                sl.toFixed(2)
            );

            inst.tp1 = Number(
                tp1.toFixed(2)
            );

            inst.tp2 = Number(
                tp2.toFixed(2)
            );


            inst.rr =
                `${rr.toFixed(2)}:1`;



            // ---------------------------------------
            // Save to database
            // ---------------------------------------

            await prisma.instrument.update({

                where: {

                    id: inst.id

                },


                data: {

                    entryLo: inst.entry_lo,

                    entryHi: inst.entry_hi,

                    sl: inst.sl,

                    tp1: inst.tp1,

                    tp2: inst.tp2,

                    rr: inst.rr

                }

            });



            console.log(
                `✅ ${inst.id} ${action.toUpperCase()}`
            );


            console.log(
                {
                    entryLo: inst.entry_lo,
                    entryHi: inst.entry_hi,
                    SL: inst.sl,
                    TP1: inst.tp1,
                    TP2: inst.tp2,
                    RR: inst.rr
                }
            );


        }


        catch(err) {


            console.error(
                `❌ Trade generation failed for ${inst.id}`,
                err
            );


        }

    }



    console.log(
        "✅ Trade generation complete"
    );

}