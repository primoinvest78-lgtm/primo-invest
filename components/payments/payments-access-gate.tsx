import { ShieldAlert } from "lucide-react";

export function PaymentsAccessGate() {
  return (
    <section className="card-premium rounded-2xl p-10 text-center">
      <ShieldAlert className="mx-auto h-9 w-9 text-card-beige-muted-foreground" />
      <h2 className="mt-4 text-h2 font-bold text-foreground">Acesso restrito</h2>
      <p className="mx-auto mt-2 max-w-md text-body-sm text-card-beige-muted-foreground">
        O motor de pagamentos lida com conciliação financeira — só perfis de Administrador, Gestor,
        Financeiro ou Operacional têm acesso. Fale com a administração se precisar enviar ou revisar um
        comprovante.
      </p>
    </section>
  );
}
