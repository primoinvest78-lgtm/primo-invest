-- Seed de leads de teste, cobrindo o pipeline de 8 etapas — só pra
-- validação visual do módulo evoluído (KPIs, score, prioridade,
-- gráficos, filtros). Não é dado de produção real. Usa os IDs reais
-- do banco (org "Primo Invest — Demo", advisor "Admin Demo").

do $$
declare
  v_org_id uuid := 'd34dae9a-6460-4210-906d-e9a973014436';
  v_advisor_id uuid := 'e34371d0-8f9b-455e-b944-5ee56376dec7';
  v_lead_id uuid;
begin
  -- Novo, sem contato ainda, origem site
  insert into public.leads (organization_id, assigned_advisor_id, name, email, phone, source, status, interest, product_interest, estimated_net_worth, objective)
  values (v_org_id, v_advisor_id, 'Roberto Alves', 'roberto.alves@example.com', '(11) 97777-1111', 'site', 'Novo', 'Aposentadoria', 'Previdência privada', 80000, 'Complementar renda na aposentadoria');

  -- Contato, origem indicação, com uma interação recente
  insert into public.leads (organization_id, assigned_advisor_id, name, email, phone, source, status, interest, product_interest, estimated_net_worth, objective)
  values (v_org_id, v_advisor_id, 'Marina Souza', 'marina.souza@example.com', '(11) 97777-2222', 'indicação', 'Contato', 'Diversificação de carteira', 'Fundos multimercado', 320000, 'Reduzir exposição em renda fixa')
  returning id into v_lead_id;

  insert into public.interactions (organization_id, lead_id, user_id, interaction_type, subject, description, occurred_at)
  values (v_org_id, v_lead_id, v_advisor_id, 'call', 'Primeiro contato', 'Cliente demonstrou interesse em diversificação.', now() - interval '2 days');

  -- Qualificação, origem campanha, patrimônio alto, sem contato há tempo (parado)
  insert into public.leads (organization_id, assigned_advisor_id, name, email, phone, source, status, interest, product_interest, estimated_net_worth, objective, created_at)
  values (v_org_id, v_advisor_id, 'Eduardo Lima', 'eduardo.lima@example.com', '(11) 97777-3333', 'campanha', 'Qualificação', 'Renda variável', 'Ações e ETFs', 1200000, 'Crescimento agressivo de patrimônio', now() - interval '40 days')
  returning id into v_lead_id;

  insert into public.interactions (organization_id, lead_id, user_id, interaction_type, subject, description, occurred_at)
  values (v_org_id, v_lead_id, v_advisor_id, 'meeting', 'Reunião de qualificação', 'Levantamento de perfil e objetivos.', now() - interval '35 days');

  -- Reunião marcada, origem WhatsApp
  insert into public.leads (organization_id, assigned_advisor_id, name, email, phone, source, status, interest, product_interest, estimated_net_worth, objective)
  values (v_org_id, v_advisor_id, 'Patrícia Gomes', 'patricia.gomes@example.com', '(11) 97777-4444', 'whatsapp', 'Reunião', 'Planejamento sucessório', 'Consórcio imobiliário', 650000, 'Estruturar herança pra os filhos')
  returning id into v_lead_id;

  insert into public.interactions (organization_id, lead_id, user_id, interaction_type, subject, description, occurred_at)
  values (v_org_id, v_lead_id, v_advisor_id, 'message', 'Confirmação de reunião', 'Confirmou presença na reunião de amanhã.', now() - interval '1 days');

  insert into public.tasks (organization_id, lead_id, title, description, due_at, priority, status)
  values (v_org_id, v_lead_id, 'Reunião de apresentação de proposta', 'Apresentar simulação de consórcio.', now() + interval '1 days', 'high', 'pending');

  -- Proposta enviada, origem evento, quase convertendo
  insert into public.leads (organization_id, assigned_advisor_id, name, email, phone, source, status, interest, product_interest, estimated_net_worth, objective)
  values (v_org_id, v_advisor_id, 'Fernando Castro', 'fernando.castro@example.com', '(11) 97777-5555', 'evento', 'Proposta', 'Renda fixa isenta', 'CRI/CRA', 950000, 'Otimizar tributação sobre investimentos')
  returning id into v_lead_id;

  insert into public.interactions (organization_id, lead_id, user_id, interaction_type, subject, description, occurred_at)
  values
    (v_org_id, v_lead_id, v_advisor_id, 'meeting', 'Apresentação de proposta', 'Proposta bem recebida, aguardando retorno.', now() - interval '1 days'),
    (v_org_id, v_lead_id, v_advisor_id, 'call', 'Follow-up', 'Reforçou interesse, vai decidir até sexta.', now() - interval '3 hours');

  insert into public.tasks (organization_id, lead_id, title, due_at, priority, status)
  values (v_org_id, v_lead_id, 'Follow-up da proposta', now(), 'urgent', 'pending');

  -- Negociação, origem parceiro
  insert into public.leads (organization_id, assigned_advisor_id, name, email, phone, source, status, interest, product_interest, estimated_net_worth, objective)
  values (v_org_id, v_advisor_id, 'Camila Ribeiro', 'camila.ribeiro@example.com', '(11) 97777-6666', 'parceiro', 'Negociação', 'Aporte inicial', 'Carteira administrada', 2000000, 'Terceirizar gestão de patrimônio')
  returning id into v_lead_id;

  insert into public.interactions (organization_id, lead_id, user_id, interaction_type, subject, description, occurred_at)
  values (v_org_id, v_lead_id, v_advisor_id, 'meeting', 'Negociação de taxas', 'Discutindo condições finais.', now() - interval '12 hours');

  -- Perdido, origem site
  insert into public.leads (organization_id, assigned_advisor_id, name, email, phone, source, status, interest, lost_reason, lost_at)
  values (v_org_id, v_advisor_id, 'Bruno Tavares', 'bruno.tavares@example.com', '(11) 97777-7777', 'site', 'Perdido', 'Renda fixa', 'Escolheu concorrente', now() - interval '10 days');

  raise notice 'Leads de teste criados com sucesso.';
end $$;
