"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (/sw.js) no carregamento.
 * Necessário para o Chrome oferecer o botão "Instalar" o Hub como app.
 */
export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // Falha no registro não deve quebrar o app — apenas ignora.
      });
    };
    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
      return () => window.removeEventListener("load", onLoad);
    }
  }, []);

  return null;
}
