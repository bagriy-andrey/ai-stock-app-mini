import { describe, expect, it } from "vitest";
import { ModelRouter } from "@/lib/model-router/model-router";
import type { ModelTierConfig } from "@/lib/model-router/types";

const config: Record<"cheap" | "standard" | "strong", ModelTierConfig> = {
  cheap: {
    tier: "cheap",
    primaryModel: "provider/cheap",
    fallbackModels: ["provider/cheap-fallback"],
  },
  standard: {
    tier: "standard",
    primaryModel: "provider/standard",
    fallbackModels: [],
  },
  strong: {
    tier: "strong",
    primaryModel: "provider/strong",
    fallbackModels: ["provider/strong-fallback", "provider/standard"],
  },
};

describe("ModelRouter", () => {
  it("resolves a tier to primary and fallback models", () => {
    const router = new ModelRouter(config);

    expect(router.resolve("strong")).toEqual({
      tier: "strong",
      models: [
        "provider/strong",
        "provider/strong-fallback",
        "provider/standard",
      ],
    });
  });

  it("rejects tiers without configured models", () => {
    const router = new ModelRouter({
      ...config,
      cheap: {
        tier: "cheap",
        primaryModel: "",
        fallbackModels: [],
      },
    });

    expect(() => router.resolve("cheap")).toThrow(
      "No models configured for tier: cheap",
    );
  });
});
