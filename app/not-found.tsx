import Link from "next/link";

import { Button } from "@/components/ui/button";
import { StatusPage } from "@/components/system/status-page";

export default function NotFound() {
  return (
    <StatusPage
      eyebrow="Primo Invest"
      code="Erro 404"
      title="Essa página não existe"
      description="O endereço não foi encontrado — pode ter sido movido ou o link está incorreto. Enquanto isso, aproveite o joguinho aqui abaixo."
      action={
        <Link href="/dashboard">
          <Button size="lg">Voltar ao início</Button>
        </Link>
      }
    />
  );
}
