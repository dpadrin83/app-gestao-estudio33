import type { MetadataRoute } from "next";

// Manifest do PWA — torna o Hub instalável como app no Mac, Android e iPhone.
// Next gera /manifest.webmanifest e injeta <link rel="manifest"> automaticamente.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hub Estúdio 33",
    short_name: "Hub E33",
    description:
      "Sistema de gestão interno do Estúdio 33 — projetos, cronograma, entregáveis e financeiro num só lugar.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "any",
    lang: "pt-BR",
    background_color: "#0A0B10",
    theme_color: "#0A0B10",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
