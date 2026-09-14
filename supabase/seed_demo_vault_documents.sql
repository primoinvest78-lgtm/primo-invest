-- Exemplos de documentos no Cofre Digital cobrindo as categorias reais
-- (financeiro, patrimonial, investimento, consórcio, contrato, jurídico,
-- fiscal, seguro, pessoal, outro), pra tirar os cards de categoria do
-- estado "0 documentos" e testar o filtro por URL (?categoria=...) de
-- ponta a ponta. Cada documento usa cliente/conta/passivo/meta/contrato/
-- oportunidade REAIS já existentes no banco — nada de entidade inventada.
--
-- Os 2 documentos reais pré-existentes (RGs) ganham a categoria correta
-- (eram null, mas são claramente documentos pessoais).
update public.documents
set category = 'pessoal'
where id in ('415629e2-2abc-46d6-89b9-2e21e4a9de0d', 'e62ca196-6ca5-4c23-be1d-85bf2e9ac6c1')
  and category is null;

with org as (select 'd34dae9a-6460-4210-906d-e9a973014436'::uuid as id),
new_docs as (
  insert into public.documents (organization_id, client_id, name, document_type, category, status, consortium_contract_id, storage_path)
  select org.id, v.client_id, v.name, 'application/pdf', v.category, 'active', v.consortium_contract_id,
         org.id || '/' || v.client_id || '/' || v.storage_name
  from org, (values
    -- financeiro
    ('bd45ce7d-41d2-4f4c-a057-c7e7d580aa5f'::uuid, 'Extrato Conta Corrente - Carlos Eduardo Martins.pdf', 'financeiro', null::uuid, 'extrato_conta.pdf'),
    -- investimento
    ('40c194a1-f28c-4798-b275-bfcb0f850953'::uuid, 'Relatório Carteira de Investimentos - Beatriz Nascimento.pdf', 'investimento', null::uuid, 'relatorio_carteira.pdf'),
    ('63e52526-d724-4fce-a249-0d89810a08fa'::uuid, 'Relatório de Previdência - José Ricardo Pereira.pdf', 'investimento', null::uuid, 'relatorio_previdencia.pdf'),
    -- patrimonial
    ('bd45ce7d-41d2-4f4c-a057-c7e7d580aa5f'::uuid, 'Contrato de Financiamento de Veículo - Carlos Eduardo Martins.pdf', 'patrimonial', null::uuid, 'contrato_financiamento_veiculo.pdf'),
    ('63e52526-d724-4fce-a249-0d89810a08fa'::uuid, 'Contrato de Financiamento Imobiliário - José Ricardo Pereira.pdf', 'patrimonial', null::uuid, 'contrato_financiamento_imovel.pdf'),
    ('bd45ce7d-41d2-4f4c-a057-c7e7d580aa5f'::uuid, 'Planejamento de Meta - Aposentadoria.pdf', 'patrimonial', null::uuid, 'planejamento_meta_aposentadoria.pdf'),
    -- consórcio
    ('40c194a1-f28c-4798-b275-bfcb0f850953'::uuid, 'Contrato de Consórcio CT-2024-01122.pdf', 'consorcio', '5c7c4458-584f-4539-aa33-b6d64dd28a22'::uuid, 'contrato_consorcio_01122.pdf'),
    ('bd45ce7d-41d2-4f4c-a057-c7e7d580aa5f'::uuid, 'Contrato de Consórcio CT-2024-00981.pdf', 'consorcio', '28190807-39df-469b-b96d-128a8bde0eec'::uuid, 'contrato_consorcio_00981.pdf'),
    -- contrato (proposta comercial ligada a uma oportunidade)
    ('dc06a202-6d19-45ff-8bd1-28f5a263896c'::uuid, 'Proposta Comercial - Plano de Previdência Família.pdf', 'contrato', null::uuid, 'proposta_previdencia_familia.pdf'),
    -- jurídico
    ('54a95058-17c1-42ad-b4f8-e36e3b160c6a'::uuid, 'Procuração - Fernanda Martins.pdf', 'juridico', null::uuid, 'procuracao.pdf'),
    -- fiscal
    ('63e52526-d724-4fce-a249-0d89810a08fa'::uuid, 'Declaração de Imposto de Renda 2025 - José Ricardo Pereira.pdf', 'fiscal', null::uuid, 'declaracao_ir_2025.pdf'),
    -- seguro
    ('dc06a202-6d19-45ff-8bd1-28f5a263896c'::uuid, 'Apólice de Seguro de Vida - Ana Luiza Ferreira.pdf', 'seguro', null::uuid, 'apolice_seguro_vida.pdf'),
    -- outro
    ('54a95058-17c1-42ad-b4f8-e36e3b160c6a'::uuid, 'Ficha Cadastral - Fernanda Martins.pdf', 'outro', null::uuid, 'ficha_cadastral.pdf')
  ) as v(client_id, name, category, consortium_contract_id, storage_name)
  returning id, name, client_id
)
insert into public.document_relationships (document_id, organization_id, entity_type, entity_id)
select nd.id, 'd34dae9a-6460-4210-906d-e9a973014436'::uuid, r.entity_type, r.entity_id
from new_docs nd
join (values
  ('Extrato Conta Corrente - Carlos Eduardo Martins.pdf', 'financial_account', '040c605e-c55e-4f84-bfda-5e6e6ef12d97'::uuid),
  ('Relatório Carteira de Investimentos - Beatriz Nascimento.pdf', 'financial_account', 'f6e0f469-4b3c-4c4a-9187-1f7156067e44'::uuid),
  ('Relatório de Previdência - José Ricardo Pereira.pdf', 'financial_account', '72c76cde-13d2-4680-a3b3-81edd2403c7d'::uuid),
  ('Contrato de Financiamento de Veículo - Carlos Eduardo Martins.pdf', 'liability', '172891bd-979b-4298-a30a-aa328de1bfb6'::uuid),
  ('Contrato de Financiamento Imobiliário - José Ricardo Pereira.pdf', 'liability', 'a868170d-91cf-4e8a-9fb3-5b683e9ac405'::uuid),
  ('Planejamento de Meta - Aposentadoria.pdf', 'wealth_goal', 'a8b51bce-73ba-4e0e-ae62-9cf54adbd0f3'::uuid),
  ('Proposta Comercial - Plano de Previdência Família.pdf', 'opportunity', '91252762-68b9-4787-bbaa-221b12ebc525'::uuid)
) as r(name, entity_type, entity_id) on r.name = nd.name;
