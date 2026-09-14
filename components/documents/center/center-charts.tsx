"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import type { DocumentCenterRow } from "@/lib/data/document-center";
import { CENTER_STATUS_LABEL, type CenterStatus, computeCenterStatus } from "@/lib/utils/document-center-helpers";

function StatusBarChart({ data }: { data: { status: string; total: number }[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: -16, right: 8 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis
            dataKey="status"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }}
          />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "rgba(46, 204, 155, 0.08)" }}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card-lg)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="total" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResponsibleBarChart({ data }: { data: { name: string; total: number }[] }) {
  return (
    <div className="h-[240px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
          <CartesianGrid horizontal={false} stroke="var(--border)" strokeDasharray="4 4" />
          <XAxis type="number" tickLine={false} axisLine={false} tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 11 }} allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            width={110}
            tick={{ fill: "var(--card-beige-muted-foreground)", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(46, 204, 155, 0.08)" }}
            contentStyle={{
              borderRadius: 14,
              border: "1px solid var(--border)",
              boxShadow: "var(--shadow-card-lg)",
              background: "var(--popover)",
              color: "var(--popover-foreground)",
            }}
          />
          <Bar dataKey="total" fill="var(--accent)" radius={[0, 6, 6, 0]} maxBarSize={22} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CenterCharts({ rows }: { rows: DocumentCenterRow[] }) {
  const statusCounts = new Map<CenterStatus, number>();
  for (const row of rows) {
    const status = computeCenterStatus(row);
    statusCounts.set(status, (statusCounts.get(status) ?? 0) + 1);
  }
  const statusData = Array.from(statusCounts.entries())
    .map(([status, total]) => ({ status: CENTER_STATUS_LABEL[status], total }))
    .sort((a, b) => b.total - a.total);

  const pendingByResponsible = new Map<string, number>();
  for (const row of rows) {
    const status = computeCenterStatus(row);
    if (status !== "pendente" && status !== "em_analise") continue;
    const name = row.responsibleName ?? "Sem responsável";
    pendingByResponsible.set(name, (pendingByResponsible.get(name) ?? 0) + 1);
  }
  const responsibleData = Array.from(pendingByResponsible.entries())
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8);

  if (statusData.length < 2 && responsibleData.length === 0) return null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {statusData.length >= 2 ? (
        <div className="card-premium rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-bold text-foreground">Documentos por status</h3>
          <StatusBarChart data={statusData} />
        </div>
      ) : null}
      {responsibleData.length > 0 ? (
        <div className="card-premium rounded-2xl p-5">
          <h3 className="mb-3 text-sm font-bold text-foreground">Pendentes por responsável</h3>
          <ResponsibleBarChart data={responsibleData} />
        </div>
      ) : null}
    </div>
  );
}
