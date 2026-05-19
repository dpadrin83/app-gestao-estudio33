import { LogoE33 } from "@/components/logo-e33";
import { ResetPasswordForm } from "./reset-password-form";

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen">
      <div className="brand-stripe" />
      <div className="mx-auto flex min-h-[calc(100vh-3px)] max-w-md flex-col justify-center px-6 py-16">
        <div className="mb-10 flex flex-col items-start gap-4">
          <LogoE33 className="h-7 w-auto text-foreground" />
          <div>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Hub · Nova senha
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Defina sua senha
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Escolha uma senha com pelo menos 8 caracteres.
            </p>
          </div>
        </div>
        <ResetPasswordForm />
      </div>
    </main>
  );
}
