import "server-only";
import Anthropic from "@anthropic-ai/sdk";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export function getAnthropicClient(): Anthropic | null {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  if (!key) return null;
  return new Anthropic({ apiKey: key });
}

export function getAnthropicModel(): string {
  return process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
}

export async function completeText(
  system: string,
  user: string,
  maxTokens = 2048,
): Promise<string> {
  const client = getAnthropicClient();
  if (!client) {
    throw new Error(
      "IA não configurada. Adicione ANTHROPIC_API_KEY no arquivo .env.local.",
    );
  }

  const message = await client.messages.create({
    model: getAnthropicModel(),
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });

  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    throw new Error("Resposta vazia da IA.");
  }
  return block.text.trim();
}
