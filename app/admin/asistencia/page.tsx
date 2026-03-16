import { createServerSupabase } from '@/lib/supabase-server'
import AttendanceClient from '@/components/AttendanceClient'

export const dynamic = 'force-dynamic'

export default async function AttendancePage() {
  const supabase = createServerSupabase()
  const { data: records } = await supabase
    .from('attendance')
    .select('*, students(nombres, apellidos, codigo, grupo), sessions(name)')
    .order('created_at', { ascending: false })

  return <AttendanceClient records={records ?? []} />
}
