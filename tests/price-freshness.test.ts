import { describe, expect, it } from "vitest";
import { getPriceFreshness } from "@/lib/market-data/price-freshness";

describe("price freshness", () => {
  const now = new Date("2026-09-28T12:00:00.000Z");

  it("marks missing prices", () => {
    expect(getPriceFreshness(null, now)).toBe("missing");
  });

  it("marks recent prices as fresh", () => {
    expect(
      getPriceFreshness(
        {
          observedAt: new Date("2026-09-28T08:00:00.000Z"),
        },
        now,
      ),
    ).toBe("fresh");
  });

  it("marks prices older than 24 hours as stale", () => {
    expect(
      getPriceFreshness(
        {
          observedAt: new Date("2026-09-27T11:59:59.000Z"),
        },
        now,
      ),
    ).toBe("stale");
  });
});
