// Training program types (GET/POST/PATCH /api/my/programs).

export type ProgramCategory = 'power' | 'hypertrophy' | 'balance'
export type DurationUnit = 'week' | 'month'

export const CATEGORY_LABELS: Record<ProgramCategory, string> = {
  power: 'パワー',
  hypertrophy: '筋肥大',
  balance: 'バランス',
}

// Spec: 期間は1週間から3ヶ月 (provisional: weeks 1-12 or months 1-3; same rule as the backend).
export const DURATION_UNITS: Record<DurationUnit, { label: string; min: number; max: number }> = {
  week: { label: '週', min: 1, max: 12 },
  month: { label: 'ヶ月', min: 1, max: 3 },
}

// Spec: 販売価格は100円から100,000円.
export const PRICE_MIN = 100
export const PRICE_MAX = 100_000

export type ProgramExercise = {
  name: string
  sets: number | null
  reps: string | null
  weight: string | null
  rest: string | null
  note: string | null
}

export type ProgramDay = {
  name: string
  note: string | null
  exercises: ProgramExercise[]
}

export type SellerRequirements = {
  age: { required: number; met: boolean }
  training_years: { required: number; met: boolean }
  identity_verification: { status: 'not_available' }
  self_declared_requirements_met: boolean
}

export type ProgramSummary = {
  id: number
  status: 'draft'
  title: string
  category: ProgramCategory | null
  duration_value: number | null
  duration_unit: DurationUnit | null
  split_method: string | null
  price: number | null
  days_count: number
  exercises_count: number
  updated_at: string
}

export type ProgramDetail = ProgramSummary & {
  description: string | null
  target_audience: string | null
  equipment: string | null
  days: ProgramDay[]
  missing_items: string[]
  creator: {
    nickname: string | null
    bio: string | null
    training_years: number
    seller_requirements: SellerRequirements
  }
  created_at: string
}

export function formatDuration(value: number | null, unit: DurationUnit | null): string | null {
  if (!value || !unit) return null
  return unit === 'week' ? `${value}週間` : `${value}ヶ月`
}

export function formatPrice(price: number | null): string | null {
  return price == null ? null : `${price.toLocaleString('ja-JP')}円`
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
