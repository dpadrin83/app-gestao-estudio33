"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteProjectFinanceDocument,
  getProjectFinanceDocumentUrl,
  uploadProjectFinanceDocument,
} from "@/lib/actions/project-finance-documents";
import { financeDocumentKindLabels, formatDate } from "@/lib/format";
import type { FinanceDocumentKind, ProjectFinanceDocument } from "@/types/database";

export function ProjectFinanceDocuments({
  projectId,
  documents,
}: {
  projectId: string;
  documents: ProjectFinanceDocument[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const kindRef = useRef<FinanceDocumentKind>("contract");
  const titleRef = useRef<HTMLInputElement>(null);

  function onUpload() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      toast.error("Selecione um arquivo.");
      return;
    }
    const fd = new FormData();
    fd.set("file", file);
    fd.set("kind", kindRef.current);
    fd.set("title", titleRef.current?.value ?? "");

    startTransition(async () => {
      const result = await uploadProjectFinanceDocument(projectId, fd);
      if (result.ok) {
        toast.success("Documento arquivado.");
        if (fileRef.current) fileRef.current.value = "";
        if (titleRef.current) titleRef.current.value = "";
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function onDownload(docId: string) {
    startTransition(async () => {
      const result = await getProjectFinanceDocumentUrl(docId, projectId);
      if (result.ok && result.data?.url) {
        window.open(result.data.url, "_blank", "noopener,noreferrer");
      } else {
        toast.error(result.ok ? "Link indisponível." : result.error);
      }
    });
  }

  function onDelete(docId: string) {
    if (!confirm("Excluir este documento do arquivo?")) return;
    startTransition(async () => {
      const result = await deleteProjectFinanceDocument(docId, projectId);
      if (result.ok) {
        toast.success("Documento removido.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-start gap-2">
        <FileText className="mt-0.5 size-4 text-brand-yellow" />
        <div>
          <h3 className="text-sm font-semibold">Arquivos financeiros</h3>
          <p className="text-xs text-muted-foreground">
            Contratos, notas emitidas, comprovantes e outros PDFs/documentos do projeto.
          </p>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-lg border border-border/80 bg-muted/20 p-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">
        <div className="space-y-2">
          <Label>Tipo</Label>
          <Select
            defaultValue="contract"
            onValueChange={(v) => {
              kindRef.current = v as FinanceDocumentKind;
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(financeDocumentKindLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="doc-title">Título (opcional)</Label>
          <Input
            id="doc-title"
            ref={titleRef}
            placeholder="Ex.: Contrato assinado 2026"
          />
        </div>
        <div className="space-y-2 sm:col-span-1">
          <Label htmlFor="doc-file">Arquivo</Label>
          <Input
            id="doc-file"
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
          />
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={onUpload}
          className="w-full sm:w-auto"
        >
          <Upload className="size-4" />
          {pending ? "Enviando…" : "Arquivar"}
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">
          Nenhum documento arquivado ainda.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {documents.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.title}</p>
                <p className="text-xs text-muted-foreground">
                  {financeDocumentKindLabels[d.kind]} · {d.file_name} ·{" "}
                  {formatDate(d.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => onDownload(d.id)}
                  title="Baixar"
                >
                  <Download className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => onDelete(d.id)}
                  title="Excluir"
                >
                  <Trash2 className="size-3.5 text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
