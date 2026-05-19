#!/usr/bin/env node
/**
 * Gera supabase/apply-all.sql — um único arquivo para colar no SQL Editor.
 * Uso: node scripts/merge-migrations.mjs
 */
import { readdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const migrationsDir = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "migrations",
);
const out = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "apply-all.sql",
);

const includeDemo = process.env.INCLUDE_DEMO === "1";

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .filter((f) => includeDemo || !f.includes("demo_panorama_seed"))
  .sort();

const parts = [
  "-- Hub Estúdio 33 — todas as migrations em ordem",
  "-- Gerado por: npm run db:bundle",
  "-- ATENÇÃO: use em banco NOVO ou confirme que migrations já aplicadas não serão duplicadas.",
  "-- Para banco existente, aplique só os arquivos 202605… que ainda faltam.",
  includeDemo
    ? "-- Inclui seed demo (INCLUDE_DEMO=1)."
    : "-- Seed demo EXCLUÍDO (produção). Para incluir: INCLUDE_DEMO=1 npm run db:bundle",
  "",
];

for (const file of files) {
  parts.push(`-- ─── ${file} ───`);
  parts.push(readFileSync(resolve(migrationsDir, file), "utf8").trim());
  parts.push("");
}

writeFileSync(out, parts.join("\n"), "utf8");
console.log(`Gerado: supabase/apply-all.sql (${files.length} migrations)`);
