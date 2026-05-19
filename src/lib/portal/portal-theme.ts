import type { CSSProperties } from "react";

/** Estilo de fundo do portal quando o cliente tem imagem cadastrada. */
export function portalBackgroundImageStyle(
  url: string | null | undefined,
): CSSProperties | undefined {
  if (!url?.trim()) return undefined;
  return {
    backgroundImage: `url("${url.replace(/"/g, "%22")}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
  };
}
