-- Seed de bootstrap para ambiente de DESENVOLVIMENTO/TESTE.
-- Cria 1 organização + 1 usuário admin, para permitir login e validar
-- o app localmente. NÃO rodar em produção.
--
-- Necessário porque não existe fluxo de auto-cadastro de organização:
-- por design, não há policy de INSERT em organizations/organization_members
-- para o client autenticado (evita autoprovisionamento de acesso).
--
-- Nota sobre os campos de token (confirmation_token, recovery_token,
-- email_change_token_new, email_change): devem ser '' (string vazia),
-- nunca NULL. Um insert manual em auth.users que deixe esses campos NULL
-- quebra o login (GoTrue retorna 500 "Database error querying schema"
-- ao tentar decodificá-los).
--
-- Não hardcoda credencial: passe via variáveis psql, ex.
--   psql "$DIRECT_URL" -v seed_email="'admin@suaorg.com'" -v seed_password="'TrocarAntesDeUsar!'" -f supabase/seed.sql
-- Sem -v, usa os defaults abaixo (só para dev local).
\set seed_email `[ -z "${SEED_EMAIL:-}" ] && echo "'admin@primoinvest.test'" || echo "'$SEED_EMAIL'"`
\set seed_password `[ -z "${SEED_PASSWORD:-}" ] && echo "'ChangeMe-Before-Real-Use!'" || echo "'$SEED_PASSWORD'"`

do $$
declare
  v_org_id uuid;
  v_user_id uuid;
  v_email text := :seed_email;
  v_password text := :seed_password;
begin
  insert into public.organizations (name, legal_name, status)
  values ('Primo Invest — Demo', 'Primo Invest — Demo', 'active')
  returning id into v_org_id;

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, confirmation_token, recovery_token,
    email_change_token_new, email_change,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
    v_email, crypt(v_password, gen_salt('bf')),
    now(), '', '', '', '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('full_name', 'Admin Demo'),
    now(), now()
  )
  returning id into v_user_id;

  insert into auth.identities (
    id, user_id, provider_id, identity_data, provider, created_at, updated_at
  ) values (
    gen_random_uuid(), v_user_id, v_user_id::text,
    jsonb_build_object('sub', v_user_id::text, 'email', v_email),
    'email', now(), now()
  );

  -- public.profiles é criado automaticamente pelo trigger on_auth_user_created
  -- (ver migration 20260912225958_handle_new_user_trigger.sql).

  insert into public.organization_members (organization_id, user_id, role, status)
  values (v_org_id, v_user_id, 'admin', 'active');

  raise notice 'Seed OK — email: %, organization_id: %', v_email, v_org_id;
end $$;
