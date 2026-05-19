#!/usr/bin/env node
/**
 * Verifica migrations via API Supabase (service_role).
 * Uso: npm run db:verify
 */
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = resolve(root, ".env.local");

function loadEnv() {
  const env = { ...process.env };
  if (!existsSync(envPath)) return env;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
  }
  return env;
}

const TABLES = [
  "clients",
  "projects",
  "time_sessions",
  "activities",
  "activity_dependencies",
  "schedule_templates",
  "schedule_template_items",
  "schedule_template_deliverables",
  "deliverables",
  "deliverable_versions",
  "deliverable_comments",
  "project_costs",
  "app_settings",
  "ai_generations",
  "tasks",
  "project_links",
  "studio_professionals",
  "project_macro_areas",
  "project_work_items",
  "prompt_templates",
  "client_services",
];

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const missing = [];
  const ok = [];

  for (const table of TABLES) {
    const { error } = await supabase.from(table).select("*", { head: true, count: "exact" });
    if (error?.code === "PGRST205" || error?.message?.includes("Could not find")) {
      missing.push({ tipo: "tabela", item: table });
    } else if (error) {
      missing.push({ tipo: "tabela", item: table, detail: error.message });
    } else {
      ok.push(table);
    }
  }

  const { count: profCount, error: profErr } = await supabase
    .from("studio_professionals")
    .select("*", { count: "exact", head: true });

  if (!profErr && (profCount ?? 0) < 11) {
    missing.push({
      tipo: "seed",
      item: `studio_professionals (${profCount}/11 papéis)`,
    });
  }

  const { data: buckets } = await supabase.storage.listBuckets();
  const hasBucket = buckets?.some((b) => b.id === "client-assets");
  if (!hasBucket) {
    missing.push({ tipo: "storage", item: "bucket client-assets" });
  }

  console.log("\nHub Estúdio 33 — verificação de migrations\n");
  if (missing.length === 0) {
    console.log(`✓ ${ok.length} tabelas OK`);
    console.log(`✓ studio_professionals: ${profCount} papéis`);
    console.log("✓ storage bucket client-assets");
    console.log("\n→ Banco alinhado com o app. Teste http://127.0.0.1:3333\n");
    process.exit(0);
  }

  console.log("Falta aplicar:\n");
  for (const m of missing) {
    console.log(`  ✗ [${m.tipo}] ${m.item}${m.detail ? ` — ${m.detail}` : ""}`);
  }
  console.log(`\n${ok.length} tabelas OK. Veja supabase/verify-migrations.sql no SQL Editor.\n`);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
