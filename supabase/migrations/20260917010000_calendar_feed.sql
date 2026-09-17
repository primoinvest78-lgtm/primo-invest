-- Feed de calendário (iCalendar/.ics) — a primeira integração do
-- catálogo que passa a ser REAL e funcional, não só cadastro
-- administrativo. Padrão profissional de mercado (Google/Outlook/Apple
-- Calendar todos suportam): assinatura por URL, não exportação avulsa —
-- o calendário do usuário consulta a URL periodicamente sozinho, sem
-- precisar reimportar nada.
--
-- Um calendário externo faz um GET simples na URL, sem sessão
-- autenticada (não existe cookie/JWT de usuário nesse pedido) — por
-- isso a autorização vive num token opaco na própria URL, e a leitura
-- passa por uma função SECURITY DEFINER que valida o token e devolve
-- só as tarefas daquele usuário. Nenhuma outra tabela fica acessível
-- por essa porta.

create table if not exists public.calendar_feed_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  token text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  unique (organization_id, user_id)
);

alter table public.calendar_feed_tokens enable row level security;

-- Cada usuário só enxerga e gerencia o próprio token — nunca o de
-- outro membro da organização.
drop policy if exists calendar_feed_tokens_owner_access on public.calendar_feed_tokens;
create policy calendar_feed_tokens_owner_access on public.calendar_feed_tokens
  for all
  using (is_org_member(organization_id) and user_id = auth.uid())
  with check (is_org_member(organization_id) and user_id = auth.uid());

drop trigger if exists trg_audit_calendar_feed_tokens on public.calendar_feed_tokens;
create trigger trg_audit_calendar_feed_tokens
  after insert or update or delete on public.calendar_feed_tokens
  for each row execute function write_audit_log();

-- ────────────────────────────────────────────────────────────────
-- consume_calendar_feed — chamada pela rota pública (sem sessão),
-- roda com os privilégios do dono da função (SECURITY DEFINER), então
-- PRECISA validar tudo internamente: token revogado, token inexistente.
-- Também registra a sincronização de verdade — cada consulta de um
-- Google/Outlook/Apple Calendar de verdade vira uma linha honesta em
-- integration_sync_runs, porque essa sincronização REALMENTE aconteceu.
-- ────────────────────────────────────────────────────────────────
create or replace function public.consume_calendar_feed(p_token text)
returns table (
  task_id uuid,
  title text,
  description text,
  due_at timestamptz,
  status text,
  priority text,
  category text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_user_id uuid;
  v_connection_id uuid;
  v_count integer;
begin
  select organization_id, user_id
    into v_org_id, v_user_id
    from public.calendar_feed_tokens
   where token = p_token
     and revoked_at is null;

  if v_org_id is null then
    return; -- token inválido ou revogado: nenhuma linha, sem detalhar o motivo
  end if;

  update public.calendar_feed_tokens
     set last_accessed_at = now()
   where token = p_token;

  -- Conexão "calendario" desta organização (o catálogo garante que ela
  -- sempre existe assim que a tela de Integrações é aberta uma vez).
  select id into v_connection_id
    from public.integration_connections
   where organization_id = v_org_id
     and provider = 'calendario'
   limit 1;

  return query
    select t.id, t.title, t.description, t.due_at, t.status, t.priority, t.category
      from public.tasks t
     where t.organization_id = v_org_id
       and t.assigned_to = v_user_id
       and t.due_at is not null
       and t.status not in ('cancelled');

  get diagnostics v_count = row_count;

  if v_connection_id is not null then
    insert into public.integration_sync_runs (
      organization_id, connection_id, started_at, finished_at, status,
      records_processed, records_created, records_updated, records_failed,
      triggered_by
    ) values (
      v_org_id, v_connection_id, now(), now(), 'completed',
      v_count, v_count, 0, 0, 'system'
    );

    update public.integration_connections
       set last_sync_at = now()
     where id = v_connection_id;
  end if;
end;
$$;

-- A rota pública chama isso sem sessão de usuário — precisa ser
-- executável pelo papel anônimo do PostgREST.
grant execute on function public.consume_calendar_feed(text) to anon, authenticated;

notify pgrst, 'reload schema';
