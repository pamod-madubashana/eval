import { LLMProvider } from "./llmProvider.js";

export type LLMProviderType = "gemini" | "groq";

let cachedProvider: LLMProvider | null = null;

export async function createLLMProvider(
  providerType?: LLMProviderType
): Promise<LLMProvider> {
  if (cachedProvider) return cachedProvider;

  const selected =
    providerType || (process.env.LLM_PROVIDER as LLMProviderType) || "gemini";

  let provider: LLMProvider;

  switch (selected) {
    case "groq": {
      const { GroqProvider } = await import("./groqProvider.js");
      provider = new GroqProvider({
        apiKey: process.env.GROQ_API_KEY!,
        model: process.env.GROQ_MODEL || "llama3-8b-8192",
      });
      break;
    }
    case "gemini":
    default: {
      const { GeminiProvider } = await import("./geminiProvider.js");
      provider = new GeminiProvider({
        apiKey: process.env.GEMINI_API_KEY!,
        model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
      });
      break;
    }
  }

  cachedProvider = provider;
  return provider;
}

export function resetLLMProvider(): void {
  cachedProvider = null;
}
