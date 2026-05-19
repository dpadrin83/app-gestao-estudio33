/** Extrai placeholders no formato [NOME] do texto do prompt. */
export function extractPromptVariables(body: string): string[] {
  const matches = body.matchAll(/\[([A-Z0-9_]+)\]/g);
  const set = new Set<string>();
  for (const m of matches) {
    if (m[1]) set.add(m[1]);
  }
  return [...set].sort();
}

export const COMMON_PROMPT_VARIABLES = [
  "CLIENTE",
  "SEGMENTO",
  "TOM",
  "BRIEFING",
  "ENTREGAVEL",
  "SUB_ETAPA",
  "PRAZO",
] as const;
