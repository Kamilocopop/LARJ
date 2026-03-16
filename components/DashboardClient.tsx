'use client'
import { useRouter } from 'next/navigation'
import { DayStats, Attendance, Session } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  stats: DayStats
  recent: (Attendance & { students: any })[]
  activeSession: Session | null
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub: string; color: 'green' | 'blue' | 'red' | 'gold' }) {
  const top = { green: 'bg-accent', blue: 'bg-blue', red: 'bg-danger', gold: 'bg-gold' }[color]
  return (
    <div className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${top}`} />
      <p className="text-xs font-mono uppercase tracking-wider text-muted mb-3">{label}</p>
      <p className="font-serif text-4xl text-white leading-none mb-1.5">{value}</p>
      <p className="text-xs text-muted">{sub}</p>
    </div>
  )
}

export default function DashboardClient({ stats, recent, activeSession }: Props) {
  const router = useRouter()
  const today  = new Date()

  return (
    <div>
      <div className="mb-7">
        <h2 className="font-serif text-3xl text-white mb-1">Dashboard</h2>
        <p className="text-muted text-sm capitalize">
          {format(today, "EEEE d 'de' MMMM yyyy", { locale: es })}
          {activeSession && (
            <span className="ml-3 inline-flex items-center gap-1.5 text-accent">
              <span className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
              Sesión activa: {activeSession.name}
            </span>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total estudiantes" value={stats.total}      sub="registrados en el sistema" color="green" />
        <StatCard label="Presentes hoy"     value={stats.present}    sub="han escaneado su QR"       color="blue"  />
        <StatCard label="Ausentes"          value={stats.absent}     sub="sin registrar hoy"         color="red"   />
        <StatCard label="% Asistencia"      value={`${stats.percentage}%`} sub="hoy"                color="gold"  />
      </div>

      {/* Session status banner */}
      {!activeSession && (
        <div className="bg-gold/10 border border-gold/30 rounded-xl px-5 py-4 flex items-center justify-between mb-8">
          <div>
            <p className="text-gold font-semibold text-sm">⚠ No hay sesión activa</p>
            <p className="text-muted text-xs mt-0.5">Los estudiantes no podrán registrar asistencia hasta que abras una sesión.</p>
          </div>
          <span className="text-xs text-muted font-mono">Usa el botón "Sesión" en la barra superior</span>
        </div>
      )}

      {/* Recent log */}
      <h3 className="font-serif text-xl text-white mb-4">Actividad reciente</h3>
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {recent.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm">No hay registros aún. Activa una sesión y usa el escáner QR.</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/[0.02] transition">
                <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                <span className="text-xs font-mono text-muted w-20 flex-shrink-0">{r.time}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-white">
                    {r.students?.nombres} {r.students?.apellidos}
                  </span>
                  <span className="text-xs text-muted ml-2 font-mono">{r.students?.codigo}</span>
                </div>
                <span className="text-xs font-mono text-muted flex-shrink-0">
                  {r.date && format(new Date(r.date + 'T00:00'), 'dd/MM/yyyy')}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-accent/10 text-accent">
                  ✓ Presente
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
