import { describe, expect, it } from "vitest";
import {
  calculateCandidateScore,
  getCandidateAction,
  rankCandidates,
} from "@/lib/scanners/ranking";

describe("scanner candidate ranking", () => {
  it("orders candidates by score descending", () => {
    const ranked = rankCandidates([
      { id: "low", score: 12 },
      { id: "high", score: 88 },
      { id: "medium", score: 42 },
    ]);

    expect(ranked.map((item) => item.id)).toEqual(["high", "medium", "low"]);
  });

  it("promotes high severity confident portfolio signals", () => {
    const score = calculateCandidateScore({
      severity: "CRITICAL",
      confidence: 0.95,
      portfolioRelevance: 1,
      eventRecency: 1,
    });

    expect(score).toBeGreaterThanOrEqual(75);
    expect(getCandidateAction({ score })).toBe("RUN_DEEP_ANALYSIS");
  });

  it("uses add-to-watchlist for opportunity candidates above monitor threshold", () => {
    expect(
      getCandidateAction({
        score: 45,
        isOpportunity: true,
      }),
    ).toBe("ADD_TO_WATCHLIST");
  });

  it("marks missing-data candidates as insufficient even when score is high", () => {
    expect(
      getCandidateAction({
        score: 90,
        hasSufficientData: false,
      }),
    ).toBe("INSUFFICIENT_DATA");
  });
});
