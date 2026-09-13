import { Badge } from "@/components/ui/badge";
import type { ClientProfile } from "@/lib/data/clients";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

const CONTACT_LABEL: Record<string, string> = {
  email: "E-mail",
  phone: "Telefone",
  mobile: "Celular",
  whatsapp: "WhatsApp",
};

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-label font-bold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value ?? "—"}</p>
    </div>
  );
}

export function OverviewTab({ client }: { client: ClientProfile }) {
  const holdingsTotal = client.financial_accounts.reduce(
    (sum, account) =>
      sum + account.holdings.reduce((s, h) => s + Number(h.valuation ?? 0), 0),
    0,
  );
  const consortiumTotal = client.consortium_contracts
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + Number(c.credit_amount ?? 0), 0);
  const liabilitiesTotal = client.liabilities
    .filter((l) => l.status === "active")
    .reduce((sum, l) => sum + Number(l.outstanding_amount ?? 0), 0);

  const primaryAddress = client.client_addresses.find((a) => a.is_primary) ?? client.client_addresses[0];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-label font-bold uppercase text-muted-foreground">
            Patrimônio (ativos)
          </p>
          <p className="mt-2 text-h2 font-bold text-foreground">
            {formatCurrencyBRL(holdingsTotal + consortiumTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-label font-bold uppercase text-muted-foreground">Passivos</p>
          <p className="mt-2 text-h2 font-bold text-destructive">
            {formatCurrencyBRL(liabilitiesTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="text-label font-bold uppercase text-muted-foreground">Líquido</p>
          <p className="mt-2 text-h2 font-bold text-foreground">
            {formatCurrencyBRL(holdingsTotal + consortiumTotal - liabilitiesTotal)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Dados cadastrais</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome completo" value={client.full_name} />
          <Field label="Nome preferido" value={client.preferred_name} />
          <Field label="Documento" value={client.document_number} />
          <Field label="Nascimento" value={formatDate(client.birth_date)} />
          <Field label="Status" value={client.status} />
          <Field
            label="Endereço principal"
            value={
              primaryAddress
                ? [primaryAddress.street, primaryAddress.number, primaryAddress.city, primaryAddress.state]
                    .filter(Boolean)
                    .join(", ")
                : null
            }
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Contatos</h3>
        {client.client_contacts.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Nenhum contato cadastrado.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {client.client_contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between rounded-xl border border-border bg-muted/60 px-3.5 py-3"
              >
                <div>
                  <p className="text-label font-bold uppercase text-muted-foreground">
                    {CONTACT_LABEL[contact.contact_type] ?? contact.contact_type}
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{contact.value}</p>
                </div>
                {contact.is_primary ? <Badge>Principal</Badge> : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Tags</h3>
        <div className="flex flex-wrap gap-2">
          {client.client_tags.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">Nenhuma tag associada.</p>
          ) : (
            client.client_tags.map((ct) =>
              ct.tags ? (
                <Badge key={ct.tags.id} variant="outline">
                  {ct.tags.name}
                </Badge>
              ) : null,
            )
          )}
        </div>
      </div>
    </div>
  );
}
