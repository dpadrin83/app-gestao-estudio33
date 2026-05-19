import { Card } from "@/components/ui/card";
import { getDeployStatus } from "@/lib/deploy-status";
import { Rocket, CheckCircle2, Circle } from "lucide-react";

export function DeployStatusCard() {
  const checks = getDeployStatus();
  const allOk = checks.every((c) => c.ok);

  return (
    <Card className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <Rocket className="size-5 text-brand-orange" />
        <h2 className="text-lg font-semibold">Publicação</h2>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        Status das variáveis de ambiente neste servidor.         Guias:{" "}
        <code className="text-xs">docs/PRE-DEPLOY.md</code> ·{" "}
        <code className="text-xs">docs/deploy.md</code>
      </p>
      <ul className="space-y-3">
        {checks.map((c) => (
          <li key={c.id} className="flex gap-3 text-sm">
            {c.ok ? (
              <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
            ) : (
              <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium">{c.label}</p>
              {!c.ok && (
                <p className="text-xs text-muted-foreground">{c.hint}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p
        className={
          allOk
            ? "mt-4 text-sm text-success"
            : "mt-4 text-sm text-muted-foreground"
        }
      >
        {allOk
          ? "Ambiente pronto para convites, e-mails e deploy na Vercel."
          : "Complete o .env.local (local) ou Environment Variables na Vercel."}
      </p>
      <p className="mt-2 font-mono text-[10px] text-muted-foreground">
        Local: npm run predeploy · SQL: supabase/apply-all.sql
      </p>
    </Card>
  );
}
