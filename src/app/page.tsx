import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LogoE33 } from "@/components/logo-e33";
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
  FileEdit,
} from "lucide-react";

/* ---------- helpers locais ---------- */

const typeScale = [
  { className: "text-xs", label: "text-xs · 12px", role: "labels uppercase, eyebrow" },
  { className: "text-sm", label: "text-sm · 14px", role: "metadados, datas secundárias" },
  { className: "text-base", label: "text-base · 16px", role: "body padrão de interface" },
  { className: "text-lg", label: "text-lg · 18px", role: "labels destacados" },
  { className: "text-xl", label: "text-xl · 20px", role: "títulos de card / seção menor" },
  { className: "text-2xl", label: "text-2xl · 24px", role: "títulos de seção" },
  { className: "text-3xl", label: "text-3xl · 30px", role: "título de página" },
  { className: "text-4xl", label: "text-4xl · 36px", role: "hero" },
  { className: "text-5xl", label: "text-5xl · 48px", role: "greeting / display" },
];

const paletteSwatches = [
  { name: "background", value: "#0A0B10", swatchClass: "bg-background border border-border" },
  { name: "foreground", value: "#F0F0F2", swatchClass: "bg-foreground" },
  { name: "card", value: "#14161D", swatchClass: "bg-card border border-border" },
  { name: "primary", value: "#F5F5F7", swatchClass: "bg-primary" },
  { name: "secondary", value: "#1A1D24", swatchClass: "bg-secondary border border-border" },
  { name: "muted", value: "#14161D", swatchClass: "bg-muted border border-border" },
  { name: "accent", value: "#1A1D24", swatchClass: "bg-accent border border-border" },
  { name: "border", value: "rgba(255,255,255,.08)", swatchClass: "bg-border" },
  { name: "destructive", value: "#EF4444", swatchClass: "bg-destructive" },
  { name: "success", value: "#22C55E", swatchClass: "bg-success" },
  { name: "warning", value: "#F59E0B", swatchClass: "bg-warning" },
  { name: "info", value: "#2D79E6", swatchClass: "bg-info" },
];

const brandSwatches = [
  { name: "brand-yellow", value: "#FFBD00", class: "bg-brand-yellow" },
  { name: "brand-orange", value: "#FF5400", class: "bg-brand-orange" },
  { name: "brand-pink", value: "#FF0054", class: "bg-brand-pink" },
  { name: "brand-magenta", value: "#C52AAF", class: "bg-brand-magenta" },
  { name: "brand-purple", value: "#5C28DB", class: "bg-brand-purple" },
  { name: "brand-blue", value: "#2D79E6", class: "bg-brand-blue" },
  { name: "brand-black", value: "#262828", class: "bg-brand-black" },
];

const moduleAccents = [
  { name: "Cockpit", color: "#E8E8E8", dotClass: "bg-[#E8E8E8]" },
  { name: "Atendimento", color: "#2D79E6", dotClass: "bg-brand-blue" },
  { name: "Projetos", color: "#5C28DB", dotClass: "bg-brand-purple" },
  { name: "Cronograma", color: "#C52AAF", dotClass: "bg-brand-magenta" },
  { name: "Entregáveis", color: "#FF0054", dotClass: "bg-brand-pink" },
  { name: "Clientes", color: "#FF5400", dotClass: "bg-brand-orange" },
  { name: "Financeiro", color: "#FFBD00", dotClass: "bg-brand-yellow" },
  { name: "Acervo", color: "#6B6B6B", dotClass: "bg-[#6B6B6B]" },
  { name: "Prompts", color: "#5C28DB", dotClass: "bg-brand-purple" },
];

/* ---------- componentes locais ---------- */

type StatusTone = "draft" | "progress" | "late" | "done" | "approved" | "rejected";

function StatusBadge({
  label,
  tone,
  icon: Icon,
}: {
  label: string;
  tone: StatusTone;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const toneMap: Record<StatusTone, string> = {
    draft: "bg-muted text-muted-foreground border-border",
    progress: "bg-brand-purple/20 text-[#BFA9F5] border-brand-purple/40",
    late: "bg-warning/15 text-[#FCD34D] border-warning/40",
    done: "bg-success/15 text-[#86EFAC] border-success/40",
    approved: "bg-success/15 text-[#86EFAC] border-success/40",
    rejected: "bg-destructive/15 text-[#FCA5A5] border-destructive/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${toneMap[tone]}`}
    >
      <Icon className="size-3" />
      {label}
    </span>
  );
}

function Section({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-border px-6 py-12 md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
        <h2 className="mb-2 text-3xl font-bold tracking-tight">{title}</h2>
        {description && (
          <p className="mb-10 max-w-2xl text-base text-muted-foreground">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}

/* ---------- página ---------- */

export default function ShowcasePage() {
  return (
    <main className="min-h-screen pb-20">
      <div className="brand-stripe sticky top-0 z-50" />

      <header className="border-b border-border px-6 py-14 md:px-10 md:py-20">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">
          <div className="flex items-center gap-4">
            <LogoE33 className="h-8 w-auto" />
            <span className="rounded-full border border-border bg-card px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Showcase v0
            </span>
          </div>
          <div>
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hub · identidade visual aplicada
            </p>
            <h1 className="text-5xl font-bold tracking-tight md:text-6xl">
              Boa tarde, <span className="text-brand-grad">Danilo.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Esta página é um <strong className="text-foreground">showcase</strong>{" "}
              que prova que a identidade <em>Hub · E33 Dark</em> está
              corretamente aplicada no projeto Next.js — fontes, paleta,
              componentes, status e accents. Será substituída pela primeira
              tela funcional na Fase 1.
            </p>
          </div>
        </div>
      </header>

      <Section
        eyebrow="01 · Tipografia"
        title="Escala e fontes"
        description="Geist como UI sans, Geist Mono para dados/datas/horas/IDs, Instrument Serif disponível para hero ou tom editorial pontual."
      >
        <div className="space-y-3">
          {typeScale.map((t) => (
            <div
              key={t.className}
              className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-4 md:flex-row md:items-baseline md:gap-6"
            >
              <p className="w-40 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.label}
              </p>
              <p className={`${t.className} font-medium tracking-tight`}>
                A jornada do briefing à entrega.
              </p>
              <span className="ml-auto hidden text-xs text-muted-foreground md:block">
                {t.role}
              </span>
            </div>
          ))}

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-5 md:flex-row md:items-center md:gap-6">
            <p className="w-40 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Geist Mono
            </p>
            <p className="font-mono text-lg font-medium tracking-tight">
              12:34 · R$ 8.500,00 · 2026-05-18 · #4F9A2C
            </p>
            <span className="ml-auto hidden text-xs text-muted-foreground md:block">
              dados, datas, horas, IDs, valores
            </span>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-card px-5 py-5 md:flex-row md:items-center md:gap-6">
            <p className="w-40 shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Instrument Serif
            </p>
            <p className="font-serif text-3xl">
              Estúdio criativo aterrado, sem jargão.
            </p>
            <span className="ml-auto hidden text-xs text-muted-foreground md:block">
              hero opcional / tom editorial
            </span>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="02 · Paleta"
        title="Tokens de cor"
        description="Tokens shadcn (background, card, primary, etc.) mapeados para a base dark E33. Mais cores brand do logo oficial do Estúdio 33."
      >
        <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Base + semânticos
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {paletteSwatches.map((s) => (
            <div
              key={s.name}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className={`h-16 w-full ${s.swatchClass}`} />
              <div className="p-3">
                <p className="font-mono text-[11px] font-semibold">{s.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="mt-10 mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Brand E33 (cores oficiais do logo)
        </h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
          {brandSwatches.map((s) => (
            <div
              key={s.name}
              className="overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className={`h-16 w-full ${s.class}`} />
              <div className="p-3">
                <p className="font-mono text-[11px] font-semibold">{s.name}</p>
                <p className="font-mono text-[10px] text-muted-foreground">
                  {s.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <h3 className="mt-10 mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Gradiente icônico
        </h3>
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="brand-grad-bg h-12 w-full" />
            <div className="p-3">
              <p className="font-mono text-[11px] font-semibold">
                .brand-grad-bg
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                horizontal · brand-stripe, botão CTA principal, marcos no Gantt
              </p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="brand-grad-diag h-12 w-full" />
            <div className="p-3">
              <p className="font-mono text-[11px] font-semibold">
                .brand-grad-diag
              </p>
              <p className="font-mono text-[10px] text-muted-foreground">
                diagonal · avatares, ícones de apps especialistas
              </p>
            </div>
          </div>
        </div>
      </Section>

      <Section
        eyebrow="03 · Componentes"
        title="Botões, badges, cards e tabela"
        description="Componentes shadcn já aplicando os tokens. Badges de status seguem as 16 etapas oficiais do E33_OS — abaixo, uma amostra dos estados mais usados."
      >
        <div className="mb-10">
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Botões
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primário</Button>
            <Button variant="secondary">Secundário</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destrutivo</Button>
            <button className="brand-grad-bg inline-flex h-8 items-center gap-2 rounded-lg px-3 text-sm font-semibold text-white shadow-lg shadow-brand-pink/30 transition hover:opacity-90">
              <Sparkles className="size-4" />
              Brand gradient
            </button>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="mb-10">
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Badges de status
          </h3>
          <div className="flex flex-wrap gap-3">
            <StatusBadge label="rascunho" tone="draft" icon={FileEdit} />
            <StatusBadge label="em andamento" tone="progress" icon={Clock} />
            <StatusBadge label="atrasado" tone="late" icon={AlertTriangle} />
            <StatusBadge label="concluído" tone="done" icon={CheckCircle2} />
            <StatusBadge label="aprovado" tone="approved" icon={CheckCircle2} />
            <StatusBadge label="reprovado" tone="rejected" icon={XCircle} />
          </div>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            Os 16 estados oficiais (ideia, lead, briefing, diagnóstico,
            proposta, aguardando_aprovação, aprovado, planejamento,
            em_produção, revisão_interna, aguardando_cliente, em_ajuste,
            entregue, faturado, recorrente, arquivado) seguem o mesmo padrão
            visual e ficam documentados em{" "}
            <code className="text-foreground">docs/identidade-visual.md</code>.
          </p>
        </div>

        <Separator className="my-8" />

        <div className="mb-10">
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Card de projeto (exemplo)
          </h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-brand-orange/30 bg-gradient-to-br from-brand-orange/15 to-brand-orange/[0.04]">
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Casa Veloso
                    </p>
                    <h4 className="text-lg font-semibold">Identidade visual</h4>
                  </div>
                  <StatusBadge label="em produção" tone="progress" icon={Clock} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span>Progresso</span>
                    <span className="font-semibold text-foreground">62%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-brand-orange shadow-[0_0_8px_rgba(255,84,0,0.6)]"
                      style={{ width: "62%" }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                  <span>Prazo</span>
                  <span className="font-semibold text-foreground">28 mai</span>
                </div>
              </div>
            </Card>

            <Card className="border-brand-pink/30 bg-gradient-to-br from-brand-pink/15 to-brand-pink/[0.04]">
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Hospital Sírio
                    </p>
                    <h4 className="text-lg font-semibold">
                      Vídeo institucional
                    </h4>
                  </div>
                  <StatusBadge label="atrasado" tone="late" icon={AlertTriangle} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span>Progresso</span>
                    <span className="font-semibold text-foreground">41%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-warning shadow-[0_0_8px_rgba(245,158,11,0.6)]"
                      style={{ width: "41%" }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-[11px]">
                  <span className="text-muted-foreground">Prazo</span>
                  <span className="font-semibold text-destructive">
                    22 mai · atrasado 2d
                  </span>
                </div>
              </div>
            </Card>

            <Card className="border-brand-blue/30 bg-gradient-to-br from-brand-blue/15 to-brand-blue/[0.04]">
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      Pão de Açúcar
                    </p>
                    <h4 className="text-lg font-semibold">Landing page</h4>
                  </div>
                  <StatusBadge label="aprovado" tone="approved" icon={CheckCircle2} />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between font-mono text-[11px] text-muted-foreground">
                    <span>Progresso</span>
                    <span className="font-semibold text-foreground">88%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-brand-blue shadow-[0_0_8px_rgba(45,121,230,0.6)]"
                      style={{ width: "88%" }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3 font-mono text-[11px] text-muted-foreground">
                  <span>Prazo</span>
                  <span className="font-semibold text-foreground">06 jun</span>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Separator className="my-8" />

        <div className="mb-10">
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Tabela de projetos (4 linhas fictícias)
          </h3>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Projeto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progresso</TableHead>
                  <TableHead className="text-right">Prazo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    Identidade Visual
                  </TableCell>
                  <TableCell>Casa Veloso</TableCell>
                  <TableCell>
                    <StatusBadge label="em produção" tone="progress" icon={Clock} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">62%</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    28 mai
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Vídeo Institucional
                  </TableCell>
                  <TableCell>Hospital Sírio</TableCell>
                  <TableCell>
                    <StatusBadge label="atrasado" tone="late" icon={AlertTriangle} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">41%</TableCell>
                  <TableCell className="text-right font-mono text-xs text-destructive">
                    22 mai
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Landing Page</TableCell>
                  <TableCell>Pão de Açúcar</TableCell>
                  <TableCell>
                    <StatusBadge
                      label="aprovado"
                      tone="approved"
                      icon={CheckCircle2}
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">88%</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    06 jun
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    Branding completo
                  </TableCell>
                  <TableCell>Studio Ar</TableCell>
                  <TableCell>
                    <StatusBadge label="rascunho" tone="draft" icon={FileEdit} />
                  </TableCell>
                  <TableCell className="font-mono text-xs">04%</TableCell>
                  <TableCell className="text-right font-mono text-xs">
                    12 ago
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>

        <Separator className="my-8" />

        <div>
          <h3 className="mb-4 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Barras de Gantt (cores por status do módulo)
          </h3>
          <Card className="overflow-hidden p-5">
            <div className="mb-4 grid grid-cols-[200px_1fr] gap-4 border-b border-border pb-3">
              <div />
              <div className="grid grid-cols-8 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <span>18 mai</span>
                <span>20</span>
                <span>22</span>
                <span>24</span>
                <span>26</span>
                <span>28</span>
                <span>30</span>
                <span>01 jun</span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                {
                  name: "Aprovação logo",
                  meta: "Casa Veloso · 3d",
                  left: 0,
                  width: 25,
                  label: "em revisão",
                  bar: "bg-brand-orange shadow-[0_0_12px_rgba(255,84,0,0.5)] text-white",
                },
                {
                  name: "Roteiro v2",
                  meta: "Hospital Sírio · 5d",
                  left: 12,
                  width: 38,
                  label: "atrasada",
                  bar: "bg-warning shadow-[0_0_12px_rgba(245,158,11,0.5)] text-white",
                },
                {
                  name: "Entrega final landing",
                  meta: "Pão de Açúcar · 2d",
                  left: 60,
                  width: 18,
                  label: "marco",
                  bar: "brand-grad-bg shadow-[0_0_16px_rgba(255,0,84,0.4)] text-white",
                },
                {
                  name: "Kickoff branding",
                  meta: "Studio Ar · 1d",
                  left: 75,
                  width: 10,
                  label: "rascunho",
                  bar: "border border-dashed border-border bg-transparent text-muted-foreground",
                },
              ].map((row) => (
                <div
                  key={row.name}
                  className="grid grid-cols-[200px_1fr] items-center gap-4"
                >
                  <div>
                    <p className="text-sm font-medium">{row.name}</p>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {row.meta}
                    </p>
                  </div>
                  <div className="relative h-6 rounded-full bg-secondary">
                    <div
                      className={`absolute inset-y-0 flex items-center rounded-full px-3 font-mono text-[10px] font-semibold uppercase tracking-wider ${row.bar}`}
                      style={{
                        left: `${row.left}%`,
                        width: `${row.width}%`,
                      }}
                    >
                      {row.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </Section>

      <Section
        eyebrow="04 · Acentos por módulo"
        title="Cada módulo tem sua cor"
        description="O dot quadrado aparece à esquerda do item na sidebar (com glow quando o módulo está ativo). Mesma cor é usada como border-left em cards e como cor da barra no Gantt."
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {moduleAccents.map((m) => (
            <div
              key={m.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div
                className={`size-3 rounded-sm ${m.dotClass}`}
                style={{ boxShadow: `0 0 6px ${m.color}80` }}
              />
              <p className="flex-1 text-sm font-medium">{m.name}</p>
              <p className="font-mono text-[10px] text-muted-foreground">
                {m.color}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <footer className="px-6 py-10 md:px-10 md:py-12">
        <div className="mx-auto max-w-6xl rounded-2xl border border-dashed border-border bg-card/50 p-6 text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Showcase visual
          </p>
          <p className="mt-2 text-base text-foreground">
            Esta página será substituída pela primeira tela funcional na{" "}
            <strong>Fase 1 — Núcleo operacional</strong>.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Referências:{" "}
            <code className="text-foreground">docs/identidade-visual.md</code>{" "}
            ·{" "}
            <code className="text-foreground">docs/mockups/hub.html</code>
          </p>
        </div>
      </footer>
    </main>
  );
}
