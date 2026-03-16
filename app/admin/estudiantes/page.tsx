import { createServerSupabase } from '@/lib/supabase-server'
import StudentsClient from '@/components/StudentsClient'

export const dynamic = 'force-dynamic'

export default async function StudentsPage() {
  const supabase = createServerSupabase()
  const { data: students } = await supabase
    .from('students')
    .select('*')
    .order('apellidos')

  // Asistencias de hoy para saber quién está presente
  const today = new Date().toISOString().split('T')[0]
  const { data: todayAttendance } = await supabase
    .from('attendance')
    .select('student_id')
    .eq('date', today)

  const presentToday = new Set((todayAttendance ?? []).map((a: any) => a.student_id))

  return (
    <StudentsClient
      initialStudents={students ?? []}
      presentToday={Array.from(presentToday)}
    />
  )
}
