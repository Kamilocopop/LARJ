'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ScannerPinPage() {
  const [pin,     setPin]     = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/scanner/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })

    if (res.ok) {
      // Guardar PIN en sessionStorage para uso en el escáner
      sessionStorage.setItem('scanner_pin', pin)
      router.push('/scanner/scan')
    } else {
      setError('PIN incorrecto. Contacta al administrador.')
      setPin('')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-bg grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl p-10 shadow-2xl animate-fade-up">

          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-blue to-blue-700 rounded-xl flex items-center justify-center text-2xl">
              📷
            </div>
            <div>
              <h1 className="font-serif text-xl text-white leading-none">Escáner QR</h1>
              <span className="text-xs text-muted font-mono uppercase tracking-widest">
                Acceso protegido
              </span>
            </div>
          </div>

          <h2 className="font-serif text-3xl text-white mb-1">PIN de sesión</h2>
          <p className="text-muted text-sm mb-8">
            Ingresa el PIN de 4 dígitos para activar el escáner
          </p>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm mb-5">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                PIN de 4 dígitos
              </label>
              <input
                type="password"
                value={pin}
                onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                maxLength={4}
                required
                className="w-full bg-bg border border-border rounded-lg px-4 py-4 text-white text-3xl
                           tracking-[0.5em] text-center font-mono
                           focus:border-blue focus:ring-2 focus:ring-blue/20 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full bg-blue hover:bg-blue-400 disabled:opacity-50 disabled:cursor-not-allowed
                         text-bg font-semibold py-3 rounded-lg transition text-sm"
            >
              {loading ? 'Verificando…' : '📷 Abrir escáner'}
            </button>

            <a
              href="/"
              className="block w-full text-center bg-surface2 border border-border hover:bg-border
                         text-white text-sm font-medium py-3 rounded-lg transition"
            >
              ← Volver al inicio
            </a>
          </form>
        </div>
      </div>
    </main>
  )
}
