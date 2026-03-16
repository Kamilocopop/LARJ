import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AdminShell from '@/components/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  return <AdminShell userEmail={user.email ?? ''}>{children}</AdminShell>
}
