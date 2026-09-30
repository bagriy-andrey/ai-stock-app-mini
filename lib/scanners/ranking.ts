import { scannerThresholds } from "@/lib/scanners/thresholds";

export type ScannerSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type ScannerDirection =
  | "POSITIVE"
  | "NEGATIVE"
  | "MIXED"
  | "NEUTRAL"
  | "UNKNOWN";
export type CandidateAction =
  | "RUN_DEEP_ANALYSIS"
  | "MONITOR"
  | "ADD_TO_WATCHLIST"
  | "IGNORE_FOR_NOW"
  | "INSUFFICIENT_DATA";

export type ScoreInput = {
  severity: ScannerSeverity;
  confidence: number;
  portfolioRelevance?: number;
  watchlistPriority?: number;
  opportunity?: number;
  eventRecency?: number;
  dataFreshnessPenalty?: number;
  duplicatePenalty?: number;
  recentAnalysisPenalty?: number;
};

const severityScores: Record<ScannerSeverity, number> = {
  LOW: 20,
  MEDIUM: 45,
  HIGH: 70,
  CRITICAL: 90,
};

export function calculateCandidateScore(input: ScoreInput): number {
  const score =
    severityScores[input.severity] * 0.42 +
    clamp01(input.confidence) * 100 * 0.2 +
    clamp01(input.portfolioRelevance ?? 0) * 100 * 0.14 +
    clamp01(input.watchlistPriority ?? 0) * 100 * 0.08 +
    clamp01(input.opportunity ?? 0) * 100 * 0.1 +
    clamp01(input.eventRecency ?? 0) * 100 * 0.06 -
    clamp01(input.dataFreshnessPenalty ?? 0) * 25 -
    clamp01(input.duplicatePenalty ?? 0) * 20 -
    clamp01(input.recentAnalysisPenalty ?? 0) * 15;

  return roundScore(Math.max(0, Math.min(100, score)));
}

export function getCandidateAction(input: {
  score: number;
  isOpportunity?: boolean;
  hasSufficientData?: boolean;
}): CandidateAction {
  if (input.hasSufficientData === false) {
    return "INSUFFICIENT_DATA";
  }

  if (input.isOpportunity && input.score >= scannerThresholds.monitorScore) {
    return "ADD_TO_WATCHLIST";
  }

  if (input.score >= scannerThresholds.deepAnalysisScore) {
    return "RUN_DEEP_ANALYSIS";
  }

  if (input.score >= scannerThresholds.monitorScore) {
    return "MONITOR";
  }

  return "IGNORE_FOR_NOW";
}

export function rankCandidates<T extends { score: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.score - a.score);
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(1, value));
}

function roundScore(value: number): number {
  return Math.round(value * 100) / 100;
}
