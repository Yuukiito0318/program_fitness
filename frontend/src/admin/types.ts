// Types for the admin (operator) screens. Mirrors /api/admin/*.

export type AdminAccount = {
  id: number
  name: string
  email_address: string
  personal_info_access: boolean
  /** Can suspend / unsuspend users */
  user_management_access: boolean
  /** Can create / edit / publish / unpublish news */
  news_management_access: boolean
}

export type AccountStatus = 'active' | 'suspended'

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: '利用中',
  suspended: '停止中',
}

export type AdminUserRow = {
  id: number
  nickname: string | null
  registered_at: string
  email_verified: boolean
  training_years: number
  seller_requirements_met: boolean
  status: AccountStatus
  /** Only for operators with personal info access */
  email_address?: string
}

export type Suspension = {
  id: number
  /** Sent to the user in the notification email (null for suspensions made before this field existed) */
  user_reason: string | null
  /** Operators only — never emailed */
  internal_note: string | null
  starts_at: string
  ends_at: string | null
  suspended_by: string
  lifted_at: string | null
  lifted_by: string | null
  lift_reason: string | null
  in_effect: boolean
}

export type AdminUserDetail = AdminUserRow & {
  bio: string | null
  training_started_on: string
  seller_requirements: {
    age: { required: number; met: boolean }
    training_years: { required: number; met: boolean }
    identity_verification: { status: string }
  }
  programs: { total: number; published: number; draft: number }
  active_suspension: Suspension | null
  suspensions: Suspension[]
  personal_info_visible: boolean
  /** Whether the current operator may suspend / unsuspend */
  can_manage: boolean
  /** Only for operators with personal info access */
  birth_date?: string
  age?: number
}

export type AdminUserListResponse = {
  users: AdminUserRow[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export type NewsStatus = 'draft' | 'published'

export const NEWS_STATUS_LABELS: Record<NewsStatus, string> = {
  draft: '非公開',
  published: '公開中',
}

export type AdminNews = {
  id: number
  title: string
  category: import('../types/news').NewsCategory
  status: NewsStatus
  published_at: string | null
  /** Content edited after the first publish (shown to users as the update date) */
  content_updated_at: string | null
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  /** Whether the current operator has the news management permission */
  can_manage: boolean
  /** Only in detail responses */
  body?: string
}

export type AdminNewsListResponse = {
  articles: AdminNews[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export type AdminDashboard = {
  users: { total: number; suspended: number; new_last_7_days: number }
}
