export const SCANNER_CONFIGURATION_VERSION = "phase3-mvp-v1";

export const scannerThresholds = {
  priceStaleAfterHours: 24,
  targetEntryProximityPercent: 5,
  portfolioConcentrationPercent: 25,
  highSeverityEventCandidateConfidence: 0.7,
  deepAnalysisScore: 75,
  monitorScore: 40,
} as const;

export type PriceState = "missing" | "fresh" | "stale";

export function getScannerPriceState(
  observedAt: Date | null,
  now = new Date(),
): PriceState {
  if (!observedAt) {
    return "missing";
  }

  const staleAfterMs =
    scannerThresholds.priceStaleAfterHours * 60 * 60 * 1000;

  return now.getTime() - observedAt.getTime() > staleAfterMs
    ? "stale"
    : "fresh";
}

export function isNearTargetEntry(input: {
  currentPrice: number;
  targetEntryPrice: number;
  thresholdPercent?: number;
}): boolean {
  const thresholdPercent =
    input.thresholdPercent ?? scannerThresholds.targetEntryProximityPercent;
  const distancePercent =
    ((input.currentPrice - input.targetEntryPrice) / input.targetEntryPrice) *
    100;

  return distancePercent <= thresholdPercent;
}

export function getPortfolioWeightPercent(input: {
  positionValue: number;
  totalPortfolioValue: number;
}): number {
  if (input.totalPortfolioValue <= 0) {
    return 0;
  }

  return (input.positionValue / input.totalPortfolioValue) * 100;
}

export function isHighConcentration(weightPercent: number): boolean {
  return weightPercent >= scannerThresholds.portfolioConcentrationPercent;
}
