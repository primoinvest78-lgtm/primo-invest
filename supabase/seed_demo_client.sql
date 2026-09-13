-- Seed de UM cliente de teste completo, com dado em quase toda tabela
-- usada no painel 360º — só pra validação visual. Não roda em
-- produção de verdade, é só pra você ver as telas preenchidas.
-- Usa os IDs reais do seu banco (org "Primo Invest — Demo",
-- advisor "Admin Demo", estágio "Qualificação").

do $$
declare
  v_org_id uuid := 'd34dae9a-6460-4210-906d-e9a973014436';
  v_advisor_id uuid := 'e34371d0-8f9b-455e-b944-5ee56376dec7';
  v_stage_id uuid := 'bce17540-aef0-42c3-bb60-661982cc5595'; -- Qualificação
  v_household_id uuid;
  v_client_id uuid;
  v_spouse_id uuid;
  v_checking_account_id uuid;
  v_invest_account_id uuid;
  v_product_tesouro_id uuid;
  v_product_acoes_id uuid;
  v_goal_id uuid;
  v_tag_id uuid;
begin
  -- Núcleo familiar
  insert into public.households (organization_id, name, description)
  values (v_org_id, 'Família Martins', 'Núcleo familiar de teste')
  returning id into v_household_id;

  -- Cliente principal
  insert into public.clients (
    organization_id, household_id, assigned_advisor_id, full_name, preferred_name,
    document_number, birth_date, email, phone, status, notes
  ) values (
    v_org_id, v_household_id, v_advisor_id, 'Carlos Eduardo Martins', 'Carlos',
    '123.456.789-00', '1978-04-12', 'carlos.martins@example.com', '(11) 98888-1234',
    'active', 'Cliente de teste criado pra validação visual do painel 360º.'
  )
  returning id into v_client_id;

  -- Cônjuge (também é cliente, membro do mesmo household)
  insert into public.clients (organization_id, household_id, full_name, status)
  values (v_org_id, v_household_id, 'Fernanda Martins', 'active')
  returning id into v_spouse_id;

  insert into public.household_members (household_id, client_id, relationship)
  values
    (v_household_id, v_client_id, 'Titular'),
    (v_household_id, v_spouse_id, 'Cônjuge');

  -- Contato e endereço
  insert into public.client_contacts (organization_id, client_id, contact_type, value, is_primary)
  values
    (v_org_id, v_client_id, 'email', 'carlos.martins@example.com', true),
    (v_org_id, v_client_id, 'phone', '(11) 98888-1234', true);

  insert into public.client_addresses (
    organization_id, client_id, address_type, postal_code, street, number,
    neighborhood, city, state, is_primary
  ) values (
    v_org_id, v_client_id, 'residential', '01310-100', 'Av. Paulista', '1000',
    'Bela Vista', 'São Paulo', 'SP', true
  );

  -- Tag
  insert into public.tags (organization_id, name, color)
  values (v_org_id, 'VIP', '#2ECC9B')
  returning id into v_tag_id;

  insert into public.client_tags (client_id, tag_id) values (v_client_id, v_tag_id);

  -- Produtos de investimento
  insert into public.investment_products (organization_id, name, product_type, institution_name, currency, risk_level, is_active)
  values (v_org_id, 'Tesouro Selic 2029', 'Renda Fixa', 'Tesouro Nacional', 'BRL', 'baixo', true)
  returning id into v_product_tesouro_id;

  insert into public.investment_products (organization_id, name, product_type, institution_name, currency, risk_level, is_active)
  values (v_org_id, 'Ações PETR4', 'Renda Variável', 'B3', 'BRL', 'alto', true)
  returning id into v_product_acoes_id;

  -- Contas financeiras
  insert into public.financial_accounts (organization_id, client_id, institution_name, account_name, account_type, currency, status)
  values (v_org_id, v_client_id, 'Banco Primo', 'Conta Corrente', 'corrente', 'BRL', 'active')
  returning id into v_checking_account_id;

  insert into public.financial_accounts (organization_id, client_id, institution_name, account_name, account_type, currency, status)
  values (v_org_id, v_client_id, 'Banco Primo', 'Carteira de Investimentos', 'investimento', 'BRL', 'active')
  returning id into v_invest_account_id;

  -- Holdings
  insert into public.holdings (organization_id, financial_account_id, investment_product_id, quantity, average_price, current_price, valuation, as_of_date)
  values
    (v_org_id, v_invest_account_id, v_product_tesouro_id, 500, 100.00, 108.50, 54250.00, current_date),
    (v_org_id, v_invest_account_id, v_product_acoes_id, 300, 28.00, 32.40, 9720.00, current_date),
    (v_org_id, v_checking_account_id, null, 1, 1, 1, 12500.00, current_date);

  -- Consórcio ativo
  insert into public.consortium_contracts (
    organization_id, client_id, administrator_name, contract_number, consortium_type,
    credit_amount, installment_amount, total_installments, paid_installments, status, start_date
  ) values (
    v_org_id, v_client_id, 'Porto Consórcios', 'CT-2024-00981', 'imóvel',
    350000.00, 2100.00, 180, 14, 'active', '2024-06-01'
  );

  -- Passivo
  insert into public.liabilities (
    organization_id, client_id, name, liability_type, outstanding_amount,
    interest_rate, monthly_payment, maturity_date, currency, status
  ) values (
    v_org_id, v_client_id, 'Financiamento Veículo', 'financiamento', 42000.00,
    1.2, 1450.00, '2027-03-01', 'BRL', 'active'
  );

  -- Meta financeira
  insert into public.wealth_goals (
    organization_id, client_id, name, goal_type, target_amount, current_amount,
    target_date, priority, status
  ) values (
    v_org_id, v_client_id, 'Aposentadoria', 'retirement', 2000000.00, 76470.00,
    current_date + interval '45 days', 'high', 'active'
  )
  returning id into v_goal_id;

  insert into public.wealth_goal_accounts (wealth_goal_id, financial_account_id, allocation_percentage)
  values (v_goal_id, v_invest_account_id, 100);

  -- Perfil de suitability vigente
  insert into public.client_risk_profiles (
    organization_id, client_id, risk_tolerance, investment_objective, investment_horizon,
    score, valid_from, status, created_by
  ) values (
    v_org_id, v_client_id, 'Moderado', 'Crescimento de patrimônio', 'Longo prazo',
    62, current_date - interval '30 days', 'active', v_advisor_id
  );

  -- Interações
  insert into public.interactions (organization_id, client_id, user_id, interaction_type, subject, description, occurred_at)
  values
    (v_org_id, v_client_id, v_advisor_id, 'call', 'Revisão de carteira', 'Cliente satisfeito com a rentabilidade do trimestre.', now() - interval '5 days'),
    (v_org_id, v_client_id, v_advisor_id, 'meeting', 'Reunião de planejamento', 'Discutimos meta de aposentadoria.', now() - interval '20 days');

  -- Nota
  insert into public.notes (organization_id, client_id, user_id, title, content, is_private)
  values (v_org_id, v_client_id, v_advisor_id, 'Perfil do cliente', 'Prefere contato por telefone, evitar e-mail.', false);

  -- Tarefas (uma atrasada, uma futura)
  insert into public.tasks (organization_id, client_id, title, description, due_at, priority, status)
  values
    (v_org_id, v_client_id, 'Enviar proposta de aporte', 'Preparar proposta de aporte adicional.', now() - interval '2 days', 'high', 'pending'),
    (v_org_id, v_client_id, 'Follow-up trimestral', 'Ligar pra revisar performance da carteira.', now() + interval '10 days', 'normal', 'pending');

  -- Oportunidade
  insert into public.opportunities (
    organization_id, client_id, assigned_advisor_id, stage_id, title,
    opportunity_type, estimated_value, expected_close_date, status
  ) values (
    v_org_id, v_client_id, v_advisor_id, v_stage_id, 'Aporte adicional em renda variável',
    'aporte', 25000.00, current_date + interval '20 days', 'open'
  );

  -- Documento
  insert into public.documents (organization_id, client_id, uploaded_by, name, document_type, storage_path, status)
  values (v_org_id, v_client_id, v_advisor_id, 'RG_Carlos_Martins.pdf', 'application/pdf', v_org_id::text || '/' || v_client_id::text || '/exemplo.pdf', 'active');

  -- Transações (pra evolução patrimonial em linha) — 5 meses de histórico
  insert into public.transactions (organization_id, financial_account_id, investment_product_id, transaction_type, quantity, unit_price, amount, currency, transaction_date, description)
  values
    (v_org_id, v_invest_account_id, v_product_tesouro_id, 'buy', 200, 100, 20000, 'BRL', current_date - interval '150 days', 'Aporte inicial Tesouro'),
    (v_org_id, v_invest_account_id, v_product_acoes_id, 'buy', 150, 25, 3750, 'BRL', current_date - interval '120 days', 'Aporte inicial ações'),
    (v_org_id, v_invest_account_id, v_product_tesouro_id, 'buy', 300, 102, 30600, 'BRL', current_date - interval '90 days', 'Aporte adicional'),
    (v_org_id, v_invest_account_id, v_product_acoes_id, 'buy', 150, 30, 4500, 'BRL', current_date - interval '45 days', 'Aporte adicional ações'),
    (v_org_id, v_invest_account_id, null, 'dividend', null, null, 1120, 'BRL', current_date - interval '15 days', 'Dividendos recebidos');

  raise notice 'Cliente de teste criado: % (id: %)', 'Carlos Eduardo Martins', v_client_id;
end $$;
