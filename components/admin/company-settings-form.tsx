"use client";

import { Building2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOrganization } from "@/lib/actions/admin";
import { formatDate } from "@/lib/utils/format";

export type OrganizationInfo = {
  id: string;
  name: string;
  legalName: string;
  documentNumber: string | null;
  status: string;
  createdAt: string;
};

export function CompanySettingsForm({ organization, canManage }: { organization: OrganizationInfo; canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSaved(false);

    startTransition(async () => {
      await updateOrganization({
        name: String(form.get("name") ?? organization.name),
        legalName: String(form.get("legalName") ?? organization.legalName),
        documentNumber: String(form.get("documentNumber") ?? "") || null,
      });
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Configurações</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Empresa</h3>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
            Nome
          </label>
          <Input name="name" defaultValue={organization.name} disabled={!canManage} required />
        </div>
        <div>
          <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
            Razão social
          </label>
          <Input name="legalName" defaultValue={organization.legalName} disabled={!canManage} required />
        </div>
        <div>
          <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
            Documento (CNPJ)
          </label>
          <Input name="documentNumber" defaultValue={organization.documentNumber ?? ""} disabled={!canManage} placeholder="Não informado" />
        </div>
        <div>
          <label className="mb-1 block text-label font-bold uppercase text-card-beige-muted-foreground">
            Organização desde
          </label>
          <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-body-sm text-card-beige-muted-foreground">
            {formatDate(organization.createdAt)}
          </p>
        </div>

        {canManage ? (
          <div className="sm:col-span-2 flex items-center gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              Salvar
            </Button>
            {saved && !pending ? <span className="text-body-sm font-semibold text-primary">Salvo.</span> : null}
          </div>
        ) : (
          <p className="sm:col-span-2 text-caption text-card-beige-muted-foreground">
            Apenas o Administrador pode alterar os dados da empresa.
          </p>
        )}
      </form>
    </section>
  );
}
