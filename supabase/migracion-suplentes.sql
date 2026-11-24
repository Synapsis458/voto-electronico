-- =========================================================
-- Migración: suplentes de mesa (1er, 2do y 3er Suplente)
-- Ejecutar UNA VEZ en Supabase → SQL Editor. No borra datos.
-- =========================================================
alter table miembros_mesa drop constraint if exists miembros_mesa_cargo_check;

alter table miembros_mesa
  add constraint miembros_mesa_cargo_check
  check (cargo in (
    'Presidente', 'Secretario(a)', 'Vocal',
    '1er Suplente', '2do Suplente', '3er Suplente'
  ));
