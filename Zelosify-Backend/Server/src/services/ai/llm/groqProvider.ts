import { LLMProvider, LLMConfig, LLMGenerateOptions, LLMResult } from "./llmProvider.js";

export class GroqProvider implements LLMProvider {
  private client: any;
  private model: string;

  constructor(config: LLMConfig) {
    this.model = config.model || "llama3-8b-8192";
    this.initClient(config.apiKey);
  }

  private async initClient(apiKey: string) {
    const Groq = (await import("groq-sdk")).default;
    this.client = new Groq({ apiKey });
  }

  async generate(prompt: string, options?: LLMGenerateOptions): Promise<LLMResult> {
    if (!this.client) throw new Error("Groq client not initialized");

    const completion = await this.client.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: this.model,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 1024,
    });

    const choice = completion.choices[0];
    const tokenUsage = completion.usage
      ? {
          prompt: completion.usage.prompt_tokens || 0,
          completion: completion.usage.completion_tokens || 0,
          total: completion.usage.total_tokens || 0,
        }
      : undefined;

    return {
      text: choice?.message?.content || "",
      tokenUsage,
    };
  }

  getProviderName(): string {
    return "groq";
  }
}
