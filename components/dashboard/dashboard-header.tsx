import { Bell, ChevronDown, Search } from "lucide-react";

export function DashboardHeader() {
  return (
    <header className="border-b border-[#DCE3EA] bg-white/90 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-6 xl:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] text-[#071A2D] lg:hidden"
            aria-label="Abrir menu"
          >
            <span className="flex flex-col gap-1.5">
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
              <span className="h-0.5 w-4 rounded-full bg-current" />
            </span>
          </button>
          <div className="hidden md:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#64748B]">
              Primo Invest
            </p>
            <h2 className="text-base font-semibold tracking-[-0.02em] text-[#071A2D]">
              Dashboard
            </h2>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end gap-3">
          <label className="hidden w-full max-w-[420px] items-center gap-2 rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] px-3 py-2.5 md:flex">
            <Search className="h-4 w-4 text-[#64748B]" />
            <input
              type="text"
              value=""
              readOnly
              placeholder="Buscar clientes, investimentos, documentos..."
              className="w-full border-none bg-transparent text-sm text-[#142235] placeholder:text-[#64748B] focus:outline-none"
            />
          </label>

          <div className="inline-flex items-center gap-2 rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] px-2.5 py-2 text-xs font-medium text-[#142235]">
            <span className="h-2 w-2 rounded-full bg-[#18794E]" />
            Produção
            <ChevronDown className="h-3.5 w-3.5 text-[#64748B]" />
          </div>

          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] text-[#071A2D] transition-colors hover:border-[#C9A45C] hover:text-[#071A2D]"
            aria-label="Notificações"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C9A45C] px-1 text-[9px] font-semibold text-[#071A2D]">
              3
            </span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl border border-[#DCE3EA] bg-[#F5F7FA] px-2 py-1.5 text-left transition-colors hover:border-[#C9A45C]"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#071A2D] text-sm font-semibold text-[#FFFFFF]">
              A
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold text-[#071A2D]">Anderson</div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[#64748B]">
                Diretor
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-[#64748B]" />
          </button>
        </div>
      </div>
    </header>
  );
}
