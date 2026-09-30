import { z } from "zod";
import type { InvestmentIntent } from "@prisma/client";
import type { ModelTier } from "@/lib/model-router/types";

export const analysisPromptVersion = "phase2-deep-analysis-v1";

export type AnalysisSource = "portfolio" | "watchlist" | "scanner";

export type AnalysisStartInput = {
  source: AnalysisSource;
  positionId?: string;
  watchlistItemId?: string;
  scannerSignalId?: string;
};

export type AnalysisAgentName =
  | "market_analyst"
  | "fundamentals_asset_quality_analyst"
  | "news_sentiment_analyst"
  | "bull_researcher"
  | "bear_researcher"
  | "research_manager"
  | "risk_analyst"
  | "portfolio_manager";

export type AgentDefinition = {
  name: AnalysisAgentName;
  role: string;
  modelTier: ModelTier;
  stanceHint: "BULLISH" | "BEARISH" | "NEUTRAL" | "MIXED";
};

export type AnalysisInputSnapshot = {
  schemaVersion: "phase2.input-snapshot.v1";
  createdAt: string;
  requestedIntent: InvestmentIntent;
  source: AnalysisSource;
  asset: {
    id: string;
    symbol: string;
    name: string;
    assetType: string;
    currency: string;
    exchange: string | null;
    provider: string;
    providerSymbol: string;
    sector: string | null;
    region: string | null;
  };
  latestPrice: {
    price: number;
    currency: string;
    provider: string;
    providerSymbol: string;
    observedAt: string;
    ingestedAt: string;
    freshness: "fresh" | "stale" | "missing";
  } | null;
  portfolio: {
    id: string;
    name: string;
    baseCurrency: string;
    cashBalances: Array<{
      platform: string;
      currency: string;
      amount: number;
    }>;
  } | null;
  position: {
    id: string;
    quantity: number;
    averageCost: number;
    costCurrency: string;
    investmentIntent: InvestmentIntent;
    notes: string | null;
    openedAt: string | null;
    platformHoldings: Array<{
      platform: string;
      quantity: number;
      averageCost: number;
      costCurrency: string;
      openedAt: string | null;
      notes: string | null;
    }>;
  } | null;
  watchlistItem: {
    id: string;
    investmentIntent: InvestmentIntent;
    priority: string;
    targetEntryPrice: number | null;
    notes: string | null;
  } | null;
  scannerContext?: {
    scannerSignalId: string;
    scannerRunId: string;
    scannerType: string;
    signalType: string;
    severity: string;
    direction: string;
    score: number;
    confidence: number;
    title: string;
    summary: string;
    suggestedAction: string;
    reasons: unknown;
    risks: unknown;
    sourceRefs: unknown;
    dataFreshness: unknown;
    marketEvents: Array<{
      id: string;
      eventType: string;
      occurredAt: string;
      sourceProvider: string;
      sourceTitle: string;
      sourceUrl: string | null;
      severity: string;
      direction: string;
      confidence: number;
      summary: string;
    }>;
  };
  providerProvenance: string[];
  missingDataWarnings: string[];
};

export const agentOutputSchema = z.object({
  summary: z.string().min(1),
  stance: z.enum(["BULLISH", "BEARISH", "NEUTRAL", "MIXED"]),
  confidence: z.number().min(0).max(1),
  keyPoints: z.array(z.string()).default([]),
  missingDataWarnings: z.array(z.string()).default([]),
});

export type AgentOutput = z.infer<typeof agentOutputSchema>;

export const finalReportSchema = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  recommendationLabel: z.enum([
    "BUY_MORE",
    "HOLD",
    "WATCH",
    "REDUCE",
    "AVOID",
    "NO_ACTION",
  ]),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "UNKNOWN"]),
  timeHorizon: z.string().min(1),
  thesis: z.array(z.string()).default([]),
  opportunities: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  portfolioFit: z.string().min(1),
  missingDataWarnings: z.array(z.string()).default([]),
});

export type FinalReportOutput = z.infer<typeof finalReportSchema>;

export type AgentExecutionResult = {
  definition: AgentDefinition;
  output: AgentOutput;
  model: string;
  rawOutput: unknown;
};
