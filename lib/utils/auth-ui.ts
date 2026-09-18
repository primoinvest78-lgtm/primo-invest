/**
 * Classe compartilhada dos campos de texto nas telas de autenticação
 * (login, recuperar/redefinir senha) — cartão é bege (.card-premium,
 * padrão de todo modal do site), então o campo usa bg-card (branco)
 * pelo mesmo motivo do Input/Textarea/Select compartilhados: bege
 * sobre bege é ilegível. Texto digitado em verde (text-success),
 * pedido de propósito para essas telas.
 */
export const AUTH_INPUT_CLASS =
  "h-11 w-full rounded-xl border border-input bg-card px-4 text-sm font-semibold text-success outline-none transition-shadow placeholder:text-muted-foreground placeholder:font-medium focus:border-ring focus:ring-4 focus:ring-ring/20";
