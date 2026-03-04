import { createClient } from '@supabase/supabase-js';

let supabase = null;

function getSupabase() {
  if (!supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  }
  return supabase;
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const url      = new URL(req.url, `http://${req.headers.host}`);
  const parts    = url.pathname.replace('/api/', '').split('/').filter(Boolean);
  const endpoint = parts[0];
  const sub      = parts[1];

  try {
    switch (endpoint) {
      case 'health':     return res.status(200).json({ ok: true });
      case 'attendance': return await handleAttendance(req, res, sub);
      case 'students':   return await handleStudents(req, res, sub);
      case 'sessions':   return await handleSessions(req, res, sub);
      case 'stats':      return await handleStats(req, res);
      case 'verify-pin': return await verifyPin(req, res);
      default:           return res.status(404).json({ error: 'Endpoint no encontrado' });
    }
  } catch (err) {
    console.error('API Error:', err.message);
    return res.status(500).json({ error: 'Error interno', details: err.message });
  }
}

// ── AUTH HELPER ─────────────────────────────────────
function isAdmin(req) {
  return req.headers['x-admin-token'] === process.env.ADMIN_TOKEN;
}

// ── VERIFY SCANNER PIN ───────────────────────────────
async function verifyPin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { pin } = req.body || {};
  if (pin === process.env.SCANNER_PIN) return res.status(200).json({ ok: true });
  return res.status(401).json({ error: 'PIN incorrecto' });
}

// ── STUDENTS ─────────────────────────────────────────
async function handleStudents(req, res, sub) {
  const db = getSupabase();

  // GET /api/students → listar todos
  if (req.method === 'GET' && !sub) {
    const { data, error } = await db
      .from('students')
      .select('*')
      .order('apellidos');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  // POST /api/students → crear
  if (req.method === 'POST' && !sub) {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const { nombres, apellidos, codigo, grupo, email } = req.body || {};
    if (!nombres || !apellidos) return res.status(400).json({ error: 'Nombres y apellidos requeridos' });
    const { data, error } = await db
      .from('students')
      .insert({ nombres: nombres.trim(), apellidos: apellidos.trim(), codigo: codigo?.trim() || null, grupo: grupo?.trim() || null, email: email?.trim() || null })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'El código estudiantil ya existe' });
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
  }

  // DELETE /api/students → eliminar
  if (req.method === 'DELETE' && !sub) {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    const { error } = await db.from('students').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ── SESSIONS ──────────────────────────────────────────
async function handleSessions(req, res, sub) {
  const db = getSupabase();

  // GET /api/sessions/active → sesión activa
  if (req.method === 'GET' && sub === 'active') {
    const { data } = await db.from('sessions').select('*').eq('active', true).maybeSingle();
    return res.status(200).json(data || null);
  }

  // GET /api/sessions → historial
  if (req.method === 'GET' && !sub) {
    const { data } = await db.from('sessions').select('*').order('opened_at', { ascending: false });
    return res.status(200).json(data || []);
  }

  // POST /api/sessions → abrir sesión
  if (req.method === 'POST' && !sub) {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const { name } = req.body || {};
    // Cerrar sesiones activas
    await db.from('sessions').update({ active: false, closed_at: new Date().toISOString() }).eq('active', true);
    const { data, error } = await db.from('sessions').insert({ name: name?.trim() || 'Clase', active: true }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  // DELETE /api/sessions → cerrar sesión activa
  if (req.method === 'DELETE' && !sub) {
    if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    await db.from('sessions').update({ active: false, closed_at: new Date().toISOString() }).eq('active', true);
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ── ATTENDANCE ────────────────────────────────────────
async function handleAttendance(req, res, sub) {
  const db = getSupabase();

  // GET /api/attendance → historial completo
  if (req.method === 'GET' && !sub) {
    const { data, error } = await db
      .from('attendance')
      .select('*, students(nombres, apellidos, codigo, grupo), sessions(name)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  // GET /api/attendance/today → asistencia de hoy
  if (req.method === 'GET' && sub === 'today') {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await db
      .from('attendance')
      .select('student_id')
      .eq('date', today);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(r => r.student_id));
  }

  // POST /api/attendance → registrar asistencia (desde el escáner)
  if (req.method === 'POST' && !sub) {
    const { studentId, pin } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'studentId requerido' });

    // Verificar PIN del escáner
    if (pin !== process.env.SCANNER_PIN) return res.status(401).json({ error: 'PIN inválido' });

    // Verificar sesión activa
    const { data: session } = await db.from('sessions').select('id, name').eq('active', true).maybeSingle();
    if (!session) return res.status(400).json({ error: 'No hay sesión activa. El profesor debe abrir una sesión primero.' });

    // Verificar que el estudiante existe
    const { data: student } = await db.from('students').select('id, nombres, apellidos, codigo').eq('id', studentId).maybeSingle();
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado en el sistema' });

    // Registrar asistencia
    const now  = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().split(' ')[0];

    const { data, error } = await db
      .from('attendance')
      .insert({ student_id: studentId, session_id: session.id, date, time, method: 'qr' })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: `${student.nombres} ya registró asistencia en esta sesión` });
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true, student, attendance: data, time, session: session.name });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ── STATS ─────────────────────────────────────────────
async function handleStats(req, res) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
  const db = getSupabase();

  const today = new Date().toISOString().split('T')[0];

  const [studentsRes, presentRes, attendanceRes, sessionsRes] = await Promise.all([
    db.from('students').select('*', { count: 'exact', head: true }),
    db.from('attendance').select('student_id').eq('date', today),
    db.from('attendance').select('*, students(nombres, apellidos, codigo, grupo)').order('created_at', { ascending: false }).limit(10),
    db.from('sessions').select('*').order('opened_at', { ascending: false }),
  ]);

  const total   = studentsRes.count || 0;
  const present = new Set((presentRes.data || []).map(r => r.student_id)).size;

  return res.status(200).json({
    stats: {
      total,
      present,
      absent: total - present,
      percentage: total > 0 ? Math.round((present / total) * 100) : 0,
    },
    recent:   attendanceRes.data || [],
    sessions: sessionsRes.data   || [],
  });
}
