-- =============================================
-- AsistenciaPro - Schema Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

-- TABLA: estudiantes
create table public.students (
  id         uuid primary key default gen_random_uuid(),
  nombres    text not null,
  apellidos  text not null,
  codigo     text unique,
  grupo      text,
  email      text,
  created_at timestamptz default now()
);

-- TABLA: sesiones de clase
create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  name       text not null default 'Clase',
  active     boolean default false,
  opened_at  timestamptz default now(),
  closed_at  timestamptz
);

-- TABLA: asistencias
create table public.attendance (
  id         uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  session_id uuid references public.sessions(id),
  date       date not null default current_date,
  time       time not null default current_time,
  method     text default 'qr',
  created_at timestamptz default now(),
  -- Un estudiante solo puede registrar UNA asistencia por día (sin importar la sesión).
  unique(student_id, date)
);

-- ÍNDICES
create index idx_attendance_date    on public.attendance(date);
create index idx_attendance_student on public.attendance(student_id);
create index idx_sessions_active    on public.sessions(active);

-- ROW LEVEL SECURITY (la API usa service_role que bypasa RLS)
alter table public.students   enable row level security;
alter table public.sessions   enable row level security;
alter table public.attendance enable row level security;

-- Datos de prueba (opcional)
insert into public.students (nombres, apellidos, codigo, grupo) values
  ('Laura',   'Martínez Torres',  '2021-1001', 'Grupo A'),
  ('Carlos',  'Pérez Ruiz',       '2021-1002', 'Grupo A'),
  ('Diana',   'López Vargas',     '2021-1003', 'Grupo B'),
  ('Miguel',  'González Mora',    '2021-1004', 'Grupo B'),
  ('Sofía',   'Hernández Cruz',   '2021-1005', 'Grupo A');

-- TABLA: configuración (claves de acceso)
create table public.config (
  id           int primary key default 1,
  admin_token  text not null default 'admin123',
  scanner_pin  text not null default '1234',
  updated_at   timestamptz default now()
);

-- Solo puede haber una fila
alter table public.config enable row level security;

-- Insertar fila inicial.
-- ⚠️ IMPORTANTE: cambia estos valores por unos seguros ANTES de usar la app,
--    o hazlo desde el panel Admin → Configuración justo después del primer login.
--    No dejes 'admin123' / '1234' en producción.
insert into public.config (id, admin_token, scanner_pin) values (1, 'admin123', '1234')
on conflict (id) do nothing;

-- STORAGE: bucket para fotos de estudiantes
-- Ejecutar en Supabase Dashboard > Storage > New Bucket
-- Nombre: student-photos, Public: true
-- O ejecutar esto en SQL Editor:
insert into storage.buckets (id, name, public)
values ('student-photos', 'student-photos', true)
on conflict (id) do nothing;

-- Política: permitir subir y leer fotos (service role lo maneja desde la API)
create policy "Public read student photos"
  on storage.objects for select
  using ( bucket_id = 'student-photos' );

create policy "Service role upload student photos"
  on storage.objects for insert
  with check ( bucket_id = 'student-photos' );

create policy "Service role delete student photos"
  on storage.objects for delete
  using ( bucket_id = 'student-photos' );

-- Agregar columna foto a estudiantes (si no existe)
alter table public.students add column if not exists photo_url text;

-- =============================================
-- MIGRACIÓN: asistencia = 1 vez por estudiante por DÍA
-- Ejecuta este bloque UNA VEZ si tu base ya existía con la
-- restricción antigua unique(student_id, session_id).
-- (Si creas la base desde cero con este archivo, ya queda aplicado.)
-- =============================================

-- 1) Quitar la restricción antigua (nombre autogenerado por Postgres)
alter table public.attendance
  drop constraint if exists attendance_student_id_session_id_key;

-- 2) Eliminar duplicados existentes por (estudiante, día), conservando el más antiguo
delete from public.attendance a
using public.attendance b
where a.student_id = b.student_id
  and a.date       = b.date
  and (a.created_at, a.id) > (b.created_at, b.id);

-- 3) Crear la nueva unicidad (estudiante + fecha)
create unique index if not exists attendance_student_date_uniq
  on public.attendance(student_id, date);

-- =============================================
-- UTILIDAD: dejar UNA sola sesión activa
-- Seguro de re-ejecutar. Cierra todas las sesiones activas menos la
-- más reciente. Corrige el caso en que el escáner mostraba
-- "desactivado" por haber varias filas con active=true.
-- =============================================
update public.sessions
set active = false, closed_at = now()
where active = true
  and id <> (
    select id from public.sessions
    where active = true
    order by opened_at desc
    limit 1
  );
