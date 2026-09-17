-- Centro de Administração e Governança — NÃO cria uma segunda camada de
-- autenticação/autorização. Usa exatamente o que já existe:
--   - app_role (enum já em uso: admin, manager, advisor, operations,
--     finance, compliance, viewer) via has_org_role()
--   - organization_members.status (member_status: active/inactive/invited)
--   - a tabela `permissions` (17 códulos módulo.read/módulo.write, já
--     semeada) e `role_permissions` (existe, mas hoje está VAZIA — não
--     preenchemos automaticamente, só damos a UI pra alguém autorizado
--     configurar, se quiser)
--   - audit_logs + write_audit_log() (já grava INSERT/UPDATE/DELETE via
--     trigger em várias tabelas — só faltava anexar em
--     organization_members/role_permissions, que são justamente as
--     tabelas que governam acesso)
--
-- `profiles` só permite SELECT da própria linha (profiles_select_own).
-- Isso é insuficiente pra uma tela de usuários (precisa ver todo mundo
-- da organização) — por isso as funções abaixo são SECURITY DEFINER,
-- checam autorização (admin/manager) explicitamente por dentro, e
-- expõem só full_name/email/is_active/last_sign_in_at — nunca senha,
-- token ou qualquer coisa de auth.users além do estritamente
-- necessário pra exibição.

-- ────────────────────────────────────────────────────────────────
-- Auditoria também para as tabelas que governam acesso
-- ────────────────────────────────────────────────────────────────
drop trigger if exists trg_audit_organization_members on public.organization_members;
create trigger trg_audit_organization_members
  after insert or update or delete on public.organization_members
  for each row execute function write_audit_log();

drop trigger if exists trg_audit_role_permissions on public.role_permissions;
create trigger trg_audit_role_permissions
  after insert or update or delete on public.role_permissions
  for each row execute function write_audit_log();

-- ────────────────────────────────────────────────────────────────
-- Listagem de usuários da organização — admin/manager
-- ────────────────────────────────────────────────────────────────
create or replace function public.list_organization_members(p_org_id uuid)
returns table (
  member_id uuid,
  user_id uuid,
  role app_role,
  status member_status,
  member_created_at timestamptz,
  full_name text,
  email text,
  is_active boolean,
  last_sign_in_at timestamptz,
  invited_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not has_org_role(p_org_id, array['admin', 'manager']::app_role[]) then
    raise exception 'not authorized';
  end if;

  return query
    select om.id, om.user_id, om.role, om.status, om.created_at,
           p.full_name, p.email, p.is_active,
           u.last_sign_in_at, u.invited_at
    from public.organization_members om
    join public.profiles p on p.id = om.user_id
    left join auth.users u on u.id = om.user_id
    where om.organization_id = p_org_id
    order by om.created_at asc;
end;
$$;

grant execute on function public.list_organization_members(uuid) to authenticated;

-- ────────────────────────────────────────────────────────────────
-- Adicionar um usuário existente (por e-mail) à organização —
-- admin-only. Nunca cria conta nova (não temos service role key nem
-- vamos simular isso) — só vincula alguém que já tem conta na
-- plataforma. Se não existir, devolve 'not_found' e a tela orienta a
-- pessoa a criar conta primeiro.
-- ────────────────────────────────────────────────────────────────
create or replace function public.add_organization_member(
  p_org_id uuid,
  p_email text,
  p_role app_role
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_existing uuid;
begin
  if not has_org_role(p_org_id, array['admin']::app_role[]) then
    raise exception 'not authorized';
  end if;

  select id into v_user_id from public.profiles where lower(email) = lower(p_email) limit 1;
  if v_user_id is null then
    return 'not_found';
  end if;

  select id into v_existing from public.organization_members
    where organization_id = p_org_id and user_id = v_user_id;
  if v_existing is not null then
    return 'already_member';
  end if;

  insert into public.organization_members (organization_id, user_id, role, status)
  values (p_org_id, v_user_id, p_role, 'invited');

  return 'added';
end;
$$;

grant execute on function public.add_organization_member(uuid, text, app_role) to authenticated;

-- ────────────────────────────────────────────────────────────────
-- Alterar perfil (role) de um membro — admin-only. Nunca deixa a
-- organização sem nenhum admin ativo (segregação de funções mínima).
-- ────────────────────────────────────────────────────────────────
create or replace function public.update_member_role(
  p_org_id uuid,
  p_member_id uuid,
  p_new_role app_role
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current_role app_role;
  v_status member_status;
  v_admin_count int;
begin
  if not has_org_role(p_org_id, array['admin']::app_role[]) then
    raise exception 'not authorized';
  end if;

  select role, status into v_current_role, v_status
    from public.organization_members
    where id = p_member_id and organization_id = p_org_id;

  if v_current_role is null then
    return 'not_found';
  end if;

  if v_current_role = 'admin' and p_new_role <> 'admin' and v_status = 'active' then
    select count(*) into v_admin_count
      from public.organization_members
      where organization_id = p_org_id and role = 'admin' and status = 'active';
    if v_admin_count <= 1 then
      return 'last_admin';
    end if;
  end if;

  update public.organization_members set role = p_new_role where id = p_member_id;
  return 'updated';
end;
$$;

grant execute on function public.update_member_role(uuid, uuid, app_role) to authenticated;

-- ────────────────────────────────────────────────────────────────
-- Ativar/desativar/reabrir convite de um membro — admin-only. Mesma
-- proteção: nunca desativa o último admin ativo.
-- ────────────────────────────────────────────────────────────────
create or replace function public.set_member_status(
  p_org_id uuid,
  p_member_id uuid,
  p_new_status member_status
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role;
  v_status member_status;
  v_admin_count int;
begin
  if not has_org_role(p_org_id, array['admin']::app_role[]) then
    raise exception 'not authorized';
  end if;

  select role, status into v_role, v_status
    from public.organization_members
    where id = p_member_id and organization_id = p_org_id;

  if v_role is null then
    return 'not_found';
  end if;

  if v_role = 'admin' and v_status = 'active' and p_new_status <> 'active' then
    select count(*) into v_admin_count
      from public.organization_members
      where organization_id = p_org_id and role = 'admin' and status = 'active';
    if v_admin_count <= 1 then
      return 'last_admin';
    end if;
  end if;

  update public.organization_members set status = p_new_status where id = p_member_id;
  return 'updated';
end;
$$;

grant execute on function public.set_member_status(uuid, uuid, member_status) to authenticated;

-- ────────────────────────────────────────────────────────────────
-- Matriz de permissões granulares — liga/desliga uma concessão em
-- role_permissions. admin-only. A tabela está vazia hoje (nunca foi
-- configurada); esta função só dá o controle, não decide nada sozinha.
-- ────────────────────────────────────────────────────────────────
create or replace function public.set_role_permission(
  p_org_id uuid,
  p_role app_role,
  p_permission_code text,
  p_granted boolean
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_permission_id uuid;
begin
  if not has_org_role(p_org_id, array['admin']::app_role[]) then
    raise exception 'not authorized';
  end if;

  select id into v_permission_id from public.permissions where code = p_permission_code;
  if v_permission_id is null then
    return 'not_found';
  end if;

  if p_granted then
    insert into public.role_permissions (organization_id, role, permission_id)
    values (p_org_id, p_role, v_permission_id)
    on conflict do nothing;
  else
    delete from public.role_permissions
      where organization_id = p_org_id and role = p_role and permission_id = v_permission_id;
  end if;

  return 'updated';
end;
$$;

grant execute on function public.set_role_permission(uuid, app_role, text, boolean) to authenticated;

-- ────────────────────────────────────────────────────────────────
-- Dados da empresa (Configurações → Empresa) — só tinha SELECT.
-- Editar nome/razão social/documento é uma ação administrativa comum
-- e de baixo risco; some auditado como as demais.
-- ────────────────────────────────────────────────────────────────
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update
  using (has_org_role(id, array['admin'::app_role]))
  with check (has_org_role(id, array['admin'::app_role]));

drop trigger if exists trg_audit_organizations on public.organizations;
create trigger trg_audit_organizations
  after update on public.organizations
  for each row execute function write_audit_log();

notify pgrst, 'reload schema';
