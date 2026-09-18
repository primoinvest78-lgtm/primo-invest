import Image from "next/image";
import type { ReactNode } from "react";

import { ReflexGame } from "@/components/system/reflex-game";
import { LOGO_SRC } from "@/lib/constants/brand";

export function StatusPage({
  eyebrow,
  code,
  title,
  description,
  action,
  supportCode,
}: {
  eyebrow: string;
  code: string;
  title: string;
  description: string;
  action?: ReactNode;
  supportCode?: string | null;
}) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-secondary px-4 py-10">
      <div className="block-navy-3d w-full max-w-[560px] rounded-2xl p-6 sm:p-10">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-white/10">
            <Image
              src={LOGO_SRC}
              alt="Primo Invest"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>

          <p className="mt-5 text-label font-bold uppercase text-primary">{eyebrow}</p>
          <p className="mt-1 text-[13px] font-bold uppercase tracking-[0.3em] text-white/30">{code}</p>
          <h1 className="mt-3 text-h1 font-bold tracking-[-0.03em] text-white">{title}</h1>
          <p className="mt-3 max-w-md text-body text-white/70">{description}</p>

          {action ? <div className="mt-6">{action}</div> : null}
        </div>

        <div className="mt-8 border-t border-white/10 pt-6">
          <ReflexGame />
        </div>

        {supportCode ? (
          <p className="mt-6 text-center text-[11px] text-white/30">
            Código de referência: {supportCode}
          </p>
        ) : null}
      </div>
    </div>
  );
}
