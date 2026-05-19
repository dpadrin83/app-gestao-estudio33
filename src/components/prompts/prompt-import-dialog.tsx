"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Upload, Download, FileJson } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  importPromptTemplates,
  exportPromptTemplatesJson,
} from "@/lib/actions/prompt-templates";

const EXAMPLE = `{
  "prompts": [
    {
      "professional_slug": "copywriter",
      "title": "Roteiro Reels 30s — estrutura",
      "deliverable_hint": "Roteiro de vídeo curto",
      "body": "Você é copywriter do Estúdio 33. Cliente: [CLIENTE]. Tom: [TOM]. Briefing: [BRIEFING].\\n\\nCrie roteiro de Reels 30s para [ENTREGAVEL]. Formato: gancho (3s) → desenvolvimento → CTA. Tabela com tempo | cena | áudio | legenda."
    }
  ]
}`;

export function PromptImportDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pending, startTransition] = useTransition();

  function onImport() {
    startTransition(async () => {
      const result = await importPromptTemplates(text);
      if (result.ok && result.data) {
        const { imported, skipped, errors } = result.data;
        toast.success(
          `${imported} prompt(s) importado(s).` +
            (skipped ? ` ${skipped} ignorado(s).` : ""),
        );
        if (errors.length) {
          console.warn("[import prompts]", errors);
          toast.message("Alguns itens foram ignorados — veja o console.");
        }
        setOpen(false);
        setText("");
        router.refresh();
      } else if (!result.ok) {
        toast.error(result.error);
      }
    });
  }

  function onExport() {
    startTransition(async () => {
      try {
        const json = await exportPromptTemplatesJson();
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prompts-e33-${new Date().toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Exportação baixada.");
      } catch {
        toast.error("Não foi possível exportar.");
      }
    });
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setOpen(true)}
      >
        <Upload className="mr-1 size-3.5" />
        Importar JSON
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileJson className="size-5 text-brand-purple" />
            Importar prompts
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Cole o JSON gerado na auditoria (seção C do prompt mestre) ou exporte
          de outro ambiente. Máximo 100 por vez. Campo{" "}
          <code className="text-xs">professional_slug</code> usa os 11 papéis
          E33 (ex. <code className="text-xs">copywriter</code>).
        </p>
        <div className="space-y-2">
          <Label htmlFor="import-json">JSON</Label>
          <textarea
            id="import-json"
            rows={14}
            className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs"
            placeholder={EXAMPLE}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </div>
        <details className="text-xs text-muted-foreground">
          <summary className="cursor-pointer">Ver exemplo mínimo</summary>
          <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-3">{EXAMPLE}</pre>
        </details>
        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={onExport}
          >
            <Download className="mr-1 size-3.5" />
            Exportar banco atual
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={onImport}
              disabled={pending || !text.trim()}
            >
              {pending ? "Importando…" : "Importar"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      </Dialog>
    </>
  );
}
