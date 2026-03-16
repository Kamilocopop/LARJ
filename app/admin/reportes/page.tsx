import { createServerSupabase } from '@/lib/supabase-server'
import ReportsClient from '@/components/ReportsClient'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const supabase = createServerSupabase()

  const [summaryRes, sessionsRes] = await Promise.all([
    supabase.rpc('get_student_attendance_summary'),
    supabase.from('sessions').select('*').order('opened_at', { ascending: false }),
  ])

  return (
    <ReportsClient
      summary={summaryRes.data ?? []}
      sessions={sessionsRes.data ?? []}
    />
  )
}
