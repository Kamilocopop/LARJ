-- =============================================
-- AsistenciaPro - Schema Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =============================================

create extension if not exists "pgcrypto";

-- ── TABLA: estudiantes ──────────────────────
create table public.students (
  id         uuid primary key default gen_random_uuid(),
  nombres    text not null,
  apellidos  text not null,
  codigo     text unique,
  grupo      text,
  email      text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ── TABLA: sesiones de clase ─────────────────
create table public.sessions (
  id          uuid primary key default gen_random_uuid(),
  name        text not null default 'Clase',
  description text,
  active      boolean default false,
  opened_at   timestamptz default now(),
  closed_at   timestamptz,
  created_by  uuid references auth.users(id)
);

-- ── TABLA: asistencias ──────────────────────
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

-- ── ÍNDICES ──────────────────────────────────
create index idx_attendance_date    on public.attendance(date);
create index idx_attendance_student on public.attendance(student_id);
create index idx_sessions_active    on public.sessions(active);

-- ── ROW LEVEL SECURITY ───────────────────────
alter table public.students  enable row level security;
alter table public.sessions  enable row level security;
alter table public.attendance enable row level security;

create policy "Auth users full access students"
  on public.students for all to authenticated using (true) with check (true);

create policy "Auth users full access sessions"
  on public.sessions for all to authenticated using (true) with check (true);

create policy "Auth users full access attendance"
  on public.attendance for all to authenticated using (true) with check (true);

-- ── FUNCIÓN: stats del día ───────────────────
create or replace function get_today_stats()
returns json as $$
declare
  total_students int;
  present_today  int;
begin
  select count(*) into total_students from public.students;
  select count(distinct student_id) into present_today
    from public.attendance where date = (now() AT TIME ZONE 'America/Bogota')::date;
  return json_build_object(
    'total',      total_students,
    'present',    present_today,
    'absent',     total_students - present_today,
    'percentage', case when total_students > 0
      then round((present_today::decimal / total_students) * 100)
      else 0 end
  );
end;
$$ language plpgsql security definer;

-- ── FUNCIÓN: asistencias por estudiante ──────
create or replace function get_student_attendance_summary()
returns table(
  student_id   uuid,
  nombres      text,
  apellidos    text,
  codigo       text,
  grupo        text,
  total_sessions bigint,
  attended       bigint,
  percentage     numeric
) as $$
begin
  return query
  select
    s.id,
    s.nombres,
    s.apellidos,
    s.codigo,
    s.grupo,
    (select count(*) from public.sessions)::bigint as total_sessions,
    count(a.id)::bigint as attended,
    case when (select count(*) from public.sessions) > 0
      then round(count(a.id)::decimal / (select count(*) from public.sessions) * 100, 1)
      else 0
    end as percentage
  from public.students s
  left join public.attendance a on a.student_id = s.id
  group by s.id, s.nombres, s.apellidos, s.codigo, s.grupo
  order by attended desc;
end;
$$ language plpgsql security definer;

-- ── DATOS DE PRUEBA ──────────────────────────
insert into public.students (nombres, apellidos, codigo, grupo) values
  ('Laura',   'Martínez Torres',  '2021-1001', 'Grupo A'),
  ('Carlos',  'Pérez Ruiz',       '2021-1002', 'Grupo A'),
  ('Diana',   'López Vargas',     '2021-1003', 'Grupo B'),
  ('Miguel',  'González Mora',    '2021-1004', 'Grupo B'),
  ('Sofía',   'Hernández Cruz',   '2021-1005', 'Grupo A'),
  ('Andrés',  'Ramírez Bedoya',   '2021-1006', 'Grupo B'),
  ('Valeria', 'Castro Jiménez',   '2021-1007', 'Grupo A'),
  ('Juan',    'Torres Salcedo',   '2021-1008', 'Grupo B');
