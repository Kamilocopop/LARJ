'use client'
import { useEffect, useRef } from 'react'
import { Student } from '@/lib/types'

interface Props {
  student: Student
  onClose: () => void
}

export default function QRModal({ student, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin
    const qrData = `${appUrl}/scanner/scan?id=${student.id}`

    import('qrcode').then(QRCode => {
      if (canvasRef.current) {
        QRCode.toCanvas(canvasRef.current, qrData, {
          width: 220,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        })
      }
    })
  }, [student.id])

  function handlePrint() {
    const canvas = canvasRef.current
    if (!canvas) return
    const img = canvas.toDataURL('image/png')
    const win = window.open('', '_blank')!
    win.document.write(`
      <html><head><title>QR - ${student.nombres} ${student.apellidos}</title>
      <style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#fff}
      h2{margin:0 0 4px;font-size:18px}p{margin:0 0 16px;font-size:13px;color:#666}</style></head>
      <body>
        <h2>${student.nombres} ${student.apellidos}</h2>
        <p>${student.codigo ?? ''} · ${student.grupo ?? ''}</p>
        <img src="${img}" />
        <p style="margin-top:12px;font-size:11px;color:#999">${student.id}</p>
        <script>window.onload=()=>window.print()</script>
      </body></html>
    `)
    win.document.close()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-surface border border-border rounded-2xl p-8 w-full max-w-sm animate-scale-in relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 bg-surface2 border border-border rounded-md
                     text-muted hover:text-white flex items-center justify-center text-sm transition"
        >
          ✕
        </button>

        <h3 className="font-serif text-2xl text-white mb-1">Código QR</h3>
        <p className="text-muted text-sm mb-5">
          {student.nombres} {student.apellidos}
          {student.codigo && <span className="font-mono ml-2">· {student.codigo}</span>}
        </p>

        <div className="bg-white rounded-xl p-5 flex justify-center mb-4">
          <canvas ref={canvasRef} />
        </div>

        <div className="bg-surface2 border border-border rounded-lg px-4 py-3 flex justify-between items-center mb-5">
          <span className="text-xs font-mono text-muted">ID único</span>
          <span className="text-xs font-mono text-accent truncate max-w-[180px]">{student.id}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 bg-accent hover:bg-green-400 text-bg font-semibold py-2.5 rounded-lg text-sm transition"
          >
            🖨 Imprimir QR
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-surface2 border border-border hover:bg-border text-white py-2.5 rounded-lg text-sm transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
