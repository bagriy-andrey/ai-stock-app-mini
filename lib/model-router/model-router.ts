import type { ModelRoute, ModelTier, ModelTierConfig } from "./types";

export class ModelRouter {
  constructor(private readonly config: Record<ModelTier, ModelTierConfig>) {}

  resolve(tier: ModelTier): ModelRoute {
    const route = this.config[tier];
    const models = [route.primaryModel, ...route.fallbackModels].filter(Boolean);

    if (models.length === 0) {
      throw new Error(`No models configured for tier: ${tier}`);
    }

    return {
      tier,
      models,
    };
  }
}
