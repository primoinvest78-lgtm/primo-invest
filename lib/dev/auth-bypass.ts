// ============================================================================
// ⚠️  ATENÇÃO — BYPASS DE AUTENTICAÇÃO SOMENTE PARA DESENVOLVIMENTO LOCAL ⚠️
// ============================================================================
// Isto existe só para permitir rodar o app localmente sem precisar de um
// Supabase configurado. NUNCA deve funcionar em produção.
//
// Duas travas independentes precisam estar ativas ao mesmo tempo:
//   1. NODE_ENV !== "production" — definido automaticamente pelo Next.js em
//      qualquer `next build`/deploy real (inclusive na Vercel). Ninguém
//      configura isso manualmente, então não pode ser ativado por engano.
//   2. NEXT_PUBLIC_BYPASS_AUTH === "true" — só deve existir em `.env.local`.
//      NUNCA adicione essa variável nas Environment Variables da Vercel
//      (Production, Preview ou Development), em nenhuma hipótese.
//
// Mesmo que alguém configure NEXT_PUBLIC_BYPASS_AUTH=true na Vercel por
// engano, a checagem de NODE_ENV continua bloqueando o bypass em produção.
// ============================================================================
export function isAuthBypassEnabled(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_BYPASS_AUTH === "true"
  );
}
