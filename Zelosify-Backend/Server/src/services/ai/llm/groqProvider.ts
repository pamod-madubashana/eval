import { LLMProvider, LLMConfig } from "./llmProvider.js";

export class GroqProvider implements LLMProvider {
  private client: any;
  private model: string;
  private temperature: number;
  private maxTokens: number;

  constructor(config: LLMConfig) {
    this.model = config.model || "llama3-8b-8192";
    this.temperature = config.temperature || 0.3;
    this.maxTokens = config.maxTokens || 1024;

    this.initClient(config.apiKey);
  }

  private async initClient(apiKey: string) {
    const Groq = (await import("groq-sdk")).default;
    this.client = new Groq({ apiKey });
  }

  async analyze(prompt: string): Promise<string> {
    if (!this.client) {
      throw new Error("Groq client not initialized");
    }

    const completion = await this.client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      temperature: this.temperature,
      max_tokens: this.maxTokens,
    });

    return completion.choices[0]?.message?.content || "";
  }

  getProviderName(): string {
    return "groq";
  }
}
