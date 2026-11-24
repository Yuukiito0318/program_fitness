import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Alert, Field } from '../components/Form'
import { ApiError } from '../lib/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { from?: string; flash?: string } | null
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      await login(email, password)
      navigate(state?.from ?? '/profile', { replace: true })
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'ログインに失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>ログイン</h1>
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <Alert kind="success">{state?.flash}</Alert>
        <Alert kind="error">{message}</Alert>
        <Field
          label="メールアドレス"
          name="email_address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="パスワード"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? 'ログイン中…' : 'ログイン'}
        </button>
        <p className="form-footer">
          <Link to="/forgot-password">パスワードを忘れた方</Link>
          <span aria-hidden="true"> ・ </span>
          <Link to="/signup">新規登録</Link>
        </p>
      </form>
    </>
  )
}
