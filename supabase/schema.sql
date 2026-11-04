-- =====================================================================
-- Tabla de Premios de Alison — esquema de base de datos
-- Ejecutar UNA vez en Supabase: Dashboard → SQL Editor → New query → Run
-- =====================================================================

create table if not exists public.stickers (
  id          bigint generated always as identity primary key,
  type        text        not null check (type in ('polar', 'sapi', 'copito')),
  note        text,
  created_at  timestamptz not null default now()
);

-- ---------- Seguridad (Row Level Security) ----------
alter table public.stickers enable row level security;

-- Cualquiera puede VER la cartilla
drop policy if exists "lectura publica" on public.stickers;
create policy "lectura publica"
  on public.stickers for select
  to anon, authenticated
  using (true);

-- Solo Martin puede AGREGAR stickers
drop policy if exists "solo admin inserta" on public.stickers;
create policy "solo admin inserta"
  on public.stickers for insert
  to authenticated
  with check ((auth.jwt() ->> 'email') = 'martin.vivanco.10@gmail.com');

-- Solo Martin puede QUITAR stickers (botón "Deshacer")
drop policy if exists "solo admin borra" on public.stickers;
create policy "solo admin borra"
  on public.stickers for delete
  to authenticated
  using ((auth.jwt() ->> 'email') = 'martin.vivanco.10@gmail.com');

-- Permisos explícitos (no se permite UPDATE: un sticker pegado no se edita, se deshace)
revoke all on public.stickers from anon, authenticated;
grant select on public.stickers to anon, authenticated;
grant insert (type, note), delete on public.stickers to authenticated;

-- ---------- Regla de negocio: máximo 50 recuadros ----------
create or replace function public.stickers_max_50()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select count(*) from public.stickers) >= 50 then
    raise exception 'La cartilla ya está completa (50 stickers)';
  end if;
  return new;
end;
$$;

drop trigger if exists stickers_max_50 on public.stickers;
create trigger stickers_max_50
  before insert on public.stickers
  for each row execute function public.stickers_max_50();

-- ---------- Estado inicial: arrancamos con un sticker de Polar ----------
insert into public.stickers (type)
select 'polar'
where not exists (select 1 from public.stickers);
