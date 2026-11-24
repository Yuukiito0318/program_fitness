/** The logged-in user's own account (GET /api/session, /api/profile). */
export type CurrentUser = {
  id: number
  email_address: string
  email_verified: boolean
  nickname: string | null
  bio: string | null
  /** YYYY-MM-DD */
  birth_date: string
  age: number
  /** YYYY-MM */
  training_started_on: string
  training_years: number
  seller_requirements: {
    age: { required: number; met: boolean }
    training_years: { required: number; met: boolean }
    identity_verification: { status: 'not_available' }
    self_declared_requirements_met: boolean
  }
  created_at: string
}

export type UserResponse = { user: CurrentUser }
export type MessageResponse = { message: string }
