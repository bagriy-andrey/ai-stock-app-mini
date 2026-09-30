import { describe, expect, it } from "vitest";
import {
  getPortfolioWeightPercent,
  getScannerPriceState,
  isHighConcentration,
  isNearTargetEntry,
} from "@/lib/scanners/thresholds";

describe("scanner thresholds", () => {
  it("classifies missing, fresh, and stale latest prices", () => {
    const now = new Date("2026-09-29T12:00:00.000Z");

    expect(getScannerPriceState(null, now)).toBe("missing");
    expect(getScannerPriceState(new Date("2026-09-29T00:30:00.000Z"), now)).toBe(
      "fresh",
    );
    expect(getScannerPriceState(new Date("2026-09-27T12:00:00.000Z"), now)).toBe(
      "stale",
    );
  });

  it("detects target-entry proximity within the default threshold", () => {
    expect(
      isNearTargetEntry({
        currentPrice: 104,
        targetEntryPrice: 100,
      }),
    ).toBe(true);
    expect(
      isNearTargetEntry({
        currentPrice: 107,
        targetEntryPrice: 100,
      }),
    ).toBe(false);
  });

  it("detects portfolio concentration at the configured threshold", () => {
    const weight = getPortfolioWeightPercent({
      positionValue: 30,
      totalPortfolioValue: 100,
    });

    expect(weight).toBe(30);
    expect(isHighConcentration(weight)).toBe(true);
  });
});
