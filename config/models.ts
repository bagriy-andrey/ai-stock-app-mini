import { env } from "@/config/env";
import type { ModelTier, ModelTierConfig } from "@/lib/model-router/types";

export const modelTierConfig: Record<ModelTier, ModelTierConfig> = {
  cheap: {
    tier: "cheap",
    primaryModel: env.OPENROUTER_MODEL_CHEAP,
    fallbackModels: [],
  },
  standard: {
    tier: "standard",
    primaryModel: env.OPENROUTER_MODEL_STANDARD,
    fallbackModels: [],
  },
  strong: {
    tier: "strong",
    primaryModel: env.OPENROUTER_MODEL_STRONG,
    fallbackModels: [],
  },
};
