"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSchema, type ClientFormValues } from "@/lib/schemas/client";
import { createClient, updateClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save } from "lucide-react";
import { toast } from "sonner";
import type { Client } from "@/types/database";

export function ClientForm({ initial }: { initial?: Client }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(ClientSchema),
    defaultValues: initial
      ? {
          name: initial.name,
          email: initial.email ?? "",
          phone: initial.phone ?? "",
          notes: initial.notes ?? "",
          status: initial.status,
        }
      : {
          name: "",
          email: "",
          phone: "",
          notes: "",
          status: "active",
        },
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="name">Nome *</Label>
        <Input id="name" placeholder="Ex.: Casa Veloso" {...register("name")} />
        {errors.name && (
          <p className="text-xs text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            placeholder="contato@cliente.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefone / WhatsApp</Label>
          <Input id="phone" placeholder="+55 11 ..." {...register("phone")} />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Anotações</Label>
        <textarea
          id="notes"
          rows={5}
          placeholder="Contexto livre — segmento, contatos secundários, histórico…"
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          {...register("notes")}
        />
        {errors.notes && (
          <p className="text-xs text-destructive">{errors.notes.message}</p>
        )}
      </div>

      <input type="hidden" {...register("status")} />

      <div className="flex items-center gap-3 pt-2">
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
