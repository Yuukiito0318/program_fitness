import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Alert, Field } from '../components/Form'
import { api, ApiError, type FieldErrors } from '../lib/api'
import type { MessageResponse } from '../types/user'

// Opened from the link in the password reset email: /reset-password?token=...
export function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const { setUser } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState(token ? '' : '再設定リンクが正しくありません。')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')
    try {
      const data = await api.patch<MessageResponse>('/api/password_reset', {
        token,
        password,
        password_confirmation: confirmation,
      })
      // The backend logged out every session, including this browser's.
      setUser(null)
      navigate('/login', { replace: true, state: { flash: data.message } })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setMessage(error.message)
      } else setMessage('再設定に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>新しいパスワードの設定</h1>
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <Alert kind="error">{message}</Alert>
        <Field
          label="新しいパスワード"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          errors={errors}
          hint="8文字以上"
        />
        <Field
          label="新しいパスワード（確認）"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
          value={confirmation}
          onChange={(e) => setConfirmation(e.target.value)}
          errors={errors}
        />
        <button type="submit" className="button" disabled={submitting || !token}>
          {submitting ? '設定中…' : 'パスワードを設定する'}
        </button>
        <p className="form-footer">
          <Link to="/forgot-password">再設定メールを送り直す</Link>
        </p>
      </form>
    </>
  )
}
