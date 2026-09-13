import Link from "next/link";

import { InfoField } from "@/components/consortiums/contract-shared";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

export function ContractDataTab({ contract }: { contract: ConsortiumContract }) {
  return (
    <div className="space-y-5">
      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Cliente</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Titular</p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {contract.clientId ? (
                <Link href={`/clientes/${contract.clientId}`} className="text-primary hover:underline">
                  {contract.clientName}
                </Link>
              ) : (
                "Não informado"
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Consórcio</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoField label="Administradora" value={contract.administratorName} />
          <InfoField label="Nº do contrato" value={contract.contractNumber} />
          <InfoField label="Tipo/categoria" value={contract.consortiumType} />
          <InfoField label="Grupo" value={contract.groupNumber} />
          <InfoField label="Cota" value={contract.quotaNumber} />
          <InfoField label="Bem/serviço" value={contract.assetDescription} />
        </div>
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Financeiro</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <InfoField label="Valor do crédito" value={formatCurrencyBRL(contract.creditAmount)} />
          <InfoField label="Parcela" value={formatCurrencyBRL(contract.installmentAmount)} />
          <InfoField label="Prazo" value={`${contract.totalInstallments} parcelas`} />
          <InfoField
            label="Taxa de administração"
            value={contract.adminFeePercentage !== null ? `${contract.adminFeePercentage}%` : null}
          />
          <InfoField
            label="Fundo de reserva"
            value={contract.reserveFundPercentage !== null ? `${contract.reserveFundPercentage}%` : null}
          />
          <InfoField
            label="Seguro"
            value={contract.insuranceAmount !== null ? formatCurrencyBRL(contract.insuranceAmount) : null}
          />
        </div>
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Datas</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <InfoField label="Adesão/início" value={formatDate(contract.startDate)} />
          <InfoField label="Prazo final" value={formatDate(contract.endDate)} />
          <InfoField label="Contemplação" value={formatDate(contract.contemplatedAt)} />
          <InfoField label="Última atualização" value={formatDate(contract.updatedAt)} />
        </div>
      </div>
    </div>
  );
}
