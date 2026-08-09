export interface LLMProvider {
  analyze(prompt: string): Promise<string>;
  getProviderName(): string;
}

export interface LLMConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
}
