// Service worker mínimo do Hub Estúdio 33.
// Existe para tornar o app instalável (Chrome exige um SW com handler de fetch).
// Não faz cache offline — apenas repassa as requisições para a rede.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
  // Sem estratégia de cache: deixa o navegador buscar normalmente na rede.
});
