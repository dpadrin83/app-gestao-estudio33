#!/usr/bin/env node
/**
 * Valida variáveis mínimas para deploy / portal / e-mails.
 * Uso: node scripts/check-deploy-env.mjs
 * Carrega .env.local se existir (formato KEY=value simples).
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

const env = { ...process.env };

if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
}

const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const recommended = [
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
  "RESEND_FROM_EMAIL",
  "HUB_ADMIN_EMAIL",
];

let fail = false;

console.log("\nHub Estúdio 33 — checagem de ambiente\n");

for (const key of required) {
  const ok = Boolean(env[key]?.trim());
  console.log(`${ok ? "✓" : "✗"} ${key} ${ok ? "" : "(obrigatório)"}`);
  if (!ok) fail = true;
}

console.log("\nRecomendado (portal + e-mails):\n");

for (const key of recommended) {
  const ok = Boolean(env[key]?.trim());
  console.log(`${ok ? "✓" : "○"} ${key}`);
}

console.log(
  fail
    ? "\n→ Corrija os itens obrigatórios em .env.local (veja .env.local.example).\n"
    : "\n→ Ambiente mínimo OK. Rode migrations no Supabase e siga docs/deploy.md\n",
);

process.exit(fail ? 1 : 0);
