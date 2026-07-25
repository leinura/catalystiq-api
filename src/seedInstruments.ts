import { PrismaClient } from "@prisma/client";
import { instruments } from "./data/instruments";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding instruments...");

  for (const inst of instruments) {
    await prisma.instrument.upsert({
      where: { id: inst.id },

      update: {
        sym: inst.sym,
        name: inst.name,
        cat: inst.cat,
        price: inst.price,
        open: inst.open,
        bias: inst.bias,
        score: inst.score,
        action: inst.action,

        entryLo: inst.entry_lo,
        entryHi: inst.entry_hi,

        sl: inst.sl,
        tp1: inst.tp1,
        tp2: inst.tp2,

        rr: inst.rr,
        reason: inst.reason,

        cotLong: inst.cotLong,
        cotShort: inst.cotShort,
      },

      create: {
        id: inst.id,

        sym: inst.sym,
        name: inst.name,
        cat: inst.cat,

        price: inst.price,
        open: inst.open,

        bias: inst.bias,
        score: inst.score,
        action: inst.action,

        entryLo: inst.entry_lo,
        entryHi: inst.entry_hi,

        sl: inst.sl,
        tp1: inst.tp1,
        tp2: inst.tp2,

        rr: inst.rr,
        reason: inst.reason,

        cotLong: inst.cotLong,
        cotShort: inst.cotShort,
      },
    });

    console.log(`✅ ${inst.id}`);
  }

  console.log("Finished.");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });