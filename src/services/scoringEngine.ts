import { Instrument } from '../data/instruments';

export const irDifferentials: Record<string, number> = {
  USDJPY: 2.75,
  GBPUSD: -0.25,
  EURUSD: -0.50,
  NZDUSD: 0.50,
  AUDUSD: 0.25,
  USDCAD: 1.00,
  EURJPY: 2.25,
  GBPJPY: 2.50,
};

interface ConfirmationSignals {
  vix: number;
  fearGreed: number;
  dxyAbove200EMA: boolean;
  putCallRatio: number;
}

const signals: ConfirmationSignals = {
  vix: 20.70,
  fearGreed: 30,
  dxyAbove200EMA: true,
  putCallRatio: 0.72,
};

export function updateSignals(update: Partial<ConfirmationSignals>): void {
  Object.assign(signals, update);
}

function getVIXBoost(bias: string): number {
  if (signals.vix > 25) return bias === 'bear' ? 4 : -4;
  if (signals.vix < 15) return bias === 'bull' ? 4 : -4;
  return 0;
}

function getFearGreedBoost(bias: string): number {
  if (signals.fearGreed < 25) return bias === 'bear' ? 3 : -3;
  if (signals.fearGreed > 75) return bias === 'bull' ? 3 : -3;
  return 0;
}

function getDXYBoost(id: string, bias: string): number {
  if (!signals.dxyAbove200EMA) return 0;
  const usdBearish = ['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'XAUUSD', 'XAGUSD'];
  const usdBullish = ['USDJPY', 'USDCAD'];
  if (usdBearish.includes(id) && bias === 'bear') return 3;
  if (usdBullish.includes(id) && bias === 'bull') return 3;
  return 0;
}

function getPutCallBoost(bias: string): number {
  if (signals.putCallRatio > 0.75) return bias === 'bear' ? 2 : -2;
  if (signals.putCallRatio < 0.45) return bias === 'bull' ? 2 : -2;
  return 0;
}

// ── LAYER 1: News ─────────────────────────────────────────
function getNewsScore(inst: Instrument): number {
  const map: Record<string, number> = {
    USOIL: 80, UKOIL: 78, XAUUSD: 74, USDJPY: 70,
    NZDUSD: 65, GBPUSD: 60, SPX500: 64, NAS100: 66,
    EURUSD: 55, XAGUSD: 65, BTCUSD: 52, AUDUSD: 44,
    USDCAD: 62, EURJPY: 68, GBPJPY: 66,
  };
  return map[inst.id] ?? 50;
}

// ── LAYER 2: Macro ────────────────────────────────────────
function getMacroScore(inst: Instrument): number {
  const map: Record<string, number> = {
    USOIL: 74, UKOIL: 72, XAUUSD: 76, USDJPY: 72,
    NZDUSD: 68, GBPUSD: 62, SPX500: 65, NAS100: 67,
    EURUSD: 58, XAGUSD: 68, BTCUSD: 55, AUDUSD: 46,
    USDCAD: 64, EURJPY: 70, GBPJPY: 68,
  };
  return map[inst.id] ?? 50;
}

// ── LAYER 3: COT ──────────────────────────────────────────
function getCOTScore(inst: Instrument): number {
  if (inst.cotShort > 60) return Math.min(70 + (inst.cotShort - 60), 88);
  if (inst.cotLong > 60) return Math.max(30 - (inst.cotLong - 60), 15);
  return 50;
}

// ── LAYER 4: Technical ────────────────────────────────────
function getTechScore(inst: Instrument): number {
  const map: Record<string, number> = {
    USOIL: 76, UKOIL: 74, XAUUSD: 71, USDJPY: 66,
    NZDUSD: 64, GBPUSD: 62, SPX500: 63, NAS100: 65,
    EURUSD: 56, XAGUSD: 62, BTCUSD: 54, AUDUSD: 40,
    USDCAD: 60, EURJPY: 64, GBPJPY: 63,
  };
  return map[inst.id] ?? 50;
}

// ── LAYER 5: Retail sentiment ─────────────────────────────
function getRetailScore(inst: Instrument): number {
  if (inst.retailLong > 65) return Math.min(60 + (inst.retailLong - 65), 82);
  if (inst.retailShort > 65) return Math.max(40 - (inst.retailShort - 65), 18);
  return 50;
}

// ── LAYER 6: Institutional ────────────────────────────────
function getInstScore(inst: Instrument): number {
  const map: Record<string, number> = {
    USOIL: 60, UKOIL: 58, XAUUSD: 62, USDJPY: 58,
    NZDUSD: 55, GBPUSD: 52, SPX500: 55, NAS100: 57,
    EURUSD: 55, XAGUSD: 60, BTCUSD: 58, AUDUSD: 42,
    USDCAD: 56, EURJPY: 60, GBPJPY: 58,
  };
  return map[inst.id] ?? 50;
}

// ── LAYER 7: Cross-asset ──────────────────────────────────
function getCrossScore(inst: Instrument): number {
  const map: Record<string, number> = {
    USOIL: 72, UKOIL: 70, XAUUSD: 65, USDJPY: 65,
    NZDUSD: 60, GBPUSD: 50, SPX500: 60, NAS100: 62,
    EURUSD: 50, XAGUSD: 58, BTCUSD: 48, AUDUSD: 40,
    USDCAD: 65, EURJPY: 62, GBPJPY: 60,
  };
  return map[inst.id] ?? 50;
}

// ── LAYER 8: Seasonality ──────────────────────────────────
function getSeasonScore(inst: Instrument): number {
  const month = new Date().getMonth();
  const map: Record<string, number[]> = {
    USOIL:  [55,55,60,60,65,55,55,55,60,60,55,55],
    UKOIL:  [55,55,60,60,65,55,55,55,60,60,55,55],
    XAUUSD: [55,55,60,55,55,52,50,55,60,60,55,60],
    USDJPY: [50,50,50,50,50,50,50,50,50,50,50,50],
    NZDUSD: [48,48,50,50,48,48,48,50,50,50,48,48],
    GBPUSD: [45,45,48,48,45,45,45,48,48,48,45,45],
    SPX500: [55,55,55,55,52,52,50,55,55,55,55,58],
    NAS100: [55,55,55,55,50,50,48,55,55,55,55,58],
    EURUSD: [42,42,45,45,42,42,42,45,45,45,42,42],
    XAGUSD: [50,50,55,55,52,50,48,52,55,55,50,52],
    BTCUSD: [45,45,48,48,45,45,45,48,48,48,45,45],
    AUDUSD: [38,38,40,40,38,38,38,40,40,40,38,38],
    USDCAD: [52,52,50,50,52,55,55,52,50,50,52,52],
    EURJPY: [48,48,50,50,48,48,48,50,50,50,48,48],
    GBPJPY: [46,46,48,48,46,46,46,48,48,48,46,46],
  };
  return (map[inst.id] ?? new Array(12).fill(50))[month];
}

// ── LAYER 9: VIX ──────────────────────────────────────────
function getVIXScore(inst: Instrument): number {
  if (signals.vix > 25) {
    const riskOff = ['XAUUSD', 'USDJPY', 'USDCAD'];
    return riskOff.includes(inst.id) ? 68 : 58;
  }
  if (signals.vix < 15) return inst.bias === 'bull' ? 65 : 40;
  return 52;
}

// ── LAYER 10: Fear & Greed ────────────────────────────────
function getFearGreedScore(inst: Instrument): number {
  if (signals.fearGreed < 25) {
    if (['XAUUSD', 'XAGUSD'].includes(inst.id)) return 45;
    return inst.bias === 'bear' ? 65 : 40;
  }
  if (signals.fearGreed > 75) {
    if (['SPX500', 'NAS100', 'BTCUSD'].includes(inst.id)) return 45;
    return inst.bias === 'bull' ? 65 : 40;
  }
  return 52;
}

// ── LAYER 11: DXY position ────────────────────────────────
function getDXYScore(inst: Instrument): number {
  if (!signals.dxyAbove200EMA) return 50;
  const usdPressure = ['EURUSD', 'GBPUSD', 'AUDUSD', 'NZDUSD', 'XAUUSD', 'XAGUSD', 'EURJPY', 'GBPJPY'];
  const usdSupport = ['USDJPY', 'USDCAD'];
  if (usdPressure.includes(inst.id)) return 68;
  if (usdSupport.includes(inst.id)) return 65;
  return 52;
}

// ── LAYER 12: ETF flows ───────────────────────────────────
function getETFFlowScore(inst: Instrument): number {
  const map: Record<string, number> = {
    XAUUSD: 38, XAGUSD: 42,
    SPX500: 45, NAS100: 43,
    BTCUSD: 48,
  };
  return map[inst.id] ?? 50;
}

// ── LAYER 13: Open interest ───────────────────────────────
function getOpenInterestScore(inst: Instrument): number {
  const map: Record<string, number> = {
    USOIL: 65, UKOIL: 63,
    XAUUSD: 62, XAGUSD: 58,
    SPX500: 55, NAS100: 57,
    BTCUSD: 52,
  };
  return map[inst.id] ?? 50;
}

// ── LAYER 14: Interest rate differentials ─────────────────
function getIRDiffScore(inst: Instrument): number {
  const diff = irDifferentials[inst.id];
  if (diff === undefined) return 50;
  if (diff > 2) return 72;
  if (diff > 1) return 65;
  if (diff > 0) return 58;
  if (diff < -1) return 38;
  if (diff < 0) return 44;
  return 50;
}

// ── FINAL SCORE CALCULATOR ────────────────────────────────
export function calculateScore(inst: Instrument): number {
  const weights = {
    News: 0.18,
    Macro: 0.18,
    COT: 0.14,
    Tech: 0.13,
    Retail: 0.10,
    Inst: 0.09,
    Cross: 0.05,
    Season: 0.03,
    VIX: 0.03,
    FearGreed: 0.02,
    DXY: 0.02,
    ETFFlow: 0.01,
    OpenInt: 0.01,
    IRDiff: 0.01,
  };

  const layers = {
    News: getNewsScore(inst),
    Macro: getMacroScore(inst),
    COT: getCOTScore(inst),
    Tech: getTechScore(inst),
    Retail: getRetailScore(inst),
    Inst: getInstScore(inst),
    Cross: getCrossScore(inst),
    Season: getSeasonScore(inst),
    VIX: getVIXScore(inst),
    FearGreed: getFearGreedScore(inst),
    DXY: getDXYScore(inst),
    ETFFlow: getETFFlowScore(inst),
    OpenInt: getOpenInterestScore(inst),
    IRDiff: getIRDiffScore(inst),
  };

  const baseScore = Object.entries(layers).reduce((total, [key, value]) => {
    return total + value * weights[key as keyof typeof weights];
  }, 0);

  const boosts =
    getVIXBoost(inst.bias) +
    getFearGreedBoost(inst.bias) +
    getDXYBoost(inst.id, inst.bias) +
    getPutCallBoost(inst.bias);

  return Math.min(99, Math.max(1, Math.round(baseScore + boosts)));
}

export function getLayerBreakdown(inst: Instrument): Record<string, number> {
  return {
    News: getNewsScore(inst),
    Macro: getMacroScore(inst),
    COT: getCOTScore(inst),
    Technical: getTechScore(inst),
    Retail: getRetailScore(inst),
    Institutional: getInstScore(inst),
    'Cross-asset': getCrossScore(inst),
    Seasonality: getSeasonScore(inst),
    VIX: getVIXScore(inst),
    'Fear & Greed': getFearGreedScore(inst),
    DXY: getDXYScore(inst),
    'ETF Flows': getETFFlowScore(inst),
    'Open Interest': getOpenInterestScore(inst),
    'IR Differential': getIRDiffScore(inst),
  };
}

export function getScenarioProbabilities(inst: Instrument): {
  bearBase: number;
  bearDeep: number;
  bullRisk: number;
} {
  const score = calculateScore(inst);
  if (score >= 70) return { bearBase: 57, bearDeep: 25, bullRisk: 18 };
  if (score >= 60) return { bearBase: 45, bearDeep: 20, bullRisk: 35 };
  if (score >= 55) return { bearBase: 35, bearDeep: 15, bullRisk: 50 };
  return { bearBase: 20, bearDeep: 10, bullRisk: 70 };
}

export function updateAllScores(instrumentList: Instrument[]): void {
  instrumentList.forEach(inst => {
    inst.score = calculateScore(inst);
    updateAction(inst);
  });
  console.log(`[${new Date().toISOString()}] ✅ 14-layer scores recalculated`);
}

function updateAction(inst: Instrument): void {
  if (inst.score < 55) {
    inst.action = 'skip';
  } else {
    inst.action = 'sell';
  }
}