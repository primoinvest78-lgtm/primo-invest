-- Segundo lote de clientes de teste, mais ricos em dado — pra validar
-- visualmente o painel 360º em vários perfis diferentes (não só o
-- Carlos Eduardo Martins do seed_demo_client.sql). Não é dado de
-- produção real. Usa IDs reais já existentes no banco (org, advisor,
-- produtos de investimento, estágios de oportunidade).

do $$
declare
  v_org_id uuid := 'd34dae9a-6460-4210-906d-e9a973014436';
  v_advisor_id uuid := 'e34371d0-8f9b-455e-b944-5ee56376dec7';
  v_product_tesouro_id uuid := 'f1dcaad4-7af8-4454-8802-976052197820';
  v_product_acoes_id uuid := '2a098590-48c3-413d-adb8-ceb2427d5d05';
  v_stage_negociacao_id uuid := '2c0e1984-29b9-402c-9ba2-7c5feb79e0be';
  v_stage_proposta_id uuid := '39a17551-4fc3-4e6c-a079-1545796f22ec';
  v_client_id uuid;
  v_account_id uuid;
  v_goal_id uuid;
  v_tag_id uuid;
begin
  -- ------------------------------------------------------------------
  -- Cliente 1: Beatriz Nascimento — alto patrimônio, foco renda variável
  -- ------------------------------------------------------------------
  insert into public.clients (organization_id, assigned_advisor_id, full_name, preferred_name, document_number, birth_date, email, phone, status, notes)
  values (v_org_id, v_advisor_id, 'Beatriz Nascimento', 'Bia', '987.654.321-00', '1985-09-22', 'beatriz.nascimento@example.com', '(11) 98888-2001', 'active', 'Perfil arrojado, forte apetite por renda variável.')
  returning id into v_client_id;

  insert into public.client_contacts (organization_id, client_id, contact_type, value, is_primary)
  values
    (v_org_id, v_client_id, 'email', 'beatriz.nascimento@example.com', true),
    (v_org_id, v_client_id, 'phone', '(11) 98888-2001', true);

  insert into public.client_addresses (organization_id, client_id, address_type, postal_code, street, number, neighborhood, city, state, is_primary)
  values (v_org_id, v_client_id, 'residential', '04538-133', 'Av. Faria Lima', '2000', 'Itaim Bibi', 'São Paulo', 'SP', true);

  insert into public.tags (organization_id, name, color) values (v_org_id, 'Alto patrimônio', '#101B3D') returning id into v_tag_id;
  insert into public.client_tags (client_id, tag_id) values (v_client_id, v_tag_id);

  insert into public.financial_accounts (organization_id, client_id, institution_name, account_name, account_type, currency, status)
  values (v_org_id, v_client_id, 'Banco Primo', 'Carteira de Investimentos', 'investimento', 'BRL', 'active')
  returning id into v_account_id;

  insert into public.holdings (organization_id, financial_account_id, investment_product_id, quantity, average_price, current_price, valuation, as_of_date)
  values
    (v_org_id, v_account_id, v_product_acoes_id, 2500, 27.00, 32.40, 81000.00, current_date),
    (v_org_id, v_account_id, v_product_tesouro_id, 1200, 100.00, 108.50, 130200.00, current_date);

  insert into public.consortium_contracts (organization_id, client_id, administrator_name, contract_number, consortium_type, credit_amount, installment_amount, total_installments, paid_installments, status, start_date)
  values (v_org_id, v_client_id, 'Porto Consórcios', 'CT-2024-01122', 'automóvel', 120000.00, 1800.00, 80, 22, 'active', '2023-11-01');

  insert into public.wealth_goals (organization_id, client_id, name, goal_type, target_amount, current_amount, target_date, priority, status)
  values (v_org_id, v_client_id, 'Segunda residência', 'purchase', 900000.00, 211200.00, current_date + interval '400 days', 'high', 'active')
  returning id into v_goal_id;
  insert into public.wealth_goal_accounts (wealth_goal_id, financial_account_id, allocation_percentage) values (v_goal_id, v_account_id, 100);

  insert into public.client_risk_profiles (organization_id, client_id, risk_tolerance, investment_objective, investment_horizon, score, valid_from, status, created_by)
  values (v_org_id, v_client_id, 'Arrojado', 'Crescimento agressivo de patrimônio', 'Longo prazo', 84, current_date - interval '10 days', 'active', v_advisor_id);

  insert into public.interactions (organization_id, client_id, user_id, interaction_type, subject, description, occurred_at)
  values
    (v_org_id, v_client_id, v_advisor_id, 'meeting', 'Revisão de alocação', 'Rebalanceamento pra aumentar exposição em ações.', now() - interval '3 days'),
    (v_org_id, v_client_id, v_advisor_id, 'call', 'Follow-up trimestral', 'Cliente satisfeito com performance da carteira.', now() - interval '25 days');

  insert into public.notes (organization_id, client_id, user_id, title, content, is_private)
  values (v_org_id, v_client_id, v_advisor_id, 'Perfil do cliente', 'Prefere reuniões presenciais, disponível às sextas.', false);

  insert into public.tasks (organization_id, client_id, title, description, due_at, priority, status)
  values
    (v_org_id, v_client_id, 'Enviar relatório trimestral', 'Consolidar performance do trimestre.', now() + interval '5 days', 'normal', 'pending'),
    (v_org_id, v_client_id, 'Revisar meta de segunda residência', null, now() - interval '1 days', 'high', 'pending');

  insert into public.opportunities (organization_id, client_id, assigned_advisor_id, stage_id, title, opportunity_type, estimated_value, expected_close_date, status)
  values (v_org_id, v_client_id, v_advisor_id, v_stage_negociacao_id, 'Aporte em renda variável internacional', 'investimento', 150000.00, current_date + interval '15 days', 'open');

  insert into public.documents (organization_id, client_id, uploaded_by, name, document_type, storage_path, status)
  values (v_org_id, v_client_id, v_advisor_id, 'RG_Beatriz_Nascimento.pdf', 'application/pdf', v_org_id::text || '/' || v_client_id::text || '/rg.pdf', 'active');

  insert into public.transactions (organization_id, financial_account_id, investment_product_id, transaction_type, quantity, unit_price, amount, currency, transaction_date, description)
  values
    (v_org_id, v_account_id, v_product_acoes_id, 'buy', 1500, 24, 36000, 'BRL', current_date - interval '160 days', 'Posição inicial em ações'),
    (v_org_id, v_account_id, v_product_tesouro_id, 'buy', 800, 100, 80000, 'BRL', current_date - interval '120 days', 'Reserva em renda fixa'),
    (v_org_id, v_account_id, v_product_acoes_id, 'buy', 1000, 30, 30000, 'BRL', current_date - interval '60 days', 'Aporte adicional em ações'),
    (v_org_id, v_account_id, v_product_tesouro_id, 'buy', 400, 105, 42000, 'BRL', current_date - interval '20 days', 'Aporte em renda fixa');

  -- ------------------------------------------------------------------
  -- Cliente 2: José Ricardo Pereira — conservador, foco previdência
  -- ------------------------------------------------------------------
  insert into public.clients (organization_id, assigned_advisor_id, full_name, preferred_name, document_number, birth_date, email, phone, status, notes)
  values (v_org_id, v_advisor_id, 'José Ricardo Pereira', 'Ricardo', '456.789.123-00', '1962-03-05', 'jose.pereira@example.com', '(11) 98888-2002', 'active', 'Próximo da aposentadoria, perfil conservador.')
  returning id into v_client_id;

  insert into public.client_contacts (organization_id, client_id, contact_type, value, is_primary)
  values (v_org_id, v_client_id, 'email', 'jose.pereira@example.com', true);

  insert into public.financial_accounts (organization_id, client_id, institution_name, account_name, account_type, currency, status)
  values (v_org_id, v_client_id, 'Banco Primo', 'Previdência', 'investimento', 'BRL', 'active')
  returning id into v_account_id;

  insert into public.holdings (organization_id, financial_account_id, investment_product_id, quantity, average_price, current_price, valuation, as_of_date)
  values (v_org_id, v_account_id, v_product_tesouro_id, 3000, 98.00, 108.50, 325500.00, current_date);

  insert into public.liabilities (organization_id, client_id, name, liability_type, outstanding_amount, interest_rate, monthly_payment, maturity_date, currency, status)
  values (v_org_id, v_client_id, 'Financiamento imobiliário', 'financiamento', 180000.00, 0.9, 2800.00, '2032-01-01', 'BRL', 'active');

  insert into public.wealth_goals (organization_id, client_id, name, goal_type, target_amount, current_amount, target_date, priority, status)
  values (v_org_id, v_client_id, 'Aposentadoria', 'retirement', 1000000.00, 325500.00, current_date + interval '30 days', 'high', 'active')
  returning id into v_goal_id;
  insert into public.wealth_goal_accounts (wealth_goal_id, financial_account_id, allocation_percentage) values (v_goal_id, v_account_id, 100);

  insert into public.client_risk_profiles (organization_id, client_id, risk_tolerance, investment_objective, investment_horizon, score, valid_from, status, created_by)
  values (v_org_id, v_client_id, 'Conservador', 'Preservação de capital', 'Curto prazo', 28, current_date - interval '200 days', 'active', v_advisor_id);

  insert into public.interactions (organization_id, client_id, user_id, interaction_type, subject, description, occurred_at)
  values (v_org_id, v_client_id, v_advisor_id, 'call', 'Revisão de previdência', 'Confirmado aporte mensal recorrente.', now() - interval '95 days');

  insert into public.tasks (organization_id, client_id, title, due_at, priority, status)
  values (v_org_id, v_client_id, 'Revisar meta de aposentadoria — prazo próximo', now() + interval '25 days', 'urgent', 'pending');

  insert into public.opportunities (organization_id, client_id, assigned_advisor_id, stage_id, title, opportunity_type, estimated_value, expected_close_date, status)
  values (v_org_id, v_client_id, v_advisor_id, v_stage_proposta_id, 'Complementação de previdência privada', 'investimento', 50000.00, current_date - interval '5 days', 'open');

  insert into public.transactions (organization_id, financial_account_id, investment_product_id, transaction_type, quantity, unit_price, amount, currency, transaction_date, description)
  values
    (v_org_id, v_account_id, v_product_tesouro_id, 'buy', 2000, 95, 190000, 'BRL', current_date - interval '180 days', 'Aporte inicial previdência'),
    (v_org_id, v_account_id, v_product_tesouro_id, 'buy', 1000, 100, 100000, 'BRL', current_date - interval '90 days', 'Aporte mensal recorrente');

  -- ------------------------------------------------------------------
  -- Cliente 3: Ana Luiza Ferreira — perfil moderado, núcleo familiar
  -- ------------------------------------------------------------------
  insert into public.households (organization_id, name, description)
  values (v_org_id, 'Família Ferreira', 'Núcleo familiar de teste #2');

  insert into public.clients (organization_id, assigned_advisor_id, full_name, document_number, birth_date, email, phone, status, notes)
  values (v_org_id, v_advisor_id, 'Ana Luiza Ferreira', '321.654.987-00', '1990-07-14', 'ana.ferreira@example.com', '(11) 98888-2003', 'active', 'Recém-casada, planejando primeiros investimentos em conjunto.')
  returning id into v_client_id;

  insert into public.client_contacts (organization_id, client_id, contact_type, value, is_primary)
  values (v_org_id, v_client_id, 'phone', '(11) 98888-2003', true);

  insert into public.financial_accounts (organization_id, client_id, institution_name, account_name, account_type, currency, status)
  values (v_org_id, v_client_id, 'Banco Primo', 'Carteira Moderada', 'investimento', 'BRL', 'active')
  returning id into v_account_id;

  insert into public.holdings (organization_id, financial_account_id, investment_product_id, quantity, average_price, current_price, valuation, as_of_date)
  values
    (v_org_id, v_account_id, v_product_tesouro_id, 400, 100.00, 108.50, 43400.00, current_date),
    (v_org_id, v_account_id, v_product_acoes_id, 200, 29.00, 32.40, 6480.00, current_date);

  insert into public.wealth_goals (organization_id, client_id, name, goal_type, target_amount, current_amount, target_date, priority, status)
  values (v_org_id, v_client_id, 'Reserva de emergência', 'emergency_fund', 60000.00, 49880.00, current_date + interval '90 days', 'normal', 'active')
  returning id into v_goal_id;
  insert into public.wealth_goal_accounts (wealth_goal_id, financial_account_id, allocation_percentage) values (v_goal_id, v_account_id, 100);

  insert into public.client_risk_profiles (organization_id, client_id, risk_tolerance, investment_objective, investment_horizon, score, valid_from, status, created_by)
  values (v_org_id, v_client_id, 'Moderado', 'Formação de reserva e crescimento gradual', 'Médio prazo', 55, current_date - interval '5 days', 'active', v_advisor_id);

  insert into public.interactions (organization_id, client_id, user_id, interaction_type, subject, description, occurred_at)
  values (v_org_id, v_client_id, v_advisor_id, 'email', 'Boas-vindas', 'Enviado material de onboarding.', now() - interval '2 days');

  insert into public.transactions (organization_id, financial_account_id, investment_product_id, transaction_type, quantity, unit_price, amount, currency, transaction_date, description)
  values
    (v_org_id, v_account_id, v_product_tesouro_id, 'buy', 300, 98, 29400, 'BRL', current_date - interval '70 days', 'Aporte inicial'),
    (v_org_id, v_account_id, v_product_acoes_id, 'buy', 200, 29, 5800, 'BRL', current_date - interval '30 days', 'Diversificação em ações'),
    (v_org_id, v_account_id, v_product_tesouro_id, 'buy', 100, 105, 10500, 'BRL', current_date - interval '10 days', 'Reforço de reserva');

  raise notice 'Segundo lote de clientes de teste criado com sucesso.';
end $$;
