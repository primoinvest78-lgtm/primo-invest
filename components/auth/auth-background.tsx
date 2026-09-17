/**
 * Fundo animado das telas de autenticação — degradê de blobs à deriva
 * (azul-marinho, verde-menta e dourado, ecoando a logo) mais um
 * traçado de "mercado em alta" bem sutil ao fundo. Só transform e
 * opacity (leve, sem layout thrashing); `prefers-reduced-motion` já
 * é respeitado globalmente (ver app/globals.css).
 */
export function AuthBackground() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden bg-secondary">
      {/* Degradê base — mais escuro nas bordas, ecoando o fundo da logo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 0%, #16255a 0%, #101b3d 55%, #0a1330 100%)",
        }}
      />

      {/* Blobs em degradê à deriva */}
      <div
        className="absolute top-[-10%] left-[-10%] h-[55%] w-[55%] rounded-full opacity-40 blur-3xl [animation:auth-drift-1_22s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #2ecc9b 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-[10%] right-[-15%] h-[60%] w-[60%] rounded-full opacity-30 blur-3xl [animation:auth-drift-2_26s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #d4af7a 0%, transparent 70%)" }}
      />
      <div
        className="absolute bottom-[-15%] left-[15%] h-[50%] w-[50%] rounded-full opacity-30 blur-3xl [animation:auth-drift-3_30s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, #1e3a72 0%, transparent 70%)" }}
      />

      {/* Grade fina, tipo terminal de mercado — quase imperceptível */}
      <div
        className="absolute inset-0 opacity-[0.05] [animation:auth-grid-pan_40s_linear_infinite]"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Linha de "mercado em alta" */}
      <svg
        className="absolute inset-x-0 bottom-0 h-[45%] w-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="auth-line-gradient" x1="0" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2ecc9b" stopOpacity="0" />
            <stop offset="45%" stopColor="#2ecc9b" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#d4af7a" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id="auth-area-gradient" x1="0" y1="0" x2="0" y2="400" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2ecc9b" stopOpacity="0.14" />
            <stop offset="100%" stopColor="#2ecc9b" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path
          d="M0 320 L100 300 L200 340 L300 260 L400 280 L500 190 L600 220 L700 140 L800 170 L900 90 L1000 120 L1100 50 L1200 70"
          fill="none"
          stroke="url(#auth-line-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray="1400"
          className="[animation:auth-line-draw_3.5s_ease-out_forwards]"
        />
        <path
          d="M0 320 L100 300 L200 340 L300 260 L400 280 L500 190 L600 220 L700 140 L800 170 L900 90 L1000 120 L1100 50 L1200 70 L1200 400 L0 400 Z"
          fill="url(#auth-area-gradient)"
        />

        {[
          { cx: 500, cy: 190 },
          { cx: 900, cy: 90 },
          { cx: 1100, cy: 50 },
        ].map((point, index) => (
          <circle
            key={`${point.cx}-${point.cy}`}
            cx={point.cx}
            cy={point.cy}
            r={5}
            fill="#d4af7a"
            style={{ animation: `auth-pulse-dot ${2.4 + index * 0.4}s ease-in-out infinite` }}
          />
        ))}
      </svg>
    </div>
  );
}
