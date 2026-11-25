import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { Alert, Field } from '../../components/Form'
import { ApiError } from '../../lib/api'
import { useAdminAuth } from '../auth/AdminAuthContext'

// 運営スタッフ専用ログイン（運営者アカウントはサーバーのコマンドでのみ作成）
export function AdminLoginPage() {
  const { admin, login } = useAdminAuth()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (admin) return <Navigate to="/admin" replace />

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      await login(email, password)
      navigate(from?.startsWith('/admin') ? from : '/admin', { replace: true })
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'ログインに失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="admin admin-login">
      <h1>
        program fitness <span className="admin-tag">運営</span>
      </h1>
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <p className="muted">運営スタッフ専用のログイン画面です。</p>
        <Alert kind="error">{message}</Alert>
        <Field
          label="メールアドレス"
          name="email_address"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="パスワード"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'ログイン中…' : 'ログイン'}
        </button>
      </form>
    </div>
  )
}
