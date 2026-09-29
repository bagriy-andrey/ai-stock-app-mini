export type ModelTier = "cheap" | "standard" | "strong";

export type ModelTierConfig = {
  tier: ModelTier;
  primaryModel: string;
  fallbackModels: string[];
};

export type ModelRoute = {
  tier: ModelTier;
  models: string[];
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompletionRequest = {
  model: string;
  messages: ChatMessage[];
  response_format?: {
    type: "json_object";
  };
  temperature?: number;
};

export type ChatCompletionResponse = {
  id: string;
  model: string;
  content: string;
  inputTokens?: number;
  outputTokens?: number;
};
