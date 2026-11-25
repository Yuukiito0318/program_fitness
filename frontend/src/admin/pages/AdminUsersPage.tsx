import { useEffect, useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Alert, Field, SelectField } from '../../components/Form'
import { api, ApiError } from '../../lib/api'
import { useAdminAuth } from '../auth/AdminAuthContext'
import { ACCOUNT_STATUS_LABELS, type AdminUserListResponse } from '../types'
import { formatDate } from '../format'

const KEYS = ['q', 'status', 'registered_from', 'registered_to'] as const
type Filters = Record<(typeof KEYS)[number], string>
const readFilters = (p: URLSearchParams) => Object.fromEntries(KEYS.map((k) => [k, p.get(k) ?? ''])) as Filters

type Result = { key: string; data?: AdminUserListResponse; error?: string }

// ユーザー一覧・検索（運営者専用）
export function AdminUsersPage() {
  const { admin } = useAdminAuth()
  const [params, setParams] = useSearchParams()
  const queryKey = params.toString()
  const [form, setForm] = useState<Filters>(() => readFilters(params))
  const [result, setResult] = useState<Result | null>(null)
  const loading = result?.key !== queryKey

  useEffect(() => {
    api
      .get<AdminUserListResponse>(`/api/admin/users${queryKey ? `?${queryKey}` : ''}`)
      .then((data) => setResult({ key: queryKey, data }))
      .catch((e: unknown) => setResult({ key: queryKey, error: e instanceof ApiError ? e.message : '読み込みに失敗しました。' }))
  }, [queryKey])

  const apply = (filters: Filters, page = 1) => {
    const next = new URLSearchParams()
    for (const k of KEYS) if (filters[k].trim()) next.set(k, filters[k].trim())
    if (page > 1) next.set('page', String(page))
    setParams(next)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    apply(form)
  }

  const showEmail = admin?.personal_info_access ?? false
  const data = result?.data

  return (
    <>
      <h1>ユーザー管理</h1>

      <form className="card form admin-filters" onSubmit={handleSubmit} noValidate>
        <Field
          label={showEmail ? 'ニックネーム・メールアドレス' : 'ニックネーム'}
          name="q"
          type="search"
          maxLength={100}
          value={form.q}
          onChange={(e) => setForm({ ...form, q: e.target.value })}
        />
        <SelectField
          label="アカウント状態"
          name="status"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
          placeholder="すべて"
          options={Object.entries(ACCOUNT_STATUS_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <Field
          label="登録日（から）"
          name="registered_from"
          type="date"
          value={form.registered_from}
          onChange={(e) => setForm({ ...form, registered_from: e.target.value })}
        />
        <Field
          label="登録日（まで）"
          name="registered_to"
          type="date"
          value={form.registered_to}
          onChange={(e) => setForm({ ...form, registered_to: e.target.value })}
        />
        <div className="admin-filter-actions">
          <button type="submit" className="button">
            検索
          </button>
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              setForm(readFilters(new URLSearchParams()))
              setParams(new URLSearchParams())
            }}
          >
            クリア
          </button>
        </div>
      </form>

      <Alert kind="error">{result?.error}</Alert>
      <div className="result-head">
        <span>{loading ? '読み込み中…' : data ? `${data.total.toLocaleString()}件` : ''}</span>
        <span className="muted">登録日の新しい順</span>
      </div>

      {data && (
        <div className={loading ? 'table-wrap is-loading' : 'table-wrap'}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ニックネーム</th>
                {showEmail && <th>メールアドレス</th>}
                <th>登録日</th>
                <th>メール確認</th>
                <th>トレーニング歴</th>
                <th>販売者条件（自己申告）</th>
                <th>状態</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.id}>
                  <td>{u.id}</td>
                  <td>
                    <Link to={`/admin/users/${u.id}`}>{u.nickname ?? '（未設定）'}</Link>
                  </td>
                  {showEmail && <td className="break">{u.email_address}</td>}
                  <td>{formatDate(u.registered_at)}</td>
                  <td>{u.email_verified ? '確認済み' : '未確認'}</td>
                  <td>{u.training_years}年</td>
                  <td>{u.seller_requirements_met ? '満たす' : '満たさない'}</td>
                  <td>
                    <span className={u.status === 'suspended' ? 'badge ng' : 'badge ok'}>
                      {ACCOUNT_STATUS_LABELS[u.status]}
                    </span>
                  </td>
                </tr>
              ))}
              {data.users.length === 0 && (
                <tr>
                  <td colSpan={showEmail ? 8 : 7} className="muted">
                    該当するユーザーはいません。
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
            onClick={() => apply(readFilters(params), data.page - 1)}>
            ← 前へ
          </button>
          <span>{data.page} / {data.total_pages}</span>
          <button type="button" className="button secondary small" disabled={data.page >= data.total_pages}
            onClick={() => apply(readFilters(params), data.page + 1)}>
            次へ →
          </button>
        </nav>
      )}
    </>
  )
}
