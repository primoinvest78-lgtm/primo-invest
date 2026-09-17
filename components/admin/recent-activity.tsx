"use client";

import { Activity } from "lucide-react";
import { motion } from "motion/react";

import type { AuditLogEntry } from "@/lib/admin/audit-labels";
import { auditActionLabel, moduleLabelForTable } from "@/lib/admin/audit-labels";
import type { OrgMember } from "@/lib/admin/types";
import { memberNameById } from "@/lib/admin/types";
import { formatRelativeTime } from "@/lib/utils/format";

export function RecentActivity({ entries, members }: { entries: AuditLogEntry[]; members: OrgMember[] }) {
  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-primary" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Auditoria</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Atividades recentes</h3>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="mt-4 text-body-sm text-card-beige-muted-foreground">
          Nenhuma atividade registrada ainda.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {entries.map((entry, index) => (
            <motion.li
              key={entry.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03, ease: "easeOut" }}
              whileHover={{ y: -2 }}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border px-4 py-3 transition-all duration-200"
            >
              <p className="min-w-0 truncate text-body-sm text-foreground">
                <span className="font-semibold">{memberNameById(members, entry.userId)}</span>{" "}
                {auditActionLabel(entry.action).toLowerCase()} em{" "}
                <span className="font-semibold">{moduleLabelForTable(entry.tableName)}</span>
              </p>
              <span className="shrink-0 text-caption text-card-beige-muted-foreground">
                {formatRelativeTime(entry.createdAt)}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
