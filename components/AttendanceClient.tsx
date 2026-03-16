'use client'
import { useState } from 'react'
import { Attendance } from '@/lib/types'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

interface Props {
  records: (Attendance & { students: any; sessions: any })[]
}

export default function AttendanceClient({ records }: Props) {
  const [dateFilter, setDateFilter] = useState('')

  const filtered = dateFilter
    ? records.filter(r => r.date === dateFilter)
    : records

  function exportCSV() {
    const rows = [
      ['Nombres', 'Apellidos', 'Código', 'Grupo', 'Fecha', 'Hora', 'Sesión', 'Método'],
      ...filtered.map(r => [
        r.students?.nombres ?? '—',
        r.students?.apellidos ?? '—',
        r.students?.codigo ?? '—',
        r.students?.grupo ?? '—',
        r.date,
        r.time,
        r.sessions?.name ?? '—',
        r.method,
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv)
    a.download = `asistencia-${dateFilter || 'completa'}.csv`
    a.click()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-7 gap-4 flex-wrap">
        <div>
          <h2 className="font-serif text-3xl text-white mb-1">Registro de Asistencia</h2>
          <p className="text-muted text-sm">{filtered.length} registros {dateFilter ? `· ${format(new Date(dateFilter + 'T00:00'), "d 'de' MMMM", { locale: es })}` : 'totales'}</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            className="bg-surface2 border border-border rounded-lg px-3 py-2 text-white text-sm outline-none
                       focus:border-accent transition"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="bg-surface2 border border-border hover:bg-border text-white text-sm px-3 py-2 rounded-lg transition"
            >
              Ver todo
            </button>
          )}
          <button
            onClick={exportCSV}
            className="bg-accent hover:bg-green-400 text-bg font-semibold text-sm px-4 py-2 rounded-lg transition"
          >
            ⬇ Exportar CSV
          </button>
        </div>
      </div>

      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-3">🕐</div>
            <p className="text-sm">No hay registros para este filtro.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['#', 'Estudiante', 'Código', 'Grupo', 'Fecha', 'Hora', 'Sesión', 'Método'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map((r, i) => (
                  <tr key={r.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5 text-xs font-mono text-muted">{i + 1}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm font-medium text-white">
                        {r.students?.nombres} {r.students?.apellidos}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono text-muted">{r.students?.codigo ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-surface2 border border-border rounded-full text-xs text-muted">
                        {r.students?.grupo ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono text-muted">
                      {format(new Date(r.date + 'T00:00'), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-full text-xs bg-gold/10 text-gold font-mono">{r.time}</span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">{r.sessions?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono
                        ${r.method === 'qr' ? 'bg-blue/10 text-blue' : 'bg-surface2 text-muted'}`}>
                        {r.method}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
