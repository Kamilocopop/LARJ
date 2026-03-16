# AsistenciaPro 📋

Sistema de asistencia por código QR para clases de Labor Social.

## Stack tecnológico
- **Next.js 14** (App Router + Server Components)
- **Supabase** (PostgreSQL + Auth + RLS)
- **Tailwind CSS**
- **qrcode** — generación de QR
- **html5-qrcode** — lectura de QR por cámara
- **Vercel** — deploy automático

---

## 🚀 Configuración paso a paso

### 1. Supabase

1. Crea proyecto en [supabase.com](https://supabase.com)
2. Ve a **SQL Editor** y ejecuta el archivo `supabase-schema.sql`
3. Ve a **Authentication > Users** → crea tu usuario admin
4. Ve a **Project Settings > API** → copia las keys

### 2. Variables de entorno

```bash
cp .env.local.example .env.local
```

Rellena el archivo `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
SCANNER_PIN=1234
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### 3. Instalar y correr

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

### 4. Deploy en Vercel

1. Sube el código a GitHub
2. Importa el repo en [vercel.com](https://vercel.com)
3. Agrega las variables de entorno en **Vercel Dashboard > Settings > Environment Variables**
4. ¡Cada push a `main` hace deploy automático!

---

## 🔄 Flujo de uso

1. **Admin** entra a `/` con su email y contraseña de Supabase
2. **Admin** va a **Estudiantes** → agrega nombres y apellidos
3. **Admin** hace clic en **"Ver QR"** → imprime el QR de cada estudiante
4. **Admin** abre una sesión con el botón **"Sesión cerrada"** en la barra superior
5. **Monitor** va a `/scanner` en su celular → ingresa el PIN de 4 dígitos
6. Los **estudiantes** muestran su QR → el monitor lo escanea con la cámara
7. **Admin** ve el registro en **Dashboard** y **Asistencia** con fecha y hora exacta
8. **Admin** exporta reportes CSV desde **Reportes**

---

## 🔐 Seguridad

| Capa | Mecanismo |
|------|-----------|
| Panel admin | Supabase Auth (email + contraseña) |
| Rutas `/admin` | middleware.ts verifica sesión JWT |
| Escáner | PIN de 4 dígitos separado (no requiere cuenta) |
| Base de datos | Row Level Security en todas las tablas |
| Registro único | Restricción UNIQUE por estudiante + sesión |
| QRs | UUID v4 único e irrepetible por estudiante |

---

## 📁 Estructura

```
asistencia-pro/
├── app/
│   ├── page.tsx                    ← Login admin
│   ├── admin/
│   │   ├── page.tsx                ← Dashboard
│   │   ├── estudiantes/page.tsx    ← CRUD estudiantes + generar QR
│   │   ├── asistencia/page.tsx     ← Historial con filtros
│   │   └── reportes/page.tsx       ← Stats + ranking + exportar
│   ├── scanner/
│   │   ├── page.tsx                ← PIN de acceso
│   │   └── scan/page.tsx           ← Escáner con cámara
│   └── api/
│       ├── attendance/route.ts
│       ├── students/route.ts
│       ├── sessions/route.ts
│       └── scanner/verify-pin/route.ts
├── components/
│   ├── AdminShell.tsx              ← Topbar + nav
│   ├── DashboardClient.tsx
│   ├── StudentsClient.tsx
│   ├── AttendanceClient.tsx
│   ├── ReportsClient.tsx
│   └── QRModal.tsx
├── lib/
│   ├── supabase.ts
│   ├── supabase-server.ts
│   └── types.ts
├── middleware.ts
└── supabase-schema.sql
```
