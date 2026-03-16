'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Credenciales incorrectas. Verifica tu correo y contraseña.')
    } else {
      router.push('/admin')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-bg grid-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-2xl p-10 shadow-2xl animate-fade-up">

          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-11 h-11 bg-gradient-to-br from-accent to-green-700 rounded-xl flex items-center justify-center text-2xl">
              📋
            </div>
            <div>
              <h1 className="font-serif text-xl text-white leading-none">AsistenciaPro</h1>
              <span className="text-xs text-muted font-mono uppercase tracking-widest">
                Labor Social · Admin
              </span>
            </div>
          </div>

          <h2 className="font-serif text-3xl text-white mb-1">Bienvenido</h2>
          <p className="text-muted text-sm mb-8">Ingresa tus credenciales de administrador</p>

          {error && (
            <div className="bg-danger/10 border border-danger/30 text-danger rounded-lg px-4 py-3 text-sm mb-5">
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@universidad.edu.co"
                required
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white text-sm
                           focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-muted mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-white text-sm
                           focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-green-400 disabled:opacity-60 disabled:cursor-not-allowed
                         text-bg font-semibold py-3 rounded-lg transition-all mt-2 text-sm"
            >
              {loading ? 'Verificando…' : '🔐 Ingresar al sistema'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted text-center mb-3">¿Eres monitor y quieres usar el escáner?</p>
            <a
              href="/scanner"
              className="block w-full text-center bg-surface2 border border-border hover:bg-border
                         text-white text-sm font-medium py-2.5 rounded-lg transition"
            >
              📷 Ir al Escáner QR
            </a>
          </div>
        </div>
      </div>
    </main>
  )
}
