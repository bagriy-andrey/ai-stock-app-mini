import type { AgentDefinition } from "@/lib/analysis/types";

export const phase2AgentDefinitions: AgentDefinition[] = [
  {
    name: "market_analyst",
    role: "Market Analyst",
    modelTier: "cheap",
    stanceHint: "NEUTRAL",
  },
  {
    name: "fundamentals_asset_quality_analyst",
    role: "Fundamentals / Asset Quality Analyst",
    modelTier: "standard",
    stanceHint: "NEUTRAL",
  },
  {
    name: "news_sentiment_analyst",
    role: "News / Sentiment Analyst",
    modelTier: "cheap",
    stanceHint: "NEUTRAL",
  },
  {
    name: "bull_researcher",
    role: "Bull Researcher",
    modelTier: "standard",
    stanceHint: "BULLISH",
  },
  {
    name: "bear_researcher",
    role: "Bear Researcher",
    modelTier: "standard",
    stanceHint: "BEARISH",
  },
  {
    name: "research_manager",
    role: "Research Manager",
    modelTier: "strong",
    stanceHint: "MIXED",
  },
  {
    name: "risk_analyst",
    role: "Risk Analyst",
    modelTier: "standard",
    stanceHint: "MIXED",
  },
  {
    name: "portfolio_manager",
    role: "Portfolio Manager",
    modelTier: "strong",
    stanceHint: "MIXED",
  },
];

export function buildAgentSystemPrompt(definition: AgentDefinition): string {
  return [
    `You are the ${definition.role} in an advisory-only AI investment assistant.`,
    "Use only the supplied application snapshot and previous agent summaries.",
    "Do not invent recent news, prices, fundamentals, or brokerage actions.",
    "Separate long-term investing logic from tactical/speculative logic.",
    "The real portfolio is advisory-only. Never imply that an order will be executed.",
    "Return strict JSON only, with no markdown fences.",
  ].join(" ");
}

export function buildAgentUserPrompt(input: {
  definition: AgentDefinition;
  snapshotJson: string;
  previousOutputsJson: string;
}): string {
  if (input.definition.name === "portfolio_manager") {
    return [
      "Create the final portfolio-aware report for the asset.",
      "Return JSON with this exact shape:",
      '{"title":"string","summary":"string","recommendationLabel":"BUY_MORE|HOLD|WATCH|REDUCE|AVOID|NO_ACTION","confidence":0.65,"riskLevel":"LOW|MEDIUM|HIGH|UNKNOWN","timeHorizon":"string","thesis":["string"],"opportunities":["string"],"risks":["string"],"portfolioFit":"string","missingDataWarnings":["string"]}',
      "Recommendation labels are advisory-only and must not map to trade execution.",
      `Input snapshot: ${input.snapshotJson}`,
      `Previous agent outputs: ${input.previousOutputsJson}`,
    ].join("\n\n");
  }

  return [
    `Act as ${input.definition.role}.`,
    `Expected stance perspective: ${input.definition.stanceHint}.`,
    "Return JSON with this exact shape:",
    '{"summary":"string","stance":"BULLISH|BEARISH|NEUTRAL|MIXED","confidence":0.65,"keyPoints":["string"],"missingDataWarnings":["string"]}',
    "If durable news or fundamentals are missing, say so explicitly.",
    `Input snapshot: ${input.snapshotJson}`,
    `Previous agent outputs: ${input.previousOutputsJson}`,
  ].join("\n\n");
}
