-- Exemplos de lances (incluindo 2 contemplações) pros 2 contratos
-- reais já existentes, pra testar /consorcios/lances de ponta a
-- ponta: histórico do grupo (média/mín/máx), análise vs. média,
-- contemplação (aba do contrato), pós-contemplação (tarefa criada) e
-- integração com Tarefas.
insert into public.consortium_bids (consortium_contract_id, bid_type, bid_amount, bid_percentage, bid_date, result, notes)
values
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 'livre', 42000.00, 35.0, '2026-03-15', 'lost', 'Lance não contemplado na assembleia de março.'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 'livre', 54000.00, 45.0, '2026-06-15', 'lost', 'Lance não contemplado na assembleia de junho.'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 'livre', 66000.00, 55.0, '2026-08-15', 'won', 'Lance vencedor na assembleia de agosto.'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 'embutido', 122500.00, 35.0, '2026-04-10', 'lost', 'Lance com embutido, não contemplado.'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 'embutido', 168000.00, 48.0, '2026-08-10', 'won', 'Lance vencedor com uso de lance embutido de 25% do crédito.');

insert into public.consortium_events (consortium_contract_id, event_type, event_date, description)
values
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 'bid_won', '2026-08-15', 'Lance vencedor'),
  ('5c7c4458-584f-4539-aa33-b6d64dd28a22', 'contemplation', '2026-08-15', 'Contemplação registrada via lance vencedor.'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 'bid_won', '2026-08-10', 'Lance vencedor'),
  ('28190807-39df-469b-b96d-128a8bde0eec', 'contemplation', '2026-08-10', 'Contemplação registrada via lance vencedor.');

update public.consortium_contracts set contemplated_at = '2026-08-15' where id = '5c7c4458-584f-4539-aa33-b6d64dd28a22' and contemplated_at is null;
update public.consortium_contracts set contemplated_at = '2026-08-10' where id = '28190807-39df-469b-b96d-128a8bde0eec' and contemplated_at is null;

insert into public.tasks (organization_id, client_id, consortium_contract_id, title, description, priority, category, status)
values
  ('d34dae9a-6460-4210-906d-e9a973014436', '40c194a1-f28c-4798-b275-bfcb0f850953', '5c7c4458-584f-4539-aa33-b6d64dd28a22',
   'Pós-contemplação: documentação e liberação do crédito',
   'Lance vencedor registrado. Confirmar pagamento do lance (quando aplicável), reunir documentação, acompanhar análise e liberação do crédito.',
   'high', 'consorcio', 'pending'),
  ('d34dae9a-6460-4210-906d-e9a973014436', 'bd45ce7d-41d2-4f4c-a057-c7e7d580aa5f', '28190807-39df-469b-b96d-128a8bde0eec',
   'Pós-contemplação: documentação e liberação do crédito',
   'Lance vencedor registrado. Confirmar pagamento do lance (quando aplicável), reunir documentação, acompanhar análise e liberação do crédito.',
   'high', 'consorcio', 'pending');
