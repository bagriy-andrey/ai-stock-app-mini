import { describe, expect, it } from "vitest";
import {
  calculateModelUsageCost,
  estimateModelCallCost,
  formatPricePerMillionTokens,
  formatUsd,
} from "@/lib/model-router/pricing";

describe("OpenRouter model pricing helpers", () => {
  it("estimates one model call from per-token OpenRouter prices", () => {
    expect(
      estimateModelCallCost({
        pricing: {
          prompt: "0.000001",
          completion: "0.000002",
          request: "0",
        },
      }),
    ).toBeCloseTo(0.0078);
  });

  it("formats per-token prices as per-million-token labels", () => {
    expect(formatPricePerMillionTokens("0.000001")).toBe("$1.0000");
    expect(formatPricePerMillionTokens(undefined)).toBe("N/A");
  });

  it("formats tiny estimated costs without rounding to zero", () => {
    expect(formatUsd(0.00001)).toBe("<$0.0001");
  });

  it("calculates actual usage cost from recorded tokens", () => {
    expect(
      calculateModelUsageCost({
        promptPrice: "0.000001",
        completionPrice: "0.000002",
        requestPrice: "0",
        inputTokens: 1000,
        outputTokens: 500,
      }),
    ).toBeCloseTo(0.002);
  });
});
