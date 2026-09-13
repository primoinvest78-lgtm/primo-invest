-- Dados de EXEMPLO/TESTE pra popular /consorcios/parcelas no ambiente
-- demo. Reaproveita os 2 contratos reais já existentes (CT-2024-01122
-- e CT-2024-00981), usando o installment_amount de cada um — nenhum
-- valor novo inventado, só o cronograma detalhado que ainda não
-- existia. Não altera paid_installments/total_installments do
-- contrato (contadores oficiais continuam os mesmos).

-- Contrato A: CT-2024-01122 (Porto Consórcios, Beatriz, 1800/parcela, 22 pagas de 80)
insert into public.consortium_installments
  (consortium_contract_id, installment_number, due_date, amount, paid_amount, paid_at, status)
values
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 20, '2026-06-13', 1800.00, 1800.00, '2026-06-13', 'paid'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 21, '2026-07-13', 1800.00, 1800.00, '2026-07-14', 'paid'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 22, '2026-08-13', 1800.00, 1800.00, '2026-08-13', 'paid'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 23, '2026-08-28', 1800.00, null, null, 'pending'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 24, '2026-09-24', 1800.00, null, null, 'pending'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 25, '2026-10-24', 1800.00, null, null, 'pending'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 26, '2026-12-24', 1800.00, null, null, 'negotiated');

-- Contrato B: CT-2024-00981 (Porto Consórcios, Carlos, 2100/parcela, 14 pagas de 180)
insert into public.consortium_installments
  (consortium_contract_id, installment_number, due_date, amount, paid_amount, paid_at, status)
values
  ('28190807-39df-469b-b96d-128a8bde0eec', 12, '2026-06-13', 2100.00, 2100.00, '2026-06-13', 'paid'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 13, '2026-07-13', 2100.00, 2100.00, '2026-07-13', 'paid'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 14, '2026-08-13', 2100.00, 2100.00, '2026-08-15', 'paid'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 15, '2026-08-30', 2100.00, null, null, 'pending'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 16, '2026-09-20', 2100.00, null, null, 'pending'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 17, '2026-10-20', 2100.00, null, null, 'pending'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 18, '2026-12-20', 2100.00, null, null, 'negotiated');

-- Eventos de exemplo pro Histórico / Reajustes e negociações (mesma
-- tabela consortium_events já usada pelas actions reais do módulo).
insert into public.consortium_events
  (consortium_contract_id, event_type, event_date, description, metadata)
values
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 'negotiation', '2026-09-13',
   'Parcela 26 negociada: prorrogação por dificuldade financeira temporária.',
   '{"installmentNumber": 26, "previousDueDate": "2026-11-24", "newDueDate": "2026-12-24", "condition": "Prorrogação por dificuldade financeira temporária"}'::jsonb),
  ('28190807-39df-469b-b96d-128a8bde0eec', 'negotiation', '2026-09-13',
   'Parcela 18 negociada: acordo de prorrogação de 30 dias.',
   '{"installmentNumber": 18, "previousDueDate": "2026-11-20", "newDueDate": "2026-12-20", "condition": "Acordo de prorrogação de 30 dias"}'::jsonb),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 'adjustment', '2026-09-13',
   'Parcela 25: valor alterado de 1750.00 para 1800.00. Motivo: reajuste anual do grupo (INCC).',
   '{"installmentNumber": 25, "previousAmount": 1750.00, "newAmount": 1800.00, "reason": "Reajuste anual do grupo (INCC)"}'::jsonb);
