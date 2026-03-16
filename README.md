# AsistenciaPro 📋

Sistema de asistencia por QR para Labor Social.  
Stack: **HTML puro + Vercel Functions + Supabase**

---

## Variables de entorno en Vercel

| Variable | Descripción |
|---|---|
| `SUPABASE_URL` | URL de tu proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key (bypasa RLS) |
| `ADMIN_TOKEN` | Contraseña del panel admin (la eliges tú) |
| `SCANNER_PIN` | PIN de 4 dígitos para el escáner |

---

## Configuración

1. Ejecuta `supabase-schema.sql` en Supabase SQL Editor
2. Agrega las 4 variables en Vercel Dashboard → Settings → Environment Variables
3. Sube los archivos a GitHub → Vercel despliega automáticamente

## Páginas

- `/` → Login admin
- `/admin.html` → Panel completo (dashboard, estudiantes, asistencia, reportes)
- `/scanner.html` → Escáner QR con cámara (protegido por PIN)
