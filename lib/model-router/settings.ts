import { modelTierConfig as envModelTierConfig } from "@/config/models";
import { prisma } from "@/lib/db/prisma";
import type { OpenRouterModel } from "@/lib/model-router/openrouter-client";
import { OpenRouterClient } from "@/lib/model-router/openrouter-client";
import type { ModelTier, ModelTierConfig } from "@/lib/model-router/types";
import { parseTokenPrice } from "@/lib/model-router/pricing";

export const modelTiers: ModelTier[] = ["cheap", "standard", "strong"];

export async function getConfiguredModelTierConfig(): Promise<
  Record<ModelTier, ModelTierConfig>
> {
  const settings = await prisma.aiModelTierSetting.findMany();
  const byTier = new Map(settings.map((setting) => [setting.tier, setting]));

  return {
    cheap: toTierConfig("cheap", byTier.get("cheap")?.primaryModel),
    standard: toTierConfig("standard", byTier.get("standard")?.primaryModel),
    strong: toTierConfig("strong", byTier.get("strong")?.primaryModel),
  };
}

export async function getModelTierSettings() {
  const settings = await prisma.aiModelTierSetting.findMany();
  const byTier = new Map(settings.map((setting) => [setting.tier, setting]));

  return modelTiers.map((tier) => ({
    tier,
    envModel: envModelTierConfig[tier].primaryModel,
    selectedModel:
      byTier.get(tier)?.primaryModel || envModelTierConfig[tier].primaryModel,
    selectedModelName: byTier.get(tier)?.modelName ?? null,
  }));
}

export async function updateModelTierSetting(input: {
  tier: ModelTier;
  model: OpenRouterModel;
}) {
  await prisma.aiModelTierSetting.upsert({
    where: {
      tier: input.tier,
    },
    create: {
      tier: input.tier,
      primaryModel: input.model.id,
      modelName: input.model.name,
      promptPrice: parseTokenPrice(input.model.pricing?.prompt),
      completionPrice: parseTokenPrice(input.model.pricing?.completion),
      requestPrice: parseTokenPrice(input.model.pricing?.request),
    },
    update: {
      primaryModel: input.model.id,
      modelName: input.model.name,
      promptPrice: parseTokenPrice(input.model.pricing?.prompt),
      completionPrice: parseTokenPrice(input.model.pricing?.completion),
      requestPrice: parseTokenPrice(input.model.pricing?.request),
    },
  });
}

export async function clearModelTierSetting(tier: ModelTier) {
  await prisma.aiModelTierSetting.deleteMany({
    where: {
      tier,
    },
  });
}

export async function listOpenRouterModels() {
  const client = new OpenRouterClient();

  return client.listModels();
}

function toTierConfig(
  tier: ModelTier,
  configuredModel: string | undefined,
): ModelTierConfig {
  return {
    tier,
    primaryModel: configuredModel || envModelTierConfig[tier].primaryModel,
    fallbackModels: envModelTierConfig[tier].fallbackModels,
  };
}
