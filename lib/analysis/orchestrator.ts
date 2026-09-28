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
import type {
  ChatCompletionResponse,
  ModelTier,
} from "@/lib/model-router/types";

type ChatClient = Pick<OpenRouterClient, "createChatCompletion">;

export async function startDeepAnalysis(input: AnalysisStartInput): Promise<{
  agentRunId: string;
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
  } catch (error) {
    await markAgentRunFailed({
      agentRunId: agentRun.id,
      errorMessage: getErrorMessage(error),
    });
  }

  return {
    agentRunId: agentRun.id,
  };
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
    const rawOutput = parseJsonObject(response.content);

    if (definition.name === "portfolio_manager") {
      const finalReport = finalReportSchema.parse(rawOutput);
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

    agentResults.push({
      definition,
      model: response.model,
      output: agentOutputSchema.parse(rawOutput),
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
        temperature: 0.2,
      });
      const latencyMs = Date.now() - startedAt;

      await prisma.aiUsageRecord.create({
        data: {
          agentRunId: input.agentRunId,
          agent: input.agent,
          ticker: input.ticker,
          model: response.model || model,
          modelTier: input.modelTier,
          inputTokens: response.inputTokens,
          outputTokens: response.outputTokens,
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
