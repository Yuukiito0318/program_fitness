import { useEffect, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router'
import { Alert, SelectField } from '../../components/Form'
import { api, ApiError } from '../../lib/api'
import { NEWS_CATEGORY_LABELS } from '../../types/news'
import { useAdminAuth } from '../auth/AdminAuthContext'
import { formatDateTime } from '../format'
import { NEWS_STATUS_LABELS, type AdminNewsListResponse } from '../types'

type Result = { key: string; data?: AdminNewsListResponse; error?: string }

// ニュース一覧（運営者専用・非公開も含む）
export function AdminNewsListPage() {
  const { admin } = useAdminAuth()
  const canManage = admin?.news_management_access ?? false
  const [params, setParams] = useSearchParams()
  const key = params.toString()
  const flash = (useLocation().state as { flash?: string } | null)?.flash
  const [result, setResult] = useState<Result | null>(null)
  const loading = result?.key !== key

  useEffect(() => {
    api
      .get<AdminNewsListResponse>(`/api/admin/news${key ? `?${key}` : ''}`)
      .then((data) => setResult({ key, data }))
      .catch((e: unknown) => setResult({ key, error: e instanceof ApiError ? e.message : '読み込みに失敗しました。' }))
  }, [key])

  const update = (name: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(name, value)
    else next.delete(name)
    if (name !== 'page') next.delete('page')
    setParams(next)
  }

  const data = result?.data
  return (
    <>
      <div className="page-title-row">
        <h1>ニュース管理</h1>
        {canManage && (
          <Link className="button small" to="/admin/news/new">
            ＋ 新規作成
          </Link>
        )}
      </div>
      <Alert kind="success">{flash}</Alert>
      {!canManage && (
        <p className="hint">ニュース管理の権限がないため、閲覧のみできます（作成・編集・公開・非公開はできません）。</p>
      )}

      <div className="card admin-filters news-admin-filters">
        <SelectField
          label="公開状態"
          name="status"
          value={params.get('status') ?? ''}
          onChange={(e) => update('status', e.target.value)}
          placeholder="すべて"
          options={Object.entries(NEWS_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <SelectField
          label="種類"
          name="category"
          value={params.get('category') ?? ''}
          onChange={(e) => update('category', e.target.value)}
          placeholder="すべて"
          options={Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        />
      </div>

      <Alert kind="error">{result?.error}</Alert>
      <div className="result-head">
        <span>{loading ? '読み込み中…' : data ? `${data.total}件` : ''}</span>
        <span className="muted">更新日時の新しい順</span>
      </div>

      {data && (
        <div className={loading ? 'table-wrap is-loading' : 'table-wrap'}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>状態</th>
                <th>タイトル</th>
                <th>種類</th>
                <th>公開日時</th>
                <th>最終更新</th>
              </tr>
            </thead>
            <tbody>
              {data.articles.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className={a.status === 'published' ? 'badge ok' : 'badge pending'}>
                      {NEWS_STATUS_LABELS[a.status]}
                    </span>
                  </td>
                  <td className="break">
                    <Link to={`/admin/news/${a.id}`}>{a.title}</Link>
                  </td>
                  <td>{NEWS_CATEGORY_LABELS[a.category]}</td>
                  <td>{a.published_at ? formatDateTime(a.published_at) : <span className="muted">—</span>}</td>
                  <td>
                    {formatDateTime(a.updated_at)}（{a.updated_by}）
                  </td>
                </tr>
              ))}
              {data.articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="muted">
                    ニュースはありません。
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
