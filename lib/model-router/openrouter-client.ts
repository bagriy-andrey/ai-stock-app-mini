import { env } from "@/config/env";
import type {
  ChatCompletionRequest,
  ChatCompletionResponse,
} from "./types";

type OpenRouterResponse = {
  id: string;
  model: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
  };
};

export type OpenRouterModel = {
  id: string;
  name: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
  };
  architecture?: {
    input_modalities?: string[];
    output_modalities?: string[];
    modality?: string;
  };
  supported_parameters?: string[];
};

type OpenRouterModelsResponse = {
  data?: OpenRouterModel[];
};

export class OpenRouterClient {
  constructor(
    private readonly apiKey = env.OPENROUTER_API_KEY,
    private readonly baseUrl = env.OPENROUTER_BASE_URL,
  ) {}

  async createChatCompletion(
    request: ChatCompletionRequest,
  ): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter request failed with status ${response.status}`);
    }

    const data = (await response.json()) as OpenRouterResponse;

    return {
      id: data.id,
      model: data.model,
      content: data.choices?.[0]?.message?.content ?? "",
      inputTokens: data.usage?.prompt_tokens,
      outputTokens: data.usage?.completion_tokens,
    };
  }

  async listModels(): Promise<OpenRouterModel[]> {
    if (!this.apiKey) {
      throw new Error("OPENROUTER_API_KEY is not configured");
    }

    const response = await fetch(
      `${this.baseUrl}/models?output_modalities=text&sort=pricing-low-to-high&limit=1000`,
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `OpenRouter models request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as OpenRouterModelsResponse;

    return (data.data ?? []).filter((model) =>
      model.architecture?.output_modalities?.includes("text") ?? true,
    );
  }
}
