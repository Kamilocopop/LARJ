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

// ── HORA COLOMBIA (UTC-5) ─────────────────────────────
function getNowColombia() {
  const now = new Date();
  const date = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now); // → "YYYY-MM-DD"
  const time = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(now); // → "HH:mm:ss"
  return { now, date, time };
}

async function getConfig() {
  try {
    const db = getSupabase();
    const { data } = await db.from('config').select('admin_token, scanner_pin').eq('id', 1).maybeSingle();
    if (data) return data;
  } catch {}
  return {
    admin_token: process.env.ADMIN_TOKEN || '',
    scanner_pin: process.env.SCANNER_PIN || '',
  };
}

async function checkAdmin(req) {
  const token = req.headers['x-admin-token'];
  if (!token) return false;
  const cfg = await getConfig();
  return token === cfg.admin_token;
}

export default async function handler(req, res) {
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
      case 'ping':       return await handlePing(req, res);
      case 'verify-pin': return await verifyPin(req, res);
      case 'attendance': return await handleAttendance(req, res, sub);
      case 'students':   return await handleStudents(req, res, sub);
      case 'sessions':   return await handleSessions(req, res, sub);
      case 'stats':      return await handleStats(req, res);
      case 'config':     return await handleConfig(req, res);
      case 'upload':     return await handleUpload(req, res, sub);
      default:           return res.status(404).json({ error: 'Endpoint no encontrado' });
    }
  } catch (err) {
    console.error('API Error:', err.message);
    return res.status(500).json({ error: 'Error interno', details: err.message });
  }
}

// ── KEEP-ALIVE PING ───────────────────────────────────
async function handlePing(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
  try {
    const db = getSupabase();
    // Consulta liviana para mantener activo el proyecto en Supabase
    const { error } = await db.from('config').select('id').eq('id', 1).maybeSingle();
    if (error) throw error;
    const { date, time } = getNowColombia();
    return res.status(200).json({ ok: true, message: 'Supabase activo', date, time });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
}

// ── UPLOAD FOTO ───────────────────────────────────────
async function handleUpload(req, res, sub) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
  if (sub !== 'photo') return res.status(404).json({ error: 'Endpoint no encontrado' });

  const db = getSupabase();
  const { studentId, imageBase64, mimeType } = req.body || {};
  if (!studentId || !imageBase64) return res.status(400).json({ error: 'studentId e imageBase64 requeridos' });

  // Eliminar foto anterior del storage para evitar archivos huérfanos y caché
  try {
    const { data: student } = await db.from('students').select('photo_url').eq('id', studentId).maybeSingle();
    if (student?.photo_url) {
      const urlObj = new URL(student.photo_url);
      const pathParts = urlObj.pathname.split('/student-photos/');
      if (pathParts[1]) {
        await db.storage.from('student-photos').remove([decodeURIComponent(pathParts[1])]);
      }
    }
  } catch {}

  // Convertir base64 a buffer
  const buffer   = Buffer.from(imageBase64, 'base64');
  const ext      = (mimeType || 'image/jpeg').split('/')[1] || 'jpg';
  // Nombre único con timestamp para evitar caché de CDN de Supabase
  const filename = `${studentId}_${Date.now()}.${ext}`;

  // Subir a Supabase Storage (sin upsert porque el nombre ya es único)
  const { error: uploadError } = await db.storage
    .from('student-photos')
    .upload(filename, buffer, { contentType: mimeType || 'image/jpeg', upsert: false });

  if (uploadError) return res.status(500).json({ error: uploadError.message });

  // Obtener URL pública
  const { data: urlData } = db.storage.from('student-photos').getPublicUrl(filename);
  const photoUrl = urlData.publicUrl;

  // Guardar URL en el estudiante
  const { error: updateError } = await db.from('students').update({ photo_url: photoUrl }).eq('id', studentId);
  if (updateError) return res.status(500).json({ error: updateError.message });

  return res.status(200).json({ success: true, photo_url: photoUrl });
}

// ── VERIFY PIN ────────────────────────────────────────
async function verifyPin(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const { pin, isAdmin: adminLogin } = req.body || {};
  if (!pin) return res.status(400).json({ error: 'PIN requerido' });
  const cfg = await getConfig();
  if (adminLogin) {
    if (pin === cfg.admin_token) return res.status(200).json({ ok: true });
    return res.status(401).json({ error: 'Contraseña incorrecta' });
  }
  if (pin === cfg.scanner_pin) return res.status(200).json({ ok: true });
  return res.status(401).json({ error: 'PIN incorrecto' });
}

// ── CONFIG ────────────────────────────────────────────
async function handleConfig(req, res) {
  const db = getSupabase();
  if (req.method === 'GET') {
    if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const { data } = await db.from('config').select('admin_token, scanner_pin').eq('id', 1).maybeSingle();
    return res.status(200).json(data || {});
  }
  if (req.method === 'POST') {
    if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const { admin_token, scanner_pin } = req.body || {};
    const updates = {};
    if (admin_token && admin_token.trim().length >= 4) updates.admin_token = admin_token.trim();
    if (scanner_pin && scanner_pin.trim().length >= 4) updates.scanner_pin = scanner_pin.trim();
    if (Object.keys(updates).length === 0) return res.status(400).json({ error: 'Mínimo 4 caracteres' });
    updates.updated_at = new Date().toISOString();
    const { error } = await db.from('config').upsert({ id: 1, ...updates });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

// ── STUDENTS ──────────────────────────────────────────
async function handleStudents(req, res, sub) {
  const db = getSupabase();
  if (req.method === 'GET' && !sub) {
    const { data, error } = await db.from('students').select('*').order('apellidos');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }
  if (req.method === 'POST' && !sub) {
    if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const { nombres, apellidos, codigo, grupo, email } = req.body || {};
    if (!nombres || !apellidos) return res.status(400).json({ error: 'Nombres y apellidos requeridos' });
    const { data, error } = await db
      .from('students')
      .insert({ nombres: nombres.trim(), apellidos: apellidos.trim(), codigo: codigo?.trim() || null, grupo: grupo?.trim() || null, email: email?.trim() || null })
      .select().single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'El código estudiantil ya existe' });
      return res.status(500).json({ error: error.message });
    }
    return res.status(201).json(data);
  }
  if (req.method === 'DELETE' && !sub) {
    if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: 'ID requerido' });
    // Eliminar foto del storage también
    try {
      const { data: student } = await db.from('students').select('photo_url').eq('id', id).maybeSingle();
      if (student?.photo_url) {
        const filename = student.photo_url.split('/').pop();
        await db.storage.from('student-photos').remove([filename]);
      }
    } catch {}
    const { error } = await db.from('students').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

// ── SESSIONS ──────────────────────────────────────────
async function handleSessions(req, res, sub) {
  const db = getSupabase();
  if (req.method === 'GET' && sub === 'active') {
    const { data } = await db.from('sessions').select('*').eq('active', true).maybeSingle();
    return res.status(200).json(data || null);
  }
  if (req.method === 'GET' && !sub) {
    const { data } = await db.from('sessions').select('*').order('opened_at', { ascending: false });
    return res.status(200).json(data || []);
  }
  if (req.method === 'POST' && !sub) {
    if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    await db.from('sessions').update({ active: false, closed_at: new Date().toISOString() }).eq('active', true);
    const { data, error } = await db.from('sessions').insert({ name: 'Clase', active: true }).select().single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }
  if (req.method === 'DELETE' && !sub) {
    if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    await db.from('sessions').update({ active: false, closed_at: new Date().toISOString() }).eq('active', true);
    return res.status(200).json({ success: true });
  }
  return res.status(405).json({ error: 'Método no permitido' });
}

// ── ATTENDANCE ────────────────────────────────────────
async function handleAttendance(req, res, sub) {
  const db = getSupabase();

  if (req.method === 'GET' && !sub) {
    const { data, error } = await db
      .from('attendance')
      .select('*, students(nombres, apellidos, codigo, grupo, photo_url), sessions(name)')
      .order('created_at', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data || []);
  }

  if (req.method === 'GET' && sub === 'today') {
    const { date: today } = getNowColombia();
    const { data, error } = await db.from('attendance').select('student_id').eq('date', today);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json((data || []).map(r => r.student_id));
  }

  if (req.method === 'POST' && sub === 'reset') {
    if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
    await db.from('sessions').update({ active: false, closed_at: new Date().toISOString() }).eq('active', true);
    const { error } = await db.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ success: true });
  }

  if (req.method === 'POST' && !sub) {
    const { studentId, pin } = req.body || {};
    if (!studentId) return res.status(400).json({ error: 'studentId requerido' });
    const cfg = await getConfig();
    if (pin !== cfg.scanner_pin) return res.status(401).json({ error: 'PIN inválido' });
    const { data: session } = await db.from('sessions').select('id, name').eq('active', true).maybeSingle();
    if (!session) return res.status(400).json({ error: 'Escaneo apagado. El profesor debe activarlo.' });
    const { data: student } = await db.from('students').select('id, nombres, apellidos, codigo, photo_url').eq('id', studentId).maybeSingle();
    if (!student) return res.status(404).json({ error: 'Estudiante no encontrado' });
    const { date, time } = getNowColombia();
    const { data, error } = await db
      .from('attendance')
      .insert({ student_id: studentId, session_id: session.id, date, time, method: 'qr' })
      .select().single();
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: `${student.nombres} ya registró asistencia hoy`, student });
      return res.status(500).json({ error: error.message });
    }
    return res.status(200).json({ success: true, student, attendance: data, time, session: session.name });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

// ── STATS ─────────────────────────────────────────────
async function handleStats(req, res) {
  if (!await checkAdmin(req)) return res.status(401).json({ error: 'No autorizado' });
  const db    = getSupabase();
  const { date: today } = getNowColombia();
  const [studentsRes, presentRes, attendanceRes, sessionsRes] = await Promise.all([
    db.from('students').select('*', { count: 'exact', head: true }),
    db.from('attendance').select('student_id').eq('date', today),
    db.from('attendance').select('*, students(nombres, apellidos, codigo, grupo, photo_url)').order('created_at', { ascending: false }).limit(10),
    db.from('sessions').select('*').order('opened_at', { ascending: false }),
  ]);
  const total   = studentsRes.count || 0;
  const present = new Set((presentRes.data || []).map(r => r.student_id)).size;
  return res.status(200).json({
    stats: { total, present, absent: total - present, percentage: total > 0 ? Math.round((present / total) * 100) : 0 },
    recent:   attendanceRes.data || [],
    sessions: sessionsRes.data   || [],
  });
}
