import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { AllocationItem } from "@/lib/mock/dashboard";

export function AllocationChart({ data }: { data: AllocationItem[] }) {
  return (
    <div className="rounded-2xl border border-[#DCE3EA] bg-white p-5 shadow-[0_12px_30px_rgba(7,26,45,0.03)]">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#64748B]">Alocação</p>
        <h3 className="mt-1 text-2xl font-bold tracking-[-0.04em] text-[#071A2D]">
          Alocação patrimonial
        </h3>
      </div>

      <div className="relative h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={2}
              stroke="rgba(255,255,255,0.8)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-[10px] uppercase tracking-[0.18em] text-[#64748B]">Total</div>
            <div className="mt-1 text-xl font-bold tracking-[-0.04em] text-[#071A2D]">R$ 48,75 mi</div>
          </div>
        </div>
      </div>

      <div className="mt-2 space-y-2">
        {data.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[#142235]">{item.name}</span>
            </div>
            <span className="font-semibold text-[#071A2D]">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
