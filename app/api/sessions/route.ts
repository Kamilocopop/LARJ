import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Abrir nueva sesión
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const { name } = await req.json()

  // Cerrar cualquier sesión activa primero
  await supabase
    .from('sessions')
    .update({ active: false, closed_at: new Date().toISOString() })
    .eq('active', true)

  const { data, error } = await supabase
    .from('sessions')
    .insert({ name: name?.trim() || 'Clase', active: true })
    .select()
    .single()

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// Cerrar sesión activa
export async function DELETE() {
  const supabase = createServerSupabase()
  const { error } = await supabase
    .from('sessions')
    .update({ active: false, closed_at: new Date().toISOString() })
    .eq('active', true)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Obtener sesión activa
export async function GET() {
  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('sessions')
    .select('*')
    .eq('active', true)
    .maybeSingle()
  return NextResponse.json(data)
}
