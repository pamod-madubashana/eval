import { LLMProvider, LLMConfig, LLMGenerateOptions, LLMResult } from "./llmProvider.js";

export class GeminiProvider implements LLMProvider {
  private genAI: any;
  private model: string;

  constructor(config: LLMConfig) {
    this.model = config.model || "gemini-1.5-flash";
    this.genAI = null;
    this.initClient(config.apiKey);
  }

  private async initClient(apiKey: string) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResult> {
    if (!this.genAI) throw new Error("Gemini client not initialized");

    const model = this.genAI.getGenerativeModel({
      model: this.model,
      generationConfig: {
        temperature: options?.temperature ?? 0.3,
        maxOutputTokens: options?.maxTokens ?? 1024,
      },
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;

    const tokenUsage = response.usageMetadata
      ? {
          prompt: response.usageMetadata.promptTokenCount || 0,
          completion: response.usageMetadata.candidatesTokenCount || 0,
          total: response.usageMetadata.totalTokenCount || 0,
        }
      : undefined;

    return {
      text: response.text(),
      tokenUsage,
    };
  }

  getProviderName(): string {
    return "gemini";
  }
}
