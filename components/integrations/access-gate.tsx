import { ShieldAlert } from "lucide-react";

/**
 * O Centro de Integrações mexe em credencial e conexão externa — a
 * mesma fronteira que a RLS de `integration_connections` já impõe no
 * banco (`has_org_role(... admin/manager/operations)`). Isto é só a
 * versão amigável dessa mesma regra: em vez de a página aparecer vazia
 * (a RLS filtraria tudo silenciosamente) ou estourar um erro de
 * permissão negada, mostra com clareza por que o usuário não vê nada.
 */
export function IntegrationsAccessGate() {
  return (
    <section className="card-premium rounded-2xl p-10 text-center">
      <ShieldAlert className="mx-auto h-9 w-9 text-card-beige-muted-foreground" />
      <h2 className="mt-4 text-h2 font-bold text-foreground">Acesso restrito</h2>
      <p className="mx-auto mt-2 max-w-md text-body-sm text-card-beige-muted-foreground">
        A área de Integrações reúne credenciais e conexões externas — só perfis de administração,
        gestão ou operações têm acesso. Fale com a administração se precisar configurar uma
        integração.
      </p>
    </section>
  );
}
