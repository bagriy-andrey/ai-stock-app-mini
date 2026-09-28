"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  clearModelTierSetting,
  listOpenRouterModels,
  updateModelTierSetting,
} from "@/lib/model-router/settings";

const modelTierSchema = z.enum(["cheap", "standard", "strong"]);

const updateModelTierFormSchema = z.object({
  tier: modelTierSchema,
  modelId: z.string().optional().default(""),
});

export async function updateModelTier(formData: FormData) {
  const input = updateModelTierFormSchema.parse(Object.fromEntries(formData));

  if (!input.modelId) {
    await clearModelTierSetting(input.tier);
    revalidatePath("/settings/models");
    return;
  }

  const models = await listOpenRouterModels();
  const model = models.find((item) => item.id === input.modelId);

  if (!model) {
    throw new Error(`OpenRouter model not found: ${input.modelId}`);
  }

  await updateModelTierSetting({
    tier: input.tier,
    model,
  });

  revalidatePath("/settings/models");
}
