import { cn } from "@/lib/utils";
import type { PhaseStep } from "@/lib/project-phase";

export function PortalPhaseStepper({
  steps,
  progressPercent,
}: {
  steps: PhaseStep[];
  progressPercent: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="text-muted-foreground">Progresso do projeto</span>
        <span className="font-mono text-xs font-semibold text-brand-orange">
          {progressPercent}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-brand-orange transition-all"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <ol className="grid gap-2 sm:grid-cols-4">
        {steps.map((step) => (
          <li
            key={step.phase}
            className={cn(
              "rounded-lg border px-3 py-2 text-center text-xs",
              step.state === "done" &&
                "border-success/40 bg-success/10 text-success",
              step.state === "current" &&
                "border-brand-orange/50 bg-brand-orange/10 font-semibold text-brand-orange",
              step.state === "upcoming" &&
                "border-border bg-card/30 text-muted-foreground",
            )}
          >
            {step.label}
          </li>
        ))}
      </ol>
    </div>
  );
}
