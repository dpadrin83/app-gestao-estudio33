"use client";

import { useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { uploadClientBrandAsset } from "@/lib/actions/client-assets";
import { toast } from "sonner";
import { Upload } from "lucide-react";

type BrandField = "logo_url" | "portal_background_url";

export function ClientBrandUpload({
  clientId,
  field,
  label,
  hint,
}: {
  clientId: string;
  field: BrandField;
  label: string;
  hint: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onPick() {
    inputRef.current?.click();
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    startTransition(async () => {
      const result = await uploadClientBrandAsset(clientId, field, fd);
      if (result.ok) {
        toast.success("Imagem enviada.");
        router.refresh();
      } else {
        toast.error(result.error);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
        onChange={onChange}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={onPick}
      >
        <Upload className="size-4" />
        {pending ? "Enviando…" : "Enviar imagem"}
      </Button>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}
