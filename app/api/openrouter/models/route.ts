import { NextResponse } from "next/server";
import { listOpenRouterModels } from "@/lib/model-router/settings";
import {
  estimateModelCallCost,
  formatPricePerMillionTokens,
  formatUsd,
} from "@/lib/model-router/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const models = await listOpenRouterModels();

    return NextResponse.json({
      models: models.map((model) => ({
        id: model.id,
        name: model.name,
        contextLength: model.context_length ?? null,
        estimatedCallCost: estimateModelCallCost(model),
        estimatedCallCostLabel: formatUsd(estimateModelCallCost(model)),
        promptPricePerMillionLabel: formatPricePerMillionTokens(
          model.pricing?.prompt,
        ),
        completionPricePerMillionLabel: formatPricePerMillionTokens(
          model.pricing?.completion,
        ),
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
