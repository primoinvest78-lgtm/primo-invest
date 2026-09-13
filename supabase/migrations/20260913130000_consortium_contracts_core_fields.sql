-- Campos centrais de um contrato de consórcio que ainda não existiam no
-- schema (grupo, cota, bem/serviço, taxa de administração, fundo de
-- reserva, seguro, data de contemplação, observações). Todos
-- nullable/aditivos — nenhum dado existente é afetado, linhas atuais
-- simplesmente mostram "Não informado" até o assessor preencher.
--
-- NOTA: uma coluna co_holder_client_id (cotitular) foi adicionada e
-- removida no mesmo dia — ela criava uma segunda FK entre
-- consortium_contracts e clients, o que quebra qualquer embed
-- implícito do PostgREST entre as duas tabelas (todo lugar que já
-- buscava consortium_contracts junto de clients passou a dar
-- PGRST201 "more than one relationship was found"). Ver memória do
-- projeto sobre esse incidente antes de tentar reintroduzir um campo
-- de segundo vínculo com clients nesta tabela.
alter table public.consortium_contracts
  add column if not exists group_number text,
  add column if not exists quota_number text,
  add column if not exists asset_description text,
  add column if not exists admin_fee_percentage numeric,
  add column if not exists reserve_fund_percentage numeric,
  add column if not exists insurance_amount numeric,
  add column if not exists contemplated_at date,
  add column if not exists notes text;

-- Permite vincular documentos existentes (módulo Documentos) a um
-- contrato específico, sem criar armazenamento paralelo. Nullable:
-- documentos sem contrato continuam só client-scoped, como hoje.
alter table public.documents
  add column if not exists consortium_contract_id uuid references public.consortium_contracts(id) on delete set null;

create index if not exists documents_consortium_contract_id_idx
  on public.documents(consortium_contract_id);
