import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabase } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { studentId, sessionPin } = await req.json()

    if (!studentId) {
      return NextResponse.json({ error: 'ID de estudiante requerido' }, { status: 400 })
    }

    // Verificar PIN del escáner
    if (sessionPin !== process.env.SCANNER_PIN) {
      return NextResponse.json({ error: 'PIN inválido' }, { status: 401 })
    }

    const supabase = createServiceSupabase()

    // Verificar sesión activa
    const { data: session } = await supabase
      .from('sessions')
      .select('id, name')
      .eq('active', true)
      .maybeSingle()

    if (!session) {
      return NextResponse.json(
        { error: 'No hay sesión activa. El profesor debe abrir una sesión primero.' },
        { status: 400 }
      )
    }

    // Verificar que el estudiante existe
    const { data: student } = await supabase
      .from('students')
      .select('id, nombres, apellidos, codigo, grupo')
      .eq('id', studentId)
      .maybeSingle()

    if (!student) {
      return NextResponse.json({ error: 'Estudiante no registrado en el sistema' }, { status: 404 })
    }

    // Registrar asistencia
    const now  = new Date()
    const date = now.toISOString().split('T')[0]
    const time = now.toTimeString().split(' ')[0]

    const { data, error } = await supabase
      .from('attendance')
      .insert({ student_id: studentId, session_id: session.id, date, time, method: 'qr' })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: `${student.nombres} ya registró asistencia en esta sesión` },
          { status: 409 }
        )
      }
      throw error
    }

    return NextResponse.json({
      success: true,
      student,
      attendance: data,
      time: now.toLocaleTimeString('es-CO', { hour12: false }),
      session: session.name,
    })
  } catch (err) {
    console.error('[attendance POST]', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
