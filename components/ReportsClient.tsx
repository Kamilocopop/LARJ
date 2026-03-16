'use client'
import { StudentSummary, Session } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  summary: StudentSummary[]
  sessions: Session[]
}

export default function ReportsClient({ summary, sessions }: Props) {
  const totalSessions = sessions.length
  const avgPct = summary.length
    ? Math.round(summary.reduce((a, s) => a + Number(s.percentage), 0) / summary.length)
    : 0
  const totalRecords = summary.reduce((a, s) => a + Number(s.attended), 0)

  const medals = ['🥇','🥈','🥉']

  function exportCSV() {
    const rows = [
      ['Nombres','Apellidos','Código','Grupo','Sesiones totales','Asistencias','% Asistencia'],
      ...summary.map(s => [
        s.nombres, s.apellidos, s.codigo ?? '', s.grupo ?? '',
        s.total_sessions, s.attended, `${s.percentage}%`,
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv)
    a.download = 'reporte-asistencia.csv'
    a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-3xl text-white mb-1">Reportes</h2>
          <p className="text-muted text-sm">Estadísticas acumuladas por estudiante</p>
        </div>
        <button
          onClick={exportCSV}
          className="bg-accent hover:bg-green-400 text-bg font-semibold text-sm px-4 py-2 rounded-lg transition"
        >
          ⬇ Exportar reporte CSV
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Sesiones dictadas',  value: totalSessions, color: 'bg-blue' },
          { label: 'Registros totales',  value: totalRecords,  color: 'bg-accent' },
          { label: '% Promedio',         value: `${avgPct}%`,  color: 'bg-gold' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface border border-border rounded-xl p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 ${color}`} />
            <p className="text-xs font-mono uppercase tracking-wider text-muted mb-2">{label}</p>
            <p className="font-serif text-4xl text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Ranking */}
      <h3 className="font-serif text-xl text-white mb-4">Ranking de asistencia</h3>
      <div className="bg-surface border border-border rounded-xl overflow-hidden mb-8">
        {summary.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-3">📈</div>
            <p className="text-sm">Agrega estudiantes y registra asistencias para ver el ranking.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Pos.','Estudiante','Grupo','Asistencias','% Asistencia','Estado'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {summary.map((s, i) => {
                  const pct = Number(s.percentage)
                  const [badgeBg, badgeText, status] =
                    pct >= 80 ? ['bg-accent/10','text-accent','✓ Regular']
                    : pct >= 50 ? ['bg-gold/10','text-gold','⚠ En riesgo']
                    : ['bg-danger/10','text-danger','✗ Crítico']

                  return (
                    <tr key={s.student_id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-3.5 text-xl">{medals[i] ?? `#${i+1}`}</td>
                      <td className="px-5 py-3.5">
                        <p className="text-sm font-medium text-white">{s.nombres} {s.apellidos}</p>
                        <p className="text-xs font-mono text-muted">{s.codigo ?? ''}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-surface2 border border-border rounded-full text-xs text-muted">
                          {s.grupo ?? '—'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs bg-blue/10 text-blue font-mono">
                          {s.attended} / {s.total_sessions}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="flex-1 h-1.5 bg-surface2 rounded-full min-w-[80px]">
                            <div
                              className="h-full bg-accent rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono text-muted w-10 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${badgeBg} ${badgeText}`}>
                          {status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sessions history */}
      {sessions.length > 0 && (
        <>
          <h3 className="font-serif text-xl text-white mb-4">Historial de sesiones</h3>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Sesión','Apertura','Cierre','Estado'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {sessions.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3 text-sm font-medium text-white">{s.name}</td>
                    <td className="px-5 py-3 text-xs font-mono text-muted">
                      {format(new Date(s.opened_at), "dd/MM/yyyy HH:mm")}
                    </td>
                    <td className="px-5 py-3 text-xs font-mono text-muted">
                      {s.closed_at ? format(new Date(s.closed_at), "dd/MM/yyyy HH:mm") : '—'}
                    </td>
                    <td className="px-5 py-3">
                      {s.active
                        ? <span className="px-2.5 py-1 rounded-full text-xs bg-accent/10 text-accent">🟢 Activa</span>
                        : <span className="px-2.5 py-1 rounded-full text-xs bg-surface2 text-muted">Cerrada</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
