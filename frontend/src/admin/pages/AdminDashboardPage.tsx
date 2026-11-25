import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '../../components/Form'
import { api, ApiError } from '../../lib/api'
import type { AdminDashboard } from '../types'

// ダッシュボード（今回はユーザー数のみ。取引・決済・対応待ちは未実装）
export function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<AdminDashboard>('/api/admin/dashboard')
      .then(setData)
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '読み込みに失敗しました。'))
  }, [])

  return (
    <>
      <h1>ダッシュボード</h1>
      <Alert kind="error">{error}</Alert>
      <div className="stat-grid">
        <Stat label="ユーザー総数" value={data?.users.total} to="/admin/users" />
        <Stat label="停止中ユーザー" value={data?.users.suspended} to="/admin/users?status=suspended" warn />
        <Stat label="新規登録（直近7日）" value={data?.users.new_last_7_days} />
      </div>
    </>
  )
}

function Stat({ label, value, to, warn }: { label: string; value?: number; to?: string; warn?: boolean }) {
  const body = (
    <>
      <span className="stat-label">{label}</span>
      <span className={warn && value ? 'stat-value warn' : 'stat-value'}>{value?.toLocaleString() ?? '—'}</span>
    </>
  )
  return to ? (
    <Link className="card stat" to={to}>
      {body}
    </Link>
  ) : (
    <div className="card stat">{body}</div>
  )
}
