"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function NoAccessActions() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function switchAccount() {
    setPending(true);
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <Button className="w-full" disabled={pending} onClick={switchAccount}>
        {pending ? "Saindo…" : "Sair e entrar com outra conta"}
      </Button>
      <Button variant="outline" className="w-full" disabled={pending} onClick={() => router.refresh()}>
        Já fui liberado, tentar de novo
      </Button>
    </div>
  );
}
