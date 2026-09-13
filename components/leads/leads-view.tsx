"use client";

import { LayoutGrid, List } from "lucide-react";
import { useState } from "react";

import { LeadsBoard } from "@/components/leads/leads-board";
import { LeadsTable } from "@/components/leads/leads-table";
import type { LeadListItem } from "@/lib/data/leads";

export function LeadsView({ leads }: { leads: LeadListItem[] }) {
  const [view, setView] = useState<"kanban" | "list">("kanban");

  return (
    <div className="space-y-4">
      <div className="flex justify-end gap-1 rounded-xl border border-border bg-card p-1">
        <button
          type="button"
          onClick={() => setView("kanban")}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
            view === "kanban"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          Kanban
        </button>
        <button
          type="button"
          onClick={() => setView("list")}
          className={[
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150",
            view === "list"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          <List className="h-3.5 w-3.5" />
          Lista
        </button>
      </div>

      {view === "kanban" ? <LeadsBoard leads={leads} /> : <LeadsTable leads={leads} />}
    </div>
  );
}
