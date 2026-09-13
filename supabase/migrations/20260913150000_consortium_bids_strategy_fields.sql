-- consortium_bids.result só permitia pending/approved/rejected — um
-- resquício da versão original da tela /consorcios/lances. As actions
-- reais do módulo (addBid/updateBid, construídas na evolução de
-- Contratos) já gravam pending/won/lost/cancelled, que nunca foi
-- permitido pelo banco; nenhum lance real existe ainda (0 linhas),
-- então é seguro substituir em vez de só ampliar. Adiciona também
-- "analyzing" e "expired" pro vocabulário completo de Lances
-- (Ofertado, Em análise, Contemplado, Não contemplado, Cancelado,
-- Expirado).
alter table public.consortium_bids
  drop constraint if exists consortium_bids_result_check;

alter table public.consortium_bids
  add constraint consortium_bids_result_check
  check (result = ANY (ARRAY['pending'::text, 'analyzing'::text, 'won'::text, 'lost'::text, 'cancelled'::text, 'expired'::text]));

-- Quem registrou o lance (nome, não FK — sem risco de ambiguidade de
-- relacionamento) e o protocolo derivado do próprio id na exibição,
-- sem precisar de coluna nova pra isso.
alter table public.consortium_bids
  add column if not exists created_by_name text;

-- Regras do grupo/contrato pra lances (modalidades permitidas, %
-- mínimo/máximo, base de cálculo, desempate, limite de lance
-- embutido, prazo, elegibilidade, regras pós-contemplação, próxima
-- assembleia) — cada contrato/grupo pode ter regras diferentes, por
-- isso um único campo flexível em vez de colunas fixas que assumiriam
-- uma regra universal. Nullable: sem regra cadastrada, a tela mostra
-- "não informado", nunca assume um padrão.
alter table public.consortium_contracts
  add column if not exists bid_rules jsonb;
