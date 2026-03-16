'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Student } from '@/lib/types'
import QRModal from './QRModal'

interface Props {
  initialStudents: Student[]
  presentToday: string[]
}

export default function StudentsClient({ initialStudents, presentToday }: Props) {
  const router  = useRouter()
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [present]  = useState(new Set(presentToday))
  const [filter,   setFilter]  = useState('')
  const [loading,  setLoading] = useState(false)
  const [toast,    setToast]   = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [qrStudent, setQrStudent] = useState<Student | null>(null)

  // Form state
  const [form, setForm] = useState({ nombres: '', apellidos: '', codigo: '', grupo: '', email: '' })

  function showToast(msg: string, type: 'ok' | 'err' = 'ok') {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const res  = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setStudents(prev => [...prev, data].sort((a, b) => a.apellidos.localeCompare(b.apellidos)))
      setForm({ nombres: '', apellidos: '', codigo: '', grupo: '', email: '' })
      showToast(`✅ ${data.nombres} ${data.apellidos} registrado`)
    } else {
      showToast(`⚠ ${data.error}`, 'err')
    }
    setLoading(false)
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar a ${name}? Se borrarán sus registros de asistencia.`)) return
    await fetch('/api/students', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    setStudents(prev => prev.filter(s => s.id !== id))
    showToast(`🗑 ${name} eliminado`)
  }

  function exportCSV() {
    const rows = [
      ['Nombres', 'Apellidos', 'Código', 'Grupo', 'Email'],
      ...students.map(s => [s.nombres, s.apellidos, s.codigo ?? '', s.grupo ?? '', s.email ?? '']),
    ]
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n')
    const a = document.createElement('a')
    a.href = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csv)
    a.download = 'estudiantes.csv'
    a.click()
  }

  const filtered = students.filter(s =>
    `${s.nombres} ${s.apellidos} ${s.codigo ?? ''}`.toLowerCase().includes(filter.toLowerCase())
  )

  const COLORS = ['#3fb950','#58a6ff','#d29922','#f78166','#79c0ff','#a5d6ff']
  function avatarColor(id: string) { return COLORS[id.charCodeAt(id.length - 1) % COLORS.length] }

  return (
    <div>
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl border text-sm font-medium shadow-xl
          ${toast.type === 'ok' ? 'bg-surface border-accent/40 text-white' : 'bg-surface border-danger/40 text-danger'}`}>
          {toast.msg}
        </div>
      )}

      <div className="mb-7">
        <h2 className="font-serif text-3xl text-white mb-1">Estudiantes</h2>
        <p className="text-muted text-sm">{students.length} estudiantes registrados</p>
      </div>

      {/* Add form */}
      <div className="bg-surface border border-border rounded-xl p-6 mb-6">
        <h3 className="font-serif text-lg text-white mb-5">➕ Agregar estudiante</h3>
        <form onSubmit={handleAdd}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {[
              { key: 'nombres',   label: 'Nombres *',          ph: 'Ana María' },
              { key: 'apellidos', label: 'Apellidos *',         ph: 'García López' },
              { key: 'codigo',    label: 'Código estudiantil',  ph: '2021-1045' },
              { key: 'grupo',     label: 'Grupo / Semestre',    ph: 'Grupo A' },
              { key: 'email',     label: 'Correo (opcional)',   ph: 'estudiante@edu.co' },
            ].map(({ key, label, ph }) => (
              <div key={key} className={key === 'email' ? 'sm:col-span-2' : ''}>
                <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-1.5">{label}</label>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={(form as any)[key]}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={ph}
                  required={key === 'nombres' || key === 'apellidos'}
                  className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-white text-sm
                             focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition"
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-accent hover:bg-green-400 disabled:opacity-60 text-bg font-semibold
                       px-6 py-2.5 rounded-lg text-sm transition"
          >
            {loading ? 'Registrando…' : '✅ Registrar estudiante'}
          </button>
        </form>
      </div>

      {/* Table */}
      <div className="bg-surface border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-bg border border-border rounded-lg px-3 py-2 flex-1 max-w-xs">
            <span className="text-muted">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre o código…"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="bg-transparent text-white text-sm outline-none w-full placeholder:text-muted"
            />
          </div>
          <button
            onClick={exportCSV}
            className="bg-surface2 border border-border hover:bg-border text-white text-xs font-medium px-3 py-2 rounded-lg transition"
          >
            ⬇ Exportar CSV
          </button>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <div className="text-4xl mb-3">👥</div>
            <p className="text-sm">No se encontraron estudiantes.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {['Estudiante', 'Código', 'Grupo', 'Estado hoy', 'Acciones'].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-mono uppercase tracking-wider text-muted">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filtered.map(s => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-bg flex-shrink-0"
                          style={{ background: avatarColor(s.id) }}
                        >
                          {s.nombres[0]}{s.apellidos[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{s.nombres} {s.apellidos}</p>
                          <p className="text-xs text-muted font-mono">{s.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm font-mono text-muted">{s.codigo ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-0.5 bg-surface2 border border-border rounded-full text-xs text-muted">
                        {s.grupo ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {present.has(s.id)
                        ? <span className="px-2.5 py-1 rounded-full text-xs bg-accent/10 text-accent">✓ Presente</span>
                        : <span className="px-2.5 py-1 rounded-full text-xs bg-danger/10 text-danger">✗ Ausente</span>
                      }
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQrStudent(s)}
                          className="px-3 py-1.5 bg-surface2 border border-border hover:bg-border
                                     text-white text-xs font-medium rounded-lg transition"
                        >
                          Ver QR
                        </button>
                        <button
                          onClick={() => handleDelete(s.id, `${s.nombres} ${s.apellidos}`)}
                          className="px-3 py-1.5 bg-danger/10 border border-danger/30 hover:bg-danger/20
                                     text-danger text-xs font-medium rounded-lg transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* QR Modal */}
      {qrStudent && <QRModal student={qrStudent} onClose={() => setQrStudent(null)} />}
    </div>
  )
}
