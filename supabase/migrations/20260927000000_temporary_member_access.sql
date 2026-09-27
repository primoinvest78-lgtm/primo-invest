-- Acesso provisório (convite com prazo). Um vínculo com
-- access_expires_at no passado deixa de valer NO BANCO: is_org_member e
-- has_org_role — base de todas as regras de acesso (RLS) — passam a
-- ignorá-lo. A conta e o vínculo continuam lá; estender o prazo devolve
-- o acesso. null = acesso permanente (todo mundo que já existe).

alter table public.organization_members
  add column if not exists access_expires_at timestamptz;

create or replace function public.is_org_member(p_org_id uuid)
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and (om.access_expires_at is null or om.access_expires_at > now())
  );
$$;

create or replace function public.has_org_role(p_org_id uuid, p_roles app_role[])
returns boolean
language sql
stable security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members om
    where om.organization_id = p_org_id
      and om.user_id = auth.uid()
      and om.status = 'active'
      and om.role = any(p_roles)
      and (om.access_expires_at is null or om.access_expires_at > now())
  );
$$;

-- Define, estende ou remove (null) o prazo de um membro — admin-only.
-- Administrador nunca é provisório: evita a organização ficar sem
-- nenhum admin quando um prazo vence.
create or replace function public.set_member_access_expiry(
  p_org_id uuid,
  p_member_id uuid,
  p_expires_at timestamptz
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role app_role;
begin
  if not has_org_role(p_org_id, array['admin']::app_role[]) then
    raise exception 'not authorized';
  end if;

  select role into v_role
    from public.organization_members
    where id = p_member_id and organization_id = p_org_id;

  if v_role is null then
    return 'not_found';
  end if;

  if v_role = 'admin' and p_expires_at is not null then
    return 'admin_not_temporary';
  end if;

  update public.organization_members
    set access_expires_at = p_expires_at
    where id = p_member_id;
  return 'updated';
end;
$$;

-- Listagem passa a trazer o prazo (mudou o formato do retorno, então
-- precisa recriar).
drop function if exists public.list_organization_members(uuid);

create function public.list_organization_members(p_org_id uuid)
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
  invited_at timestamptz,
  access_expires_at timestamptz
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
           u.last_sign_in_at, u.invited_at, om.access_expires_at
    from public.organization_members om
    join public.profiles p on p.id = om.user_id
    left join auth.users u on u.id = om.user_id
    where om.organization_id = p_org_id
    order by om.created_at asc;
end;
$$;

revoke execute on function public.set_member_access_expiry(uuid, uuid, timestamptz) from public, anon;
revoke execute on function public.list_organization_members(uuid) from public, anon;
grant execute on function public.set_member_access_expiry(uuid, uuid, timestamptz) to authenticated, service_role;
grant execute on function public.list_organization_members(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
