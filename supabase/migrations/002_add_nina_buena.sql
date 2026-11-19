-- =====================================================================
-- Migración 002: agrega el sticker "Niña buena" (Portarse bien)
-- Ejecutar UNA vez en Supabase: SQL Editor → New query → Run
-- No borra ni modifica los stickers ya pegados.
-- =====================================================================
begin;

-- Reemplaza la lista de tipos permitidos, sea cual sea el nombre del constraint actual
do $$
declare c record;
begin
  for c in
    select con.conname
    from pg_constraint con
    where con.conrelid = 'public.stickers'::regclass
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%type%'
  loop
    execute format('alter table public.stickers drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.stickers
  add constraint stickers_type_check
  check (type in ('polar', 'sapi', 'copito', 'nina_buena'));

commit;

-- Verificación: debe listar tus stickers actuales intactos
select type, count(*) from public.stickers group by type order by type;
