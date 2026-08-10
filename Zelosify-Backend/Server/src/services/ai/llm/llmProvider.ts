export interface LLMResult {
  text: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
}

export interface LLMProvider {
  generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResult>;
  getProviderName(): string;
}

export interface LLMGenerateOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
