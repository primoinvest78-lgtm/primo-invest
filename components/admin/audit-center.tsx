"use client";

import { FileSearch, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";

import { AuditDetailDialog } from "@/components/admin/audit-detail-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchAuditLogs } from "@/lib/actions/audit";
import { memberNameById, type OrgMember } from "@/lib/admin/types";
import {
  AUDIT_ACTION_LABEL,
  TABLE_MODULE_LABEL,
  auditActionLabel,
  moduleLabelForTable,
  type AuditLogEntry,
  type AuditLogFilters,
} from "@/lib/admin/audit-labels";
import { formatDateTime } from "@/lib/utils/format";

const NONE = "all";

// Mesma fonte que `listAuditLogs` usa pra resolver o filtro de módulo de
// volta pro conjunto de tabelas — garante que toda opção do dropdown
// bate com pelo menos uma tabela real (nada de opção que nunca acha nada).
const AUDIT_MODULES = Array.from(new Set(Object.values(TABLE_MODULE_LABEL))).sort((a, b) =>
  a.localeCompare(b, "pt-BR"),
);

export function AuditCenter({
  members,
  initialUserId,
}: {
  members: OrgMember[];
  initialUserId: string | null;
}) {
  const [userId, setUserId] = useState(initialUserId ?? NONE);
  const [moduleFilter, setModuleFilter] = useState(NONE);
  const [action, setAction] = useState(NONE);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [selected, setSelected] = useState<AuditLogEntry | null>(null);
  const [pending, startTransition] = useTransition();

  const filters: AuditLogFilters = useMemo(
    () => ({
      userId: userId === NONE ? undefined : userId,
      module: moduleFilter === NONE ? undefined : moduleFilter,
      action: action === NONE ? undefined : action,
      search: search.trim() || undefined,
    }),
    [userId, moduleFilter, action, search],
  );

  useEffect(() => {
    startTransition(async () => {
      const result = await fetchAuditLogs(filters, page);
      setEntries(result.entries);
      setHasMore(result.hasMore);
    });
  }, [filters, page]);

  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <FileSearch className="h-4 w-4 text-primary" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Governança</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Central de auditoria</h3>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Select value={userId} onValueChange={(v) => { setUserId(v ?? NONE); setPage(0); }}>
          <SelectTrigger className="w-full">
            <SelectValue>{() => (userId === NONE ? "Todos os usuários" : memberNameById(members, userId))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todos os usuários</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.userId} value={m.userId}>
                {m.fullName ?? m.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={moduleFilter} onValueChange={(v) => { setModuleFilter(v ?? NONE); setPage(0); }}>
          <SelectTrigger className="w-full">
            <SelectValue>{() => (moduleFilter === NONE ? "Todos os módulos" : moduleFilter)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todos os módulos</SelectItem>
            {AUDIT_MODULES.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={action} onValueChange={(v) => { setAction(v ?? NONE); setPage(0); }}>
          <SelectTrigger className="w-full">
            <SelectValue>{() => (action === NONE ? "Todas as ações" : auditActionLabel(action))}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NONE}>Todas as ações</SelectItem>
            {Object.entries(AUDIT_ACTION_LABEL).map(([code, label]) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Buscar por tabela ou ID do objeto"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-black/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-black/10 bg-black/5 text-left">
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Usuário</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Ação</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Módulo</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Data/hora</th>
              <th className="px-4 py-3 text-label font-bold uppercase text-card-beige-muted-foreground">Resultado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {pending && entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-card-beige-muted-foreground" />
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-body-sm text-card-beige-muted-foreground">
                  Nenhum evento encontrado para esses filtros.
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-b border-black/10 last:border-b-0">
                  <td className="px-4 py-3 font-semibold text-foreground">{memberNameById(members, entry.userId)}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{auditActionLabel(entry.action)}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{moduleLabelForTable(entry.tableName)}</td>
                  <td className="px-4 py-3 text-card-beige-muted-foreground">{formatDateTime(entry.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                      Sucesso
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => setSelected(entry)}>
                      Ver detalhes
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <Button size="sm" variant="outline" disabled={page === 0 || pending} onClick={() => setPage((p) => Math.max(p - 1, 0))}>
          Anterior
        </Button>
        <span className="text-caption text-card-beige-muted-foreground">Página {page + 1}</span>
        <Button size="sm" variant="outline" disabled={!hasMore || pending} onClick={() => setPage((p) => p + 1)}>
          Próxima
        </Button>
      </div>

      <AuditDetailDialog
        entry={selected}
        userName={selected ? memberNameById(members, selected.userId) : ""}
        onClose={() => setSelected(null)}
      />
    </section>
  );
}
