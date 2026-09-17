import { ShieldAlert } from "lucide-react";

export function AdminAccessGate() {
  return (
    <section className="card-premium rounded-2xl p-10 text-center">
      <ShieldAlert className="mx-auto h-9 w-9 text-card-beige-muted-foreground" />
      <h2 className="mt-4 text-h2 font-bold text-foreground">Acesso restrito</h2>
      <p className="mx-auto mt-2 max-w-md text-body-sm text-card-beige-muted-foreground">
        O Centro de Administração reúne usuários, permissões e auditoria da organização — só perfis de
        Administrador ou Gestor têm acesso. Fale com a administração se precisar de algo aqui.
      </p>
    </section>
  );
}
