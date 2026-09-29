import { buildAgentSystemPrompt, buildAgentUserPrompt, phase2AgentDefinitions } from "@/lib/analysis/agents";
import { parseJsonObject } from "@/lib/analysis/json";
import {
  createAgentRun,
  markAgentRunFailed,
  markAgentRunRunning,
  persistSuccessfulAnalysis,
} from "@/lib/analysis/repository";
import {
  agentOutputSchema,
  finalReportSchema,
  type AgentExecutionResult,
  type AgentOutput,
  type AnalysisStartInput,
  type FinalReportOutput,
} from "@/lib/analysis/types";
import { buildAnalysisInputSnapshot } from "@/lib/analysis/context-builder";
import { prisma } from "@/lib/db/prisma";
import { ModelRouter } from "@/lib/model-router/model-router";
import { OpenRouterClient } from "@/lib/model-router/openrouter-client";
import { getConfiguredModelTierConfig } from "@/lib/model-router/settings";
import { calculateModelUsageCost } from "@/lib/model-router/pricing";
import type {
  ChatCompletionResponse,
  ModelTier,
} from "@/lib/model-router/types";

type ChatClient = Pick<OpenRouterClient, "createChatCompletion"> &
  Partial<Pick<OpenRouterClient, "listModels">>;

export async function startDeepAnalysis(input: AnalysisStartInput): Promise<{
  agentRunId: string;
  status: "SUCCEEDED" | "FAILED";
}> {
  const snapshot = await buildAnalysisInputSnapshot(input);
  const agentRun = await createAgentRun({ snapshot });
  const router = new ModelRouter(await getConfiguredModelTierConfig());
  const client = new OpenRouterClient();

  try {
    await runDeepAnalysis({
      agentRunId: agentRun.id,
      client,
      router,
      snapshot,
    });

    return {
      agentRunId: agentRun.id,
      status: "SUCCEEDED",
    };
  } catch (error) {
    await markAgentRunFailed({
      agentRunId: agentRun.id,
      errorMessage: getErrorMessage(error),
    });

    return {
      agentRunId: agentRun.id,
      status: "FAILED",
    };
  }
}

export async function runDeepAnalysis(input: {
  agentRunId: string;
  client: ChatClient;
  router: ModelRouter;
  snapshot: Awaited<ReturnType<typeof buildAnalysisInputSnapshot>>;
}) {
  await markAgentRunRunning(input.agentRunId);

  const agentResults: AgentExecutionResult[] = [];
  const snapshotJson = JSON.stringify(input.snapshot);

  for (const definition of phase2AgentDefinitions) {
    const previousOutputsJson = JSON.stringify(
      agentResults.map((result) => ({
        agentName: result.definition.name,
        role: result.definition.role,
        output: result.output,
      })),
    );
    const response = await callModelWithFallback({
      agent: definition.name,
      agentRunId: input.agentRunId,
      client: input.client,
      messages: [
        {
          role: "system",
          content: buildAgentSystemPrompt(definition),
        },
        {
          role: "user",
          content: buildAgentUserPrompt({
            definition,
            previousOutputsJson,
            snapshotJson,
          }),
        },
      ],
      modelTier: definition.modelTier,
      router: input.router,
      ticker: input.snapshot.asset.symbol,
    });

    if (definition.name === "portfolio_manager") {
      const { finalReport, rawOutput } = parseFinalReportResponse({
        content: response.content,
        snapshot: input.snapshot,
      });
      const finalAgentOutput: AgentOutput = {
        confidence: finalReport.confidence,
        keyPoints: finalReport.thesis,
        missingDataWarnings: finalReport.missingDataWarnings,
        stance: mapRecommendationToStance(finalReport.recommendationLabel),
        summary: finalReport.summary,
      };

      agentResults.push({
        definition,
        model: response.model,
        output: finalAgentOutput,
        rawOutput,
      });

      await persistSuccessfulAnalysis({
        agentRunId: input.agentRunId,
        agentResults,
        assetId: input.snapshot.asset.id,
        finalReport,
        rawFinalOutput: rawOutput,
      });

      return;
    }

    const { output, rawOutput } = parseAgentResponse({
      content: response.content,
      stanceHint: definition.stanceHint,
    });

    agentResults.push({
      definition,
      model: response.model,
      output,
      rawOutput,
    });
  }

  throw new Error("Deep analysis ended before Portfolio Manager output.");
}

async function callModelWithFallback(input: {
  agent: string;
  agentRunId: string;
  client: ChatClient;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  modelTier: ModelTier;
  router: ModelRouter;
  ticker: string;
}): Promise<ChatCompletionResponse> {
  const route = input.router.resolve(input.modelTier);
  let lastError: unknown = null;

  for (const model of route.models) {
    const startedAt = Date.now();

    try {
      const response = await input.client.createChatCompletion({
        model,
        messages: input.messages,
        response_format: {
          type: "json_object",
        },
        temperature: 0.2,
      });
      const latencyMs = Date.now() - startedAt;
      const modelName = response.model || model;
      const cost = await getUsageCost({
        client: input.client,
        model: modelName,
        inputTokens: response.inputTokens,
        outputTokens: response.outputTokens,
      });

      await prisma.aiUsageRecord.create({
        data: {
          agentRunId: input.agentRunId,
          agent: input.agent,
          ticker: input.ticker,
          model: modelName,
          modelTier: input.modelTier,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
          cost,
          latencyMs,
          status: "SUCCESS",
        },
      });

      return response;
    } catch (error) {
      lastError = error;

      await prisma.aiUsageRecord.create({
        data: {
          agentRunId: input.agentRunId,
          agent: input.agent,
          ticker: input.ticker,
          model,
          modelTier: input.modelTier,
          latencyMs: Date.now() - startedAt,
          status: "ERROR",
          errorMessage: getErrorMessage(error),
        },
      });
    }
  }

  throw new Error(
    `All models failed for ${input.agent} (${input.modelTier}). Last error: ${getErrorMessage(
      lastError,
    )}`,
  );
}

function parseAgentResponse(input: {
  content: string;
  stanceHint: AgentOutput["stance"];
}): {
  output: AgentOutput;
  rawOutput: unknown;
} {
  try {
    const rawOutput = parseJsonObject(input.content);
    const parsedOutput = agentOutputSchema.safeParse(rawOutput);

    if (parsedOutput.success) {
      return {
        output: parsedOutput.data,
        rawOutput,
      };
    }

    return buildFallbackAgentOutput({
      content: input.content,
      errorMessage: parsedOutput.error.message,
      stanceHint: input.stanceHint,
    });
  } catch (error) {
    return buildFallbackAgentOutput({
      content: input.content,
      errorMessage: getErrorMessage(error),
      stanceHint: input.stanceHint,
    });
  }
}

function buildFallbackAgentOutput(input: {
  content: string;
  errorMessage: string;
  stanceHint: AgentOutput["stance"];
}): {
  output: AgentOutput;
  rawOutput: unknown;
} {
  const summary = truncateText(stripJsonFence(input.content), 900);

  return {
    output: {
      confidence: 0.2,
      keyPoints: [],
      missingDataWarnings: [
        `Agent returned malformed structured output: ${input.errorMessage}`,
      ],
      stance: input.stanceHint,
      summary:
        summary ||
        `Agent returned malformed structured output: ${input.errorMessage}`,
    },
    rawOutput: {
      parseError: input.errorMessage,
      rawContent: input.content,
    },
  };
}

function parseFinalReportResponse(input: {
  content: string;
  snapshot: Awaited<ReturnType<typeof buildAnalysisInputSnapshot>>;
}): {
  finalReport: FinalReportOutput;
  rawOutput: unknown;
} {
  try {
    const rawOutput = parseJsonObject(input.content);
    const parsedReport = finalReportSchema.safeParse(rawOutput);

    if (parsedReport.success) {
      return {
        finalReport: parsedReport.data,
        rawOutput,
      };
    }

    return buildFallbackFinalReport({
      content: input.content,
      errorMessage: parsedReport.error.message,
      snapshot: input.snapshot,
    });
  } catch (error) {
    return buildFallbackFinalReport({
      content: input.content,
      errorMessage: getErrorMessage(error),
      snapshot: input.snapshot,
    });
  }
}

function buildFallbackFinalReport(input: {
  content: string;
  errorMessage: string;
  snapshot: Awaited<ReturnType<typeof buildAnalysisInputSnapshot>>;
}): {
  finalReport: FinalReportOutput;
  rawOutput: unknown;
} {
  const summary = truncateText(stripJsonFence(input.content), 1200);

  return {
    finalReport: {
      confidence: 0.2,
      missingDataWarnings: [
        ...input.snapshot.missingDataWarnings,
        `Portfolio Manager returned malformed structured output: ${input.errorMessage}`,
      ],
      opportunities: [],
      portfolioFit:
        "The model response could not be parsed into the expected structured report. Treat this run as a low-confidence advisory artifact and rerun analysis if needed.",
      recommendationLabel: "NO_ACTION",
      risks: [
        "Malformed model output prevented full structured synthesis.",
        "Do not use this fallback report as a trade instruction.",
      ],
      riskLevel: "UNKNOWN",
      summary:
        summary ||
        `Portfolio Manager returned malformed structured output: ${input.errorMessage}`,
      thesis: [
        "The analysis completed model calls, but the final structured response required fallback handling.",
      ],
      timeHorizon:
        input.snapshot.requestedIntent === "LONG_TERM"
          ? "long-term"
          : "tactical",
      title: `${input.snapshot.asset.symbol} analysis needs review`,
    },
    rawOutput: {
      parseError: input.errorMessage,
      rawContent: input.content,
    },
  };
}

function stripJsonFence(value: string): string {
  return value
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
}

function truncateText(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

const modelPricingCache = new Map<
  string,
  {
    completionPrice: string | null;
    promptPrice: string | null;
    requestPrice: string | null;
  }
>();

async function getUsageCost(input: {
  client: ChatClient;
  inputTokens: number | undefined;
  model: string;
  outputTokens: number | undefined;
}): Promise<number | null> {
  const pricing = await getModelPricing(input.client, input.model);

  if (!pricing) {
    return null;
  }

  return calculateModelUsageCost({
    completionPrice: pricing.completionPrice,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    promptPrice: pricing.promptPrice,
    requestPrice: pricing.requestPrice,
  });
}

async function getModelPricing(client: ChatClient, model: string) {
  const cachedPricing = modelPricingCache.get(model);

  if (cachedPricing) {
    return cachedPricing;
  }

  const savedSetting = await prisma.aiModelTierSetting.findFirst({
    where: {
      primaryModel: model,
    },
    select: {
      completionPrice: true,
      promptPrice: true,
      requestPrice: true,
    },
  });

  if (savedSetting?.promptPrice && savedSetting.completionPrice) {
    const pricing = {
      completionPrice: savedSetting.completionPrice.toString(),
      promptPrice: savedSetting.promptPrice.toString(),
      requestPrice: savedSetting.requestPrice?.toString() ?? null,
    };

    modelPricingCache.set(model, pricing);

    return pricing;
  }

  if (!client.listModels) {
    return null;
  }

  const catalogModel = (await client.listModels()).find(
    (item) => item.id === model,
  );

  if (!catalogModel?.pricing) {
    return null;
  }

  const pricing = {
    completionPrice: catalogModel.pricing.completion ?? null,
    promptPrice: catalogModel.pricing.prompt ?? null,
    requestPrice: catalogModel.pricing.request ?? null,
  };

  modelPricingCache.set(model, pricing);

  return pricing;
}

function mapRecommendationToStance(
  recommendationLabel: FinalReportOutput["recommendationLabel"],
): AgentOutput["stance"] {
  if (["BUY_MORE", "HOLD"].includes(recommendationLabel)) {
    return "BULLISH";
  }

  if (["REDUCE", "AVOID"].includes(recommendationLabel)) {
    return "BEARISH";
  }

  return "MIXED";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}
