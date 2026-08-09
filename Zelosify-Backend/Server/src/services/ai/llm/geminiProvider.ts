import { LLMProvider, LLMConfig } from "./llmProvider.js";

export class GeminiProvider implements LLMProvider {
  private genAI: any;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: LLMConfig) {
    this.model = config.model || "gemini-1.5-flash";
    this.temperature = config.temperature || 0.3;
    this.maxTokens = config.maxTokens || 1024;

    // Dynamic import to avoid issues if package not installed
    this.genAI = null;
    this.initClient(config.apiKey);
  }

  private async initClient(apiKey: string) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyze(prompt: string): Promise<string> {
    if (!this.genAI) {
      throw new Error("Gemini client not initialized");
    }

    const model = this.genAI.getGenerativeModel({ model: this.model });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  getProviderName(): string {
    return "gemini";
  }
}
