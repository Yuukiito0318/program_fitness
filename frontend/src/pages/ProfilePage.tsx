import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Form'
import { api, ApiError } from '../lib/api'
import type { CurrentUser, MessageResponse } from '../types/user'

export function ProfilePage() {
  const { user } = useAuth()
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  if (!user) return null

  return (
    <>
      <h1>マイページ</h1>
      <Alert kind="success">{flash}</Alert>
      {!user.email_verified && <EmailVerificationNotice />}

      <section className="card">
        <h2>プロフィール</h2>
        <dl className="details">
          <dt>ニックネーム</dt>
          <dd>{user.nickname ?? <span className="muted">未設定</span>}</dd>
          <dt>自己紹介</dt>
          <dd className="pre-wrap">{user.bio || <span className="muted">未設定</span>}</dd>
          <dt>生年月日</dt>
          <dd>
            {formatDate(user.birth_date)}（{user.age}歳）
          </dd>
          <dt>トレーニング歴</dt>
          <dd>
            {formatMonth(user.training_started_on)}から（{user.training_years}年）
          </dd>
        </dl>
        <Link className="button" to="/profile/edit">
          プロフィールを編集
        </Link>
      </section>

      <SellerRequirements user={user} />

      <section className="card">
        <h2>アカウント</h2>
        <dl className="details">
          <dt>メールアドレス</dt>
          <dd>
            {user.email_address}{' '}
            <span className={user.email_verified ? 'badge ok' : 'badge ng'}>
              {user.email_verified ? '確認済み' : '未確認'}
            </span>
          </dd>
        </dl>
        <Link className="button secondary" to="/profile/password">
          パスワードを変更
        </Link>
        <p className="hint">メールアドレスの変更は今後対応予定です。</p>
      </section>
    </>
  )
}

// Spec: プロフィールで販売条件の確認状態を表示する。
// Confirmed rule: 18歳以上かつトレーニング歴3年以上 + 本人確認. Display only (selling is not implemented).
function SellerRequirements({ user }: { user: CurrentUser }) {
  const r = user.seller_requirements
  return (
    <section className="card">
      <h2>販売条件の確認状態</h2>
      <div className="row">
        <span>{r.age.required}歳以上</span>
        <span className={r.age.met ? 'badge ok' : 'badge ng'}>{r.age.met ? '満たす' : '満たさない'}</span>
      </div>
      <div className="row">
        <span>トレーニング歴{r.training_years.required}年以上</span>
        <span className={r.training_years.met ? 'badge ok' : 'badge ng'}>
          {r.training_years.met ? '満たす' : '満たさない'}
        </span>
      </div>
      <div className="row">
        <span>本人確認</span>
        <span className="badge pending">未実施</span>
      </div>
      <p className="hint">
        プログラムの販売には本人確認が必要です。本人確認サービスは準備中のため、現在は販売を開始できません。
      </p>
    </section>
  )
}

function EmailVerificationNotice() {
  const [result, setResult] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [sending, setSending] = useState(false)

  const resend = async () => {
    setSending(true)
    try {
      const data = await api.post<MessageResponse>('/api/email_verification/resend')
      setResult({ kind: 'success', message: data.message })
    } catch (error) {
      setResult({ kind: 'error', message: error instanceof ApiError ? error.message : '送信に失敗しました。' })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="alert alert-info">
      <p>メールアドレスが未確認です。登録時に送信したメールのリンクを開いて確認してください。</p>
      {result && <p className={result.kind === 'error' ? 'error' : ''}>{result.message}</p>}
      <button type="button" className="button secondary small" onClick={resend} disabled={sending}>
        {sending ? '送信中…' : '確認メールを再送'}
      </button>
    </div>
  )
}

function formatDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return `${y}年${m}月${d}日`
}

function formatMonth(yyyymm: string) {
  const [y, m] = yyyymm.split('-').map(Number)
  return `${y}年${m}月`
}
