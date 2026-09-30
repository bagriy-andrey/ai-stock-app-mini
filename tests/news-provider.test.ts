import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchFmpNewsEvents,
  fetchProviderNewsEvents,
  fetchTiingoNewsEvents,
} from "@/lib/scanners/news-provider";

const asset = {
  id: "asset_aapl",
  symbol: "AAPL",
  name: "Apple Inc.",
  assetType: "STOCK" as const,
  sector: "Technology",
  region: "US",
  providerSymbol: "AAPL",
};

describe("news providers", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("normalizes Tiingo news as the primary provider", async () => {
    vi.stubEnv("TIINGO_API_KEY", "tiingo-key");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json([
          {
            id: 1,
            title: "Apple raises guidance after strong demand",
            url: "https://example.com/aapl-guidance",
            source: "example.com",
            publishedDate: "2026-09-29T10:00:00.000Z",
            description: "Apple raises guidance after strong demand.",
            tickers: ["aapl"],
            tags: ["guidance"],
          },
        ]),
      ),
    );

    const { events, diagnostics } = await fetchTiingoNewsEvents([asset]);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      affectedAssetId: "asset_aapl",
      eventType: "guidance_raise",
      sourceProvider: "tiingo",
    });
    expect(diagnostics).toMatchObject({
      provider: "tiingo",
      configured: true,
      rawItemCount: 1,
      normalizedEventCount: 1,
    });
  });

  it("uses Tiingo first and does not call FMP when Tiingo returns events", async () => {
    vi.stubEnv("TIINGO_API_KEY", "tiingo-key");
    vi.stubEnv("FMP_API_KEY", "fmp-key");
    const fetchMock = vi.fn(async () =>
      Response.json([
        {
          id: 1,
          title: "Apple launches new product",
          url: "https://example.com/aapl-product",
          publishedDate: "2026-09-29T10:00:00.000Z",
          tickers: ["AAPL"],
        },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchProviderNewsEvents([asset]);

    expect(result.selectedProvider).toBe("tiingo");
    expect(result.events).toHaveLength(1);
    expect(result.diagnostics.map((item) => item.provider)).toEqual(["tiingo"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("falls back to FMP when Tiingo returns no events", async () => {
    vi.stubEnv("TIINGO_API_KEY", "tiingo-key");
    vi.stubEnv("FMP_API_KEY", "fmp-key");
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("api.tiingo.com")) {
        return Response.json([]);
      }

      if (url.includes("/api/v3/stock_news")) {
        return Response.json([]);
      }

      return Response.json([
        {
          symbol: "AAPL",
          publishedDate: "2026-09-29T10:00:00.000Z",
          title: "Apple raises guidance after strong demand",
          url: "https://example.com/aapl-guidance",
          text: "Apple raises guidance after strong demand.",
        },
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchProviderNewsEvents([asset]);

    expect(result.selectedProvider).toBe("fmp");
    expect(result.events).toHaveLength(1);
    expect(result.diagnostics.map((item) => item.provider)).toEqual([
      "tiingo",
      "fmp",
    ]);
  });

  it("falls back to the FMP stable endpoint when the legacy endpoint is empty", async () => {
    vi.stubEnv("FMP_API_KEY", "test-key");
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/api/v3/stock_news")) {
        return Response.json([]);
      }

      return Response.json([
        {
          symbol: "AAPL",
          publishedDate: "2026-09-29T10:00:00.000Z",
          title: "Apple raises guidance after strong demand",
          url: "https://example.com/aapl-guidance",
          text: "Apple raises guidance after strong demand.",
        },
      ]);
    });
    vi.stubGlobal("fetch", fetchMock);

    const events = await fetchFmpNewsEvents([asset]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      affectedAssetId: "asset_aapl",
      eventType: "guidance_raise",
      sourceProvider: "fmp",
    });
  });
});
