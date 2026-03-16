'use client'
import { useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Session } from '@/lib/types'

const NAV = [
  { href: '/admin',            label: 'Dashboard',    icon: '📊' },
  { href: '/admin/estudiantes',label: 'Estudiantes',  icon: '👥' },
  { href: '/admin/asistencia', label: 'Asistencia',   icon: '🕐' },
  { href: '/admin/reportes',   label: 'Reportes',     icon: '📈' },
]

export default function AdminShell({
  children,
  userEmail,
}: {
  children: React.ReactNode
  userEmail: string
}) {
  const pathname  = usePathname()
  const router    = useRouter()
  const supabase  = createClient()

  const [session,    setSession]    = useState<Session | null>(null)
  const [toggling,   setToggling]   = useState(false)
  const [sessionName, setSessionName] = useState('Clase')

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  async function toggleSession() {
    setToggling(true)
    if (session) {
      await fetch('/api/sessions', { method: 'DELETE' })
      setSession(null)
    } else {
      const res  = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: sessionName }),
      })
      const data = await res.json()
      setSession(data)
    }
    router.refresh()
    setToggling(false)
  }

  const isActive = (href: string) =>
    href === '/admin' ? pathname === href : pathname.startsWith(href)

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Topbar */}
      <header className="bg-surface border-b border-border sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3 gap-4 flex-wrap">

          {/* Brand + Nav */}
          <div className="flex items-center gap-6 flex-wrap">
            <a href="/admin" className="flex items-center gap-2.5 flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-green-700 rounded-lg flex items-center justify-center text-base">
                📋
              </div>
              <span className="font-serif text-[17px] text-white">AsistenciaPro</span>
            </a>

            <nav className="flex gap-1">
              {NAV.map(({ href, label, icon }) => (
                <a
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition
                    ${isActive(href)
                      ? 'bg-accent/10 text-accent'
                      : 'text-muted hover:text-white hover:bg-surface2'}`}
                >
                  <span>{icon}</span>{label}
                </a>
              ))}
            </nav>
          </div>

          {/* Right */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Session toggle */}
            <button
              onClick={toggleSession}
              disabled={toggling}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition
                ${session
                  ? 'border-accent/40 bg-accent/10 text-accent hover:bg-accent/20'
                  : 'border-border bg-surface2 text-muted hover:border-accent hover:text-white'}`}
            >
              <span className={`w-2 h-2 rounded-full transition ${session ? 'bg-accent shadow-[0_0_6px_#3fb950]' : 'bg-muted'}`} />
              {toggling ? '…' : session ? `Sesión: ${session.name}` : 'Sesión cerrada'}
            </button>

            {/* Scanner link */}
            <a
              href="/scanner"
              target="_blank"
              className="flex items-center gap-2 px-3 py-2 bg-surface2 border border-border
                         hover:bg-border text-white text-sm font-medium rounded-lg transition"
            >
              📷 Escáner
            </a>

            {/* User */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-surface2 border border-border rounded-full text-sm text-muted">
              <span className="w-2 h-2 bg-accent rounded-full" />
              <span className="max-w-[140px] truncate">{userEmail}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-2 bg-danger/10 border border-danger/30 text-danger
                         hover:bg-danger/20 text-sm font-medium rounded-lg transition"
            >
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Page content */}
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  )
}
