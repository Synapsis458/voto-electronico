-- Sistema de Voto Electrónico Escolar — esquema Supabase
-- Ejecutar en el SQL Editor de Supabase (o `supabase db push`).
--
-- Modelo de acceso: RLS está activado en todas las tablas y SIN políticas
-- públicas. Toda la app (pantalla del elector y panel admin) lee y escribe
-- desde Server Components / Server Actions usando la service role key,
-- que ignora RLS. La anon key nunca debe usarse para leer o escribir estas
-- tablas directamente desde el navegador.
--
-- Autenticación del panel admin: usa Supabase Auth (Authentication > Users
-- en el dashboard) en vez de una tabla de usuarios propia. Crea ahí la
-- cuenta del administrador.

create extension if not exists "pgcrypto";

-- =========================================================
-- Institución (fila única de configuración del proceso electoral)
-- =========================================================
create table if not exists institucion (
  id uuid primary key default gen_random_uuid(),
  nombre text not null default '',
  logo_url text not null default '',
  proceso_electoral text not null default '',
  mensaje_bienvenida text not null default '',
  foto_portada_url text not null default '',
  fecha_proceso date,
  director text not null default '',
  comite_electoral text not null default '',
  anio_escolar text not null default '',
  hora_inicio time,
  hora_fin time,
  updated_at timestamptz not null default now()
);

comment on table institucion is 'Configuración general del proceso electoral. Se espera una sola fila.';

-- Migración para bases ya creadas antes de que existieran estas columnas.
alter table institucion add column if not exists hora_inicio time;
alter table institucion add column if not exists hora_fin time;

-- =========================================================
-- Electores
-- =========================================================
create table if not exists electores (
  id uuid primary key default gen_random_uuid(),
  dni text not null unique check (dni ~ '^[0-9]{8}$'),
  apellidos text not null,
  nombres text not null,
  grado text not null default '',
  seccion text not null default '',
  mesa text not null default '',
  ya_voto boolean not null default false,
  voto_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists electores_grado_seccion_idx on electores (grado, seccion);
create index if not exists electores_mesa_idx on electores (mesa);
create index if not exists electores_ya_voto_idx on electores (ya_voto);

-- =========================================================
-- Candidatos
-- =========================================================
create table if not exists candidatos (
  id uuid primary key default gen_random_uuid(),
  dni text not null unique check (dni ~ '^[0-9]{8}$'),
  apellidos text not null,
  nombres text not null,
  agrupacion text not null default '',
  fotografia_url text not null default '',
  simbolo_url text not null default '',
  orden integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists candidatos_orden_idx on candidatos (orden);

-- =========================================================
-- Votos
-- =========================================================
create table if not exists votos (
  id uuid primary key default gen_random_uuid(),
  elector_dni text not null references electores (dni) on delete restrict,
  candidato_id uuid references candidatos (id) on delete restrict,
  tipo_voto text not null check (tipo_voto in ('candidato', 'blanco')),
  mesa text not null default '',
  fecha date not null default current_date,
  hora time not null default current_time,
  created_at timestamptz not null default now(),
  constraint votos_candidato_requerido check (
    (tipo_voto = 'candidato' and candidato_id is not null) or
    (tipo_voto = 'blanco' and candidato_id is null)
  )
);

-- Un elector solo puede votar una vez (además del flag electores.ya_voto).
create unique index if not exists votos_elector_dni_unique on votos (elector_dni);
create index if not exists votos_candidato_id_idx on votos (candidato_id);
create index if not exists votos_mesa_idx on votos (mesa);

-- =========================================================
-- Auditoría (registro de acciones del panel admin)
-- =========================================================
create table if not exists auditoria (
  id uuid primary key default gen_random_uuid(),
  admin_email text not null,
  accion text not null,
  detalle text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists auditoria_created_at_idx on auditoria (created_at desc);

-- =========================================================
-- Miembros de mesa (Presidente, Secretario, Vocal) — se incorporan
-- automáticamente en el Acta Electoral. `mesa` en blanco significa
-- "aplica a todas las mesas" (colegios con una sola mesa).
-- =========================================================
create table if not exists miembros_mesa (
  id uuid primary key default gen_random_uuid(),
  mesa text not null default '',
  cargo text not null check (cargo in ('Presidente', 'Secretario(a)', 'Vocal')),
  apellidos text not null,
  nombres text not null,
  dni text not null default '' check (dni = '' or dni ~ '^[0-9]{8}$'),
  created_at timestamptz not null default now(),
  unique (mesa, cargo)
);

-- =========================================================
-- RLS: activado, sin políticas públicas (solo service role).
-- =========================================================
alter table institucion enable row level security;
alter table electores enable row level security;
alter table candidatos enable row level security;
alter table votos enable row level security;
alter table auditoria enable row level security;
alter table miembros_mesa enable row level security;
