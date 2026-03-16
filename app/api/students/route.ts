import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createServerSupabase()
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .order('apellidos')
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabase()
  const body = await req.json()

  if (!body.nombres || !body.apellidos) {
    return NextResponse.json({ error: 'Nombres y apellidos son requeridos' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('students')
    .insert({
      nombres:   body.nombres.trim(),
      apellidos: body.apellidos.trim(),
      codigo:    body.codigo?.trim()  || null,
      grupo:     body.grupo?.trim()   || null,
      email:     body.email?.trim()   || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'El código estudiantil ya existe' }, { status: 409 })
    }
    return NextResponse.json({ error }, { status: 500 })
  }
  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const supabase = createServerSupabase()
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
  const { error } = await supabase.from('students').delete().eq('id', id)
  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ success: true })
}
