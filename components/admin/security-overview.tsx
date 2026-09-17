import { CheckCircle2, Lock, XCircle } from "lucide-react";

/**
 * Nunca mostra senha, token, secret ou chave — e nunca finge que existe
 * proteção que o backend não tem. As duas listas abaixo são honestas:
 * a primeira é o que está de fato ativo (RLS, funções com checagem de
 * perfil, trilha de auditoria); a segunda é o que ainda não existe.
 */
const ACTIVE_PROTECTIONS = [
  "Row Level Security em todas as tabelas — cada consulta já filtra pela organização do usuário logado.",
  "Ações administrativas sensíveis (alterar perfil, ativar/desativar, conceder permissão) passam por funções com checagem de perfil embutida, não por acesso direto às tabelas.",
  "A organização nunca fica sem nenhum Administrador ativo — o sistema recusa a última remoção/rebaixamento.",
  "Toda alteração em usuários, permissões e dados operacionais gera um evento na auditoria, com o que mudou antes e depois.",
  "Nenhuma chave de serviço (service role) é usada pela aplicação — todo acesso respeita a mesma sessão e as mesmas regras do usuário logado.",
];

const NOT_IMPLEMENTED = [
  "Autenticação em duas etapas (2FA)",
  "Lista de IPs permitidos",
  "Expiração ou revogação manual de sessões ativas",
  "Aprovação em duas pessoas para ações críticas",
];

export function SecurityOverview() {
  return (
    <section className="card-premium rounded-2xl p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Lock className="h-4 w-4 text-primary" />
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Configurações</p>
          <h3 className="mt-0.5 text-h2 font-bold text-foreground">Segurança</h3>
        </div>
      </div>

      <p className="mt-3 text-body-sm text-card-beige-muted-foreground">
        Nenhuma senha, token ou credencial é exibida nesta tela — a plataforma não guarda esse dado em
        lugar nenhum acessível pela aplicação.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div>
          <p className="text-label font-bold uppercase text-primary">Ativo hoje</p>
          <ul className="mt-2 space-y-2">
            {ACTIVE_PROTECTIONS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-body-sm text-foreground">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-label font-bold uppercase text-card-beige-muted-foreground">Ainda não implementado</p>
          <ul className="mt-2 space-y-2">
            {NOT_IMPLEMENTED.map((item) => (
              <li key={item} className="flex items-start gap-2 text-body-sm text-card-beige-muted-foreground">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
