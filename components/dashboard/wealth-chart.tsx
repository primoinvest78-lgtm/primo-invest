import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { WealthPoint } from "@/lib/mock/dashboard";

export function WealthChart({ data }: { data: WealthPoint[] }) {
  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-5 shadow-[0_12px_30px_rgba(7,26,45,0.03)]">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#64748B]">Patrimônio</p>
          <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071A2D]">
            Patrimônio sob gestão
          </h3>
        </div>
        <p className="text-sm text-[#64748B]">Evolução nos últimos 12 meses</p>
      </div>

      <div className="h-[330px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="wealthArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1F5F96" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#1F5F96" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#DCE3EA" strokeDasharray="3 3" />
            <XAxis
              dataKey="month"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              tickFormatter={(value: number) => `R$ ${Math.round(value / 1000000)}M`}
            />
            <Tooltip
              formatter={(value: string | number | readonly (string | number)[] | undefined) => {
                const numericValue =
                  typeof value === "number"
                    ? value
                    : Number(String(Array.isArray(value) ? value[0] : value ?? 0).replace(/[^0-9.-]/g, "")) || 0;

                return [`R$ ${new Intl.NumberFormat("pt-BR").format(numericValue)}`, "Patrimônio"];
              }}
              labelFormatter={(label) => `${label}`}
              contentStyle={{
                borderRadius: 14,
                border: "1px solid #DCE3EA",
                boxShadow: "0 12px 28px rgba(7, 26, 45, 0.08)",
                background: "#FFFFFF",
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#123E68"
              strokeWidth={3}
              fill="url(#wealthArea)"
              activeDot={{ r: 6, fill: "#C9A45C", stroke: "#FFFFFF", strokeWidth: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
