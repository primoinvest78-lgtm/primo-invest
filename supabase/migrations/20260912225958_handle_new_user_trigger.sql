-- Cria automaticamente a linha em public.profiles quando um novo usuário
-- se cadastra no Supabase Auth. Sem isso, todo o modelo de RLS (is_org_member,
-- has_org_role, has_permission) não tem como funcionar: profiles.id é a
-- referência usada em organization_members.user_id, clients.assigned_advisor_id
-- e diversas outras FKs.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
