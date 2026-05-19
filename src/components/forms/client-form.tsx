"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSchema, type ClientFormValues } from "@/lib/schemas/client";
import { createClient, updateClient } from "@/lib/actions/clients";
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
import { Card } from "@/components/ui/card";
import { Save } from "lucide-react";
import { toast } from "sonner";
import {
  clientStatusLabels,
  clientCompanySizeLabels,
} from "@/lib/format";
import type { Client } from "@/types/database";
import { ClientBrandUpload } from "@/components/forms/client-brand-upload";

const statusOptions = Object.entries(clientStatusLabels) as [
  ClientFormValues["status"],
  string,
][];

const sizeOptions = Object.entries(clientCompanySizeLabels) as [
  NonNullable<ClientFormValues["company_size"]>,
  string,
][];

function defaultValues(initial?: Client): ClientFormValues {
  if (!initial) {
    return {
      name: "",
      legal_name: "",
      cnpj: "",
      segment: "",
      company_size: "__none__",
      website: "",
      logo_url: "",
      portal_background_url: "",
      contact_name: "",
      contact_role: "",
      email: "",
      phone: "",
      whatsapp: "",
      notes: "",
      status: "prospect",
      auth_user_id: "",
    };
  }
  return {
    name: initial.name,
    legal_name: initial.legal_name ?? "",
    cnpj: initial.cnpj ?? "",
    segment: initial.segment ?? "",
    company_size: initial.company_size ?? "__none__",
    website: initial.website ?? "",
    logo_url: initial.logo_url ?? "",
    portal_background_url: initial.portal_background_url ?? "",
    contact_name: initial.contact_name ?? "",
    contact_role: initial.contact_role ?? "",
    email: initial.email ?? "",
    phone: initial.phone ?? "",
    whatsapp: initial.whatsapp ?? "",
    notes: initial.notes ?? "",
    status: initial.status,
    auth_user_id: initial.auth_user_id ?? "",
  };
}

export function ClientForm({ initial }: { initial?: Client }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(ClientSchema),
    defaultValues: defaultValues(initial),
  });

  function onSubmit(values: ClientFormValues) {
    startTransition(async () => {
      const result = initial
        ? await updateClient(initial.id, values)
        : await createClient(values);

      if (result.ok) {
        toast.success(initial ? "Cliente atualizado." : "Cliente criado.");
        router.push("/clients");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const textareaClass =
    "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
      <Card className="space-y-5 border-border/80 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Empresa</h2>
          <p className="text-sm text-muted-foreground">
            Quem contrata o Estúdio 33 — razão social, CNPJ e segmento.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Nome fantasia / marca *</Label>
            <Input
              id="name"
              placeholder="Ex.: Casa Veloso"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="legal_name">Razão social</Label>
            <Input
              id="legal_name"
              placeholder="Ex.: Casa Veloso Alimentos Ltda"
              {...register("legal_name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cnpj">CNPJ</Label>
            <Input
              id="cnpj"
              placeholder="00.000.000/0001-00"
              {...register("cnpj")}
            />
            {errors.cnpj && (
              <p className="text-xs text-destructive">{errors.cnpj.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="segment">Segmento</Label>
            <Input
              id="segment"
              placeholder="Ex.: food & beverage, tech, saúde…"
              {...register("segment")}
            />
          </div>

          <div className="space-y-2">
            <Label>Porte da empresa</Label>
            <Controller
              control={control}
              name="company_size"
              render={({ field }) => (
                <Select
                  value={
                    !field.value || field.value === "__none__"
                      ? "__none__"
                      : field.value
                  }
                  onValueChange={(v) =>
                    field.onChange(v === "__none__" ? "__none__" : (v ?? "__none__"))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Não informado</SelectItem>
                    {sizeOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="website">Site</Label>
            <Input
              id="website"
              placeholder="https://empresa.com.br"
              {...register("website")}
            />
            {errors.website && (
              <p className="text-xs text-destructive">{errors.website.message}</p>
            )}
          </div>

        </div>
      </Card>

      <Card className="space-y-5 border-border/80 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Área do cliente (portal)
          </h2>
          <p className="text-sm text-muted-foreground">
            Logo e fundo exibidos em /portal para quem tem login de cliente.
          </p>
        </div>

        <div className="grid gap-4">
          {initial && (
            <ClientBrandUpload
              clientId={initial.id}
              field="logo_url"
              label="Logo (upload)"
              hint="JPEG, PNG, WebP ou SVG — máx. 5 MB. Substitui a URL abaixo."
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="logo_url">Logo (URL)</Label>
            <Input
              id="logo_url"
              placeholder="https://…/logo.png"
              {...register("logo_url")}
            />
            {errors.logo_url && (
              <p className="text-xs text-destructive">{errors.logo_url.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              PNG ou SVG público. Se vazio, usamos as iniciais da marca.
            </p>
          </div>

          {initial && (
            <ClientBrandUpload
              clientId={initial.id}
              field="portal_background_url"
              label="Fundo do portal (upload)"
              hint="Foto ou textura para o fundo da área do cliente."
            />
          )}
          <div className="space-y-2">
            <Label htmlFor="portal_background_url">Fundo do portal (URL)</Label>
            <Input
              id="portal_background_url"
              placeholder="https://…/fundo.jpg"
              {...register("portal_background_url")}
            />
            {errors.portal_background_url && (
              <p className="text-xs text-destructive">
                {errors.portal_background_url.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Imagem de fundo (foto ou textura). Camada escura mantém o texto
              legível. Se vazio, usa o fundo padrão do hub.
            </p>
          </div>
        </div>
      </Card>

      <Card className="space-y-5 border-border/80 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Contato principal</h2>
          <p className="text-sm text-muted-foreground">
            A pessoa com quem você conversa no dia a dia.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact_name">Nome</Label>
            <Input
              id="contact_name"
              placeholder="Ex.: Maria Silva"
              {...register("contact_name")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contact_role">Cargo</Label>
            <Input
              id="contact_role"
              placeholder="Ex.: marketing, CEO, sócia…"
              {...register("contact_role")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              placeholder="maria@empresa.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input id="phone" placeholder="+55 11 99999-0000" {...register("phone")} />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="Se for diferente do telefone"
              {...register("whatsapp")}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-5 border-border/80 p-6">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Relacionamento</h2>
          <p className="text-sm text-muted-foreground">
            Situação comercial com o cliente no Estúdio 33.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Status *</Label>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Anotações</Label>
          <textarea
            id="notes"
            rows={5}
            placeholder="Histórico, tom de voz, outros contatos, preferências de comunicação…"
            className={textareaClass}
            {...register("notes")}
          />
        </div>

      </Card>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          <Save className="size-4" />
          {pending ? "Salvando…" : initial ? "Salvar alterações" : "Criar cliente"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/clients")}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
