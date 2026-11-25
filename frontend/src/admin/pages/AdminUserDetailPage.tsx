import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router'
import { Alert, Field, TextAreaField } from '../../components/Form'
import { api, ApiError, type FieldErrors } from '../../lib/api'
import { formatDate, formatDateTime } from '../format'
import { ACCOUNT_STATUS_LABELS, type AdminUserDetail, type Suspension } from '../types'

type Loaded = { key: string; user?: AdminUserDetail; error?: string }

// ユーザー詳細・アカウント停止／停止解除（運営者専用）
// The detail view is recorded in the operator action log on the server.
export function AdminUserDetailPage() {
  const { id = '' } = useParams()
  const [version, setVersion] = useState(0)
  const key = `${id}:${version}`
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [flash, setFlash] = useState('')

  useEffect(() => {
    api
      .get<{ user: AdminUserDetail }>(`/api/admin/users/${id}`)
      .then((data) => setLoaded({ key, user: data.user }))
      .catch((e: unknown) => setLoaded({ key, error: e instanceof ApiError ? e.message : '読み込みに失敗しました。' }))
  }, [id, key])

  const reload = (message: string) => {
    setFlash(message)
    setVersion((v) => v + 1)
  }

  const user = loaded?.user
  if (!loaded || (!user && loaded.key !== key)) return <p className="muted">読み込み中…</p>
  if (!user) {
    return (
      <>
        <Alert kind="error">{loaded.error}</Alert>
        <Link to="/admin/users">ユーザー一覧へ</Link>
      </>
    )
  }

  const r = user.seller_requirements
  return (
    <>
      <p className="meta">
        <Link to="/admin/users">← ユーザー一覧</Link>
      </p>
      <div className="page-title-row">
        <h1>
          {user.nickname ?? '（ニックネーム未設定）'} <span className="muted">#{user.id}</span>
        </h1>
        <span className={user.status === 'suspended' ? 'badge ng' : 'badge ok'}>{ACCOUNT_STATUS_LABELS[user.status]}</span>
      </div>
      <Alert kind="success">{flash}</Alert>

      <div className="admin-columns">
        <section className="card">
          <h2>プロフィール</h2>
          <dl className="details">
            {user.personal_info_visible ? (
              <>
                <dt>メールアドレス</dt>
                <dd className="break">{user.email_address}</dd>
                <dt>生年月日</dt>
                <dd>
                  {user.birth_date}（{user.age}歳）
                </dd>
              </>
            ) : (
              <>
                <dt>個人情報</dt>
                <dd className="muted">閲覧権限がないため表示されません</dd>
              </>
            )}
            <dt>メール確認</dt>
            <dd>{user.email_verified ? '確認済み' : '未確認'}</dd>
            <dt>登録日</dt>
            <dd>{formatDateTime(user.registered_at)}</dd>
            <dt>トレーニング歴</dt>
            <dd>
              {user.training_started_on.replace('-', '年')}月から（{user.training_years}年）
            </dd>
            <dt>自己紹介</dt>
            <dd className="pre-wrap">{user.bio || <span className="muted">未設定</span>}</dd>
          </dl>
        </section>

        <section className="card">
          <h2>販売者条件・プログラム</h2>
          <dl className="details">
            <dt>{r.age.required}歳以上</dt>
            <dd>{r.age.met ? '満たす' : '満たさない'}</dd>
            <dt>歴{r.training_years.required}年以上</dt>
            <dd>{r.training_years.met ? '満たす' : '満たさない'}</dd>
            <dt>本人確認</dt>
            <dd>未実施（サービス未選定）</dd>
            <dt>プログラム</dt>
            <dd>
              {user.programs.total}件（公開中 {user.programs.published} / 下書き {user.programs.draft}）
            </dd>
          </dl>
          <p className="hint">購入・販売履歴、レビュー、通報状況は各機能の実装後に表示します。</p>
        </section>
      </div>

      {!user.can_manage ? (
        <section className="card">
          <h2>アカウント停止・解除</h2>
          {user.active_suspension && (
            <p>
              {formatDate(user.active_suspension.starts_at)} から停止中／期限：
              {user.active_suspension.ends_at ? formatDateTime(user.active_suspension.ends_at) : 'なし（解除まで）'}
            </p>
          )}
          <p className="muted">あなたにはユーザーの停止・解除を行う権限がありません。</p>
        </section>
      ) : user.active_suspension ? (
        <UnsuspendForm userId={user.id} suspension={user.active_suspension} onDone={reload} />
      ) : (
        <SuspendForm userId={user.id} onDone={reload} />
      )}

      <section className="card">
        <h2>停止履歴</h2>
        {user.suspensions.length === 0 ? (
          <p className="muted">停止履歴はありません。</p>
        ) : (
          <ul className="history">
            {user.suspensions.map((s) => (
              <li key={s.id}>
                <div>
                  <strong>停止</strong> {formatDateTime(s.starts_at)}（{s.suspended_by}）
                  {s.in_effect && <span className="badge ng">適用中</span>}
                </div>
                <div className="pre-wrap">
                  利用者向けの理由：{s.user_reason ?? <span className="muted">（記録なし：仕様変更前の停止）</span>}
                </div>
                {s.internal_note && <div className="pre-wrap muted">運営内部メモ：{s.internal_note}</div>}
                <div className="muted">期限：{s.ends_at ? formatDateTime(s.ends_at) : 'なし（解除まで）'}</div>
                {s.lifted_at && (
                  <div>
                    <strong>解除</strong> {formatDateTime(s.lifted_at)}（{s.lifted_by}）／理由：{s.lift_reason}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}

function SuspendForm({ userId, onDone }: { userId: number; onDone: (msg: string) => void }) {
  const [userReason, setUserReason] = useState('')
  const [internalNote, setInternalNote] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!window.confirm('このユーザーのアカウントを停止しますか？\nログイン中の端末はすべてログアウトされ、本人にメールで通知されます。')) return
    setBusy(true)
    setErrors({})
    setMessage('')
    try {
      const data = await api.post<{ message: string }>(`/api/admin/users/${userId}/suspension`, {
        user_reason: userReason,
        internal_note: internalNote,
        // datetime-local has no time zone: send it as an absolute time.
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      })
      onDone(data.message)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        setMessage(err.message)
      } else setMessage('停止できませんでした。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form danger-zone" onSubmit={handleSubmit} noValidate>
      <h2>アカウント停止</h2>
      <Alert kind="error">{message}</Alert>
      <TextAreaField
        label="利用者向けの停止理由（必須）"
        name="user_reason"
        rows={3}
        maxLength={1000}
        value={userReason}
        onChange={(e) => setUserReason(e.target.value)}
        errors={errors}
        hint="本人への通知メールにそのまま記載されます。本人が読んで分かる表現で書いてください。"
      />
      <TextAreaField
        label="運営内部メモ（任意）"
        name="internal_note"
        rows={2}
        maxLength={1000}
        value={internalNote}
        onChange={(e) => setInternalNote(e.target.value)}
        errors={errors}
        hint="運営画面にだけ表示され、通知メールには記載されません。"
      />
      <Field
        label="停止期限（任意）"
        name="ends_at"
        type="datetime-local"
        value={endsAt}
        onChange={(e) => setEndsAt(e.target.value)}
        errors={errors}
        hint="空欄の場合は、運営者が解除するまで停止が続きます。期限を過ぎると自動的に利用可能に戻ります。"
      />
      <button type="submit" className="button danger-solid" disabled={busy || !userReason.trim()}>
        {busy ? '処理中…' : 'アカウントを停止する'}
      </button>
    </form>
  )
}

function UnsuspendForm({ userId, suspension, onDone }: { userId: number; suspension: Suspension; onDone: (msg: string) => void }) {
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!window.confirm('このユーザーの停止を解除しますか？本人にメールで通知されます。')) return
    setBusy(true)
    setErrors({})
    setMessage('')
    try {
      const data = await api.delete<{ message: string }>(`/api/admin/users/${userId}/suspension`, { reason })
      onDone(data.message)
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        setMessage(err.message)
      } else setMessage('停止を解除できませんでした。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card form danger-zone" onSubmit={handleSubmit} noValidate>
      <h2>停止中</h2>
      <p>
        {formatDate(suspension.starts_at)} から停止中（{suspension.suspended_by}）／期限：
        {suspension.ends_at ? formatDateTime(suspension.ends_at) : 'なし'}
      </p>
      <p className="pre-wrap">
        利用者向けの理由：{suspension.user_reason ?? <span className="muted">（記録なし：仕様変更前の停止）</span>}
      </p>
      {suspension.internal_note && <p className="pre-wrap muted">運営内部メモ：{suspension.internal_note}</p>}
      <Alert kind="error">{message}</Alert>
      <TextAreaField
        label="解除理由（必須）"
        name="reason"
        rows={3}
        maxLength={1000}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        errors={errors}
      />
      <button type="submit" className="button" disabled={busy || !reason.trim()}>
        {busy ? '処理中…' : '停止を解除する'}
      </button>
    </form>
  )
}
