import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Kpi } from "@/components/consortiums/contract-shared";
import type { ConsortiumContract } from "@/lib/data/consortiums";
import type { TaskItem } from "@/lib/data/tasks";
import {
  contractOutstandingBalance,
  contractProgressPct,
  contractRemainingInstallments,
  CONTRACT_STATUS_VARIANT,
  contractStatusLabel,
} from "@/lib/utils/consortium-helpers";
import { formatCurrencyBRL, formatDate } from "@/lib/utils/format";

function nextDueDate(contract: ConsortiumContract): string | null {
  if (!contract.startDate || contractRemainingInstallments(contract) === 0) return null;
  const start = new Date(contract.startDate);
  start.setMonth(start.getMonth() + contract.paidInstallments + 1);
  return start.toISOString().slice(0, 10);
}

export function ContractOverviewTab({
  contract,
  tasks,
}: {
  contract: ConsortiumContract;
  tasks: TaskItem[];
}) {
  const pct = contractProgressPct(contract);
  const outstanding = contractOutstandingBalance(contract);
  const remaining = contractRemainingInstallments(contract);
  const dueDate = nextDueDate(contract);
  const openTasks = tasks.filter((t) => t.status !== "completed" && t.status !== "cancelled");

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="Crédito contratado" value={formatCurrencyBRL(contract.creditAmount)} />
        <Kpi label="Saldo devedor" value={outstanding !== null ? formatCurrencyBRL(outstanding) : "—"} valueClassName="text-destructive" />
        <Kpi label="% pago" value={`${pct.toFixed(0)}%`} animate={false} />
        <Kpi label="Parcelas restantes" value={String(remaining)} animate={false} />
        <Kpi label="Parcela atual" value={String(contract.paidInstallments + 1)} animate={false} />
        <Kpi label="Próximo vencimento" value={dueDate ? formatDate(dueDate) : "—"} animate={false} />
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-h2 font-bold text-foreground">Progresso do contrato</h3>
          <Badge variant={CONTRACT_STATUS_VARIANT[contract.status] ?? "outline"}>
            {contractStatusLabel(contract.status)}
          </Badge>
        </div>
        <div className="mb-2 flex items-end justify-between gap-2">
          <span className="text-2xl font-bold text-foreground">
            {contract.paidInstallments} de {contract.totalInstallments} parcelas
          </span>
          <span className="text-sm font-semibold text-card-beige-muted-foreground">{pct.toFixed(0)}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-black/10">
          <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="card-premium rounded-2xl p-5 md:p-6">
        <h3 className="mb-4 text-h2 font-bold text-foreground">Próximas ações</h3>
        {openTasks.length === 0 ? (
          <p className="text-body-sm text-card-beige-muted-foreground">
            Nenhuma tarefa pendente vinculada a este contrato.
          </p>
        ) : (
          <div className="space-y-2">
            {openTasks.map((task) => (
              <Link
                key={task.id}
                href="/tarefas"
                className="flex items-center justify-between gap-2 rounded-xl border border-black/10 bg-black/5 px-3.5 py-2.5 text-sm transition-colors duration-150 hover:bg-black/10"
              >
                <span className="min-w-0 truncate font-semibold text-foreground">{task.title}</span>
                <span className="shrink-0 text-xs text-card-beige-muted-foreground">
                  {task.dueAt ? formatDate(task.dueAt) : "Sem prazo"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
