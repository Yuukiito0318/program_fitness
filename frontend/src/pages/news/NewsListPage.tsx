import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { Alert, SelectField } from '../../components/Form'
import { NewsList } from '../../components/NewsList'
import { api, ApiError } from '../../lib/api'
import { NEWS_CATEGORY_LABELS, type NewsListResponse } from '../../types/news'

type Result = { key: string; data?: NewsListResponse; error?: string }

// ニュース一覧（公開中のみ）。カテゴリー・掲載月で探せる（仕様：カテゴリー・掲載日で探せる）
export function NewsListPage() {
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  const [result, setResult] = useState<Result | null>(null)
  const loading = result?.key !== key

  useEffect(() => {
    api
      .get<NewsListResponse>(`/api/news${key ? `?${key}` : ''}`)
      .then((data) => setResult({ key, data }))
      .catch((e: unknown) => setResult({ key, error: e instanceof ApiError ? e.message : '読み込みに失敗しました。' }))
  }, [key])

  const update = (name: 'category' | 'month' | 'page', value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name !== 'page') next.delete('page')
    setParams(next)
  }

  const data = result?.data

  return (
    <>
      <h1>ニュース</h1>
      <div className="card news-filters">
        <SelectField
          label="種類"
          name="category"
          value={params.get('category') ?? ''}
          onChange={(e) => update('category', e.target.value)}
          placeholder="すべて"
          options={Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <div className="field">
          <label htmlFor="news-month">掲載月</label>
          <input
            id="news-month"
            type="month"
            value={params.get('month') ?? ''}
            onChange={(e) => update('month', e.target.value)}
          />
        </div>
      </div>

      <Alert kind="error">{result?.error}</Alert>
      {loading && <p className="muted">読み込み中…</p>}
      {data && data.articles.length === 0 && (
        <section className="card">
          <p>該当するニュースはありません。</p>
        </section>
      )}
      {data && data.articles.length > 0 && (
        <section className={loading ? 'card is-loading' : 'card'}>
          <NewsList articles={data.articles} />
        </section>
      )}
      {data && data.total_pages > 1 && (
        <nav className="pagination">
          <button type="button" className="button secondary small" disabled={data.page <= 1}
            onClick={() => update('page', String(data.page - 1))}>
            ← 前へ
          </button>
          <span>{data.page} / {data.total_pages}</span>
          <button type="button" className="button secondary small" disabled={data.page >= data.total_pages}
            onClick={() => update('page', String(data.page + 1))}>
            次へ →
          </button>
        </nav>
      )}
    </>
  )
}
