import { createServerSupabase } from '@/lib/supabase-server'
import DashboardClient from '@/components/DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = createServerSupabase()

  const [statsRes, recentRes, sessionRes] = await Promise.all([
    supabase.rpc('get_today_stats'),
    supabase
      .from('attendance')
      .select('*, students(nombres, apellidos, codigo, grupo)')
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('sessions')
      .select('*')
      .eq('active', true)
      .maybeSingle(),
  ])

  return (
    <DashboardClient
      stats={statsRes.data ?? { total: 0, present: 0, absent: 0, percentage: 0 }}
      recent={recentRes.data ?? []}
      activeSession={sessionRes.data ?? null}
    />
  )
}
