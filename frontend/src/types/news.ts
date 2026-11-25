// News types shared by the user screens (/api/news) and the admin screens (/api/admin/news).

export type NewsCategory = 'training' | 'competition'

// Spec names "筋トレニュース" and "大会情報" (same list as the backend).
export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  training: '筋トレニュース',
  competition: '大会情報',
}

/** Public news (published only). */
export type NewsSummary = {
  id: number
  title: string
  category: NewsCategory
  /** 掲載日 */
  published_at: string
  /** 更新日: only when the content was edited after publishing */
  updated_at: string | null
  excerpt: string
}

export type NewsDetail = Omit<NewsSummary, 'excerpt'> & { body: string }

export type NewsListResponse = {
  articles: NewsSummary[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export function formatNewsDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
