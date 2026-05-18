import { LoginForm } from "./login-form";
import { LogoE33 } from "@/components/logo-e33";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; error?: string }>;
}) {
  return (
    <main className="min-h-screen">
      <div className="brand-stripe" />
      <div className="mx-auto flex min-h-[calc(100vh-3px)] max-w-md flex-col justify-center px-6 py-16">
        <div className="mb-10 flex flex-col items-start gap-4">
          <LogoE33 className="h-7 w-auto text-foreground" />
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hub · Acesso interno
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Boa volta, <span className="text-brand-grad">Danilo.</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Entre com seu e-mail e senha para continuar.
            </p>
          </div>
        </div>

        <LoginForm searchParams={searchParams} />
      </div>
    </main>
  );
}
