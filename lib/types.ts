export interface Student {
  id: string
  nombres: string
  apellidos: string
  codigo: string | null
  grupo: string | null
  email: string | null
  created_at: string
}

export interface Session {
  id: string
  name: string
  description: string | null
  active: boolean
  opened_at: string
  closed_at: string | null
}

export interface Attendance {
  id: string
  student_id: string
  session_id: string | null
  date: string
  time: string
  method: 'qr' | 'manual'
  created_at: string
  students?: Student
  sessions?: Session
}

export interface DayStats {
  total: number
  present: number
  absent: number
  percentage: number
}

export interface StudentSummary {
  student_id: string
  nombres: string
  apellidos: string
  codigo: string | null
  grupo: string | null
  total_sessions: number
  attended: number
  percentage: number
}
