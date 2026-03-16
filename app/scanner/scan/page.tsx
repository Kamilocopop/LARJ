'use client'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

type ResultState = {
  type: 'idle' | 'success' | 'error' | 'duplicate' | 'scanning'
  title: string
  detail: string
}

export default function ScanPage() {
  const router = useRouter()
  const scannerRef = useRef<any>(null)
  const [ready,   setReady]   = useState(false)
  const [locked,  setLocked]  = useState(false)
  const [result,  setResult]  = useState<ResultState>({
    type: 'idle', title: 'Esperando escaneo…', detail: 'Apunta la cámara al QR del estudiante',
  })

  useEffect(() => {
    const pin = sessionStorage.getItem('scanner_pin')
    if (!pin) { router.push('/scanner'); return }

    // Importar html5-qrcode dinámicamente (solo browser)
    import('html5-qrcode').then(({ Html5QrcodeScanner }) => {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 260, height: 260 }, aspectRatio: 1.0 },
        false
      )
      scannerRef.current.render(
        async (decodedText: string) => {
          if (locked) return
          setLocked(true)
          setResult({ type: 'scanning', title: 'Procesando…', detail: 'Registrando asistencia' })

          const studentId = decodedText.includes('?id=')
            ? new URL(decodedText).searchParams.get('id')
            : decodedText

          try {
            const res = await fetch('/api/attendance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ studentId, sessionPin: pin }),
            })
            const data = await res.json()

            if (res.ok) {
              setResult({
                type: 'success',
                title: `${data.student.nombres} ${data.student.apellidos}`,
                detail: `✅ Asistencia registrada · ${data.time}`,
              })
            } else if (res.status === 409) {
              setResult({ type: 'duplicate', title: 'Ya registrado', detail: data.error })
            } else if (res.status === 400) {
              setResult({ type: 'error', title: 'Sesión cerrada', detail: data.error })
            } else {
              setResult({ type: 'error', title: 'Error', detail: data.error })
            }
          } catch {
            setResult({ type: 'error', title: 'Sin conexión', detail: 'Verifica la red e intenta de nuevo' })
          }

          setTimeout(() => {
            setLocked(false)
            setResult({ type: 'idle', title: 'Listo para el siguiente', detail: 'Apunta la cámara al QR' })
          }, 2800)
        },
        () => { /* ignorar errores de frame */ }
      )
      setReady(true)
    })

    return () => { scannerRef.current?.clear().catch(() => {}) }
  }, [])

  const stateStyles: Record<string, string> = {
    idle:      'border-border bg-surface2',
    scanning:  'border-blue/50 bg-blue/10',
    success:   'border-accent/50 bg-accent/10',
    error:     'border-danger/50 bg-danger/10',
    duplicate: 'border-gold/50 bg-gold/10',
  }
  const stateIcons: Record<string, string> = {
    idle: '⏳', scanning: '🔄', success: '✅', error: '❌', duplicate: '⚠️',
  }

  return (
    <main className="min-h-screen bg-bg grid-bg flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="font-serif text-3xl text-white mb-1">📷 Escáner QR</h1>
          <p className="text-muted text-sm">Labor Social · Registro de asistencia</p>
        </div>

        {/* Camera */}
        <div className="bg-surface border border-border rounded-2xl overflow-hidden mb-4 relative">
          {!ready && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface z-10">
              <div className="text-center text-muted">
                <div className="text-4xl mb-3">📷</div>
                <p className="text-sm">Iniciando cámara…</p>
              </div>
            </div>
          )}
          <div id="qr-reader" />
        </div>

        {/* Result */}
        <div className={`border rounded-xl p-4 flex items-center gap-3 mb-4 transition-all duration-300 ${stateStyles[result.type]}`}>
          <span className="text-2xl flex-shrink-0">{stateIcons[result.type]}</span>
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{result.title}</p>
            <p className="text-muted text-xs font-mono mt-0.5">{result.detail}</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/scanner')}
          className="w-full bg-surface2 border border-border hover:bg-border text-white
                     text-sm font-medium py-3 rounded-lg transition"
        >
          ← Volver
        </button>
      </div>
    </main>
  )
}
