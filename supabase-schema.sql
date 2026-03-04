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
  unique(student_id, session_id)
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
