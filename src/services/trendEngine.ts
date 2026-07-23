export interface TrendInput {
    ema20: number;
    ema50: number;
    ema200: number;

    adx14: number;

    rsi14: number;

    macd: number;
    macdSignal: number;
}

export interface TrendResult {

    direction:
        | "Strong Bullish"
        | "Bullish"
        | "Weak Bullish"
        | "Sideways"
        | "Weak Bearish"
        | "Bearish"
        | "Strong Bearish";

    strength: number;

    confidence: number;

    reason: string;

}

export function analyzeTrend(
    indicator: TrendInput
): TrendResult {

    let score = 0;

    const reasons: string[] = [];

    // ------------------------
    // EMA Alignment
    // ------------------------

    if (indicator.ema20 > indicator.ema50) {

        score += 20;

        reasons.push("EMA20 > EMA50");

    }

    if (indicator.ema50 > indicator.ema200) {

        score += 20;

        reasons.push("EMA50 > EMA200");

    }

    if (indicator.ema20 < indicator.ema50) {

        score -= 20;

        reasons.push("EMA20 < EMA50");

    }

    if (indicator.ema50 < indicator.ema200) {

        score -= 20;

        reasons.push("EMA50 < EMA200");

    }

    // ------------------------
    // ADX
    // ------------------------

    if (indicator.adx14 >= 35) {

        score += score >= 0 ? 20 : -20;

        reasons.push("Strong ADX");

    }

    else if (indicator.adx14 >= 25) {

        score += score >= 0 ? 10 : -10;

        reasons.push("Moderate ADX");

    }

    else {

        reasons.push("Weak Trend");

    }

    // ------------------------
    // RSI
    // ------------------------

    if (indicator.rsi14 > 60) {

        score += 10;

        reasons.push("RSI Bullish");

    }

    if (indicator.rsi14 < 40) {

        score -= 10;

        reasons.push("RSI Bearish");

    }

    // ------------------------
    // MACD
    // ------------------------

    if (indicator.macd > indicator.macdSignal) {

        score += 10;

        reasons.push("MACD Bullish");

    }

    if (indicator.macd < indicator.macdSignal) {

        score -= 10;

        reasons.push("MACD Bearish");

    }

    let direction: TrendResult["direction"];

    if (score >= 60)
        direction = "Strong Bullish";

    else if (score >= 30)
        direction = "Bullish";

    else if (score >= 10)
        direction = "Weak Bullish";

    else if (score <= -60)
        direction = "Strong Bearish";

    else if (score <= -30)
        direction = "Bearish";

    else if (score <= -10)
        direction = "Weak Bearish";

    else
        direction = "Sideways";

    return {

        direction,

        strength: Math.abs(score),

        confidence: Math.min(100, Math.abs(score)),

        reason: reasons.join(", ")

    };

}