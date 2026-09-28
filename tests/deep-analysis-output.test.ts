import { describe, expect, it } from "vitest";
import { parseJsonObject } from "@/lib/analysis/json";
import {
  agentOutputSchema,
  finalReportSchema,
} from "@/lib/analysis/types";

describe("Deep analysis output validation", () => {
  it("accepts the Phase 2 final report contract", () => {
    const report = finalReportSchema.parse({
      title: "NVDA long-term portfolio review",
      summary: "High-quality asset with valuation and concentration risks.",
      recommendationLabel: "HOLD",
      confidence: 0.68,
      riskLevel: "MEDIUM",
      timeHorizon: "long-term",
      thesis: ["Durable demand drivers remain plausible."],
      opportunities: ["AI infrastructure growth could support earnings."],
      risks: ["Valuation leaves limited margin of safety."],
      portfolioFit: "Fits as a growth allocation if position size is controlled.",
      missingDataWarnings: ["No durable news provider is integrated."],
    });

    expect(report.recommendationLabel).toBe("HOLD");
  });

  it("rejects invalid confidence and executable recommendation labels", () => {
    expect(() =>
      finalReportSchema.parse({
        title: "Invalid report",
        summary: "Invalid report",
        recommendationLabel: "EXECUTE_BUY",
        confidence: 1.3,
        riskLevel: "MEDIUM",
        timeHorizon: "tactical",
        thesis: [],
        opportunities: [],
        risks: [],
        portfolioFit: "Invalid",
        missingDataWarnings: [],
      }),
    ).toThrow();
  });

  it("accepts compact agent reasoning summaries", () => {
    const output = agentOutputSchema.parse({
      summary: "Market data is stale, so trend conclusions are limited.",
      stance: "MIXED",
      confidence: 0.45,
      keyPoints: ["Price snapshot needs refresh."],
      missingDataWarnings: ["Latest price snapshot is stale."],
    });

    expect(output.stance).toBe("MIXED");
  });

  it("parses JSON from plain or fenced model-style text", () => {
    expect(parseJsonObject('{"summary":"ok"}')).toEqual({ summary: "ok" });
    expect(parseJsonObject('```json\n{"summary":"ok"}\n```')).toEqual({
      summary: "ok",
    });
  });
});
