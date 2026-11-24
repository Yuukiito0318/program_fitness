import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { Alert, Field } from '../components/Form'
import { api, ApiError, type FieldErrors } from '../lib/api'
import type { MessageResponse } from '../types/user'

// Spec: ログイン中のユーザーは現在のパスワード確認後に変更でき、変更を登録メールアドレスへ通知する。
export function ChangePasswordPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ current_password: '', password: '', password_confirmation: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')
    try {
      const data = await api.patch<MessageResponse>('/api/password', form)
      navigate('/profile', {
        state: { flash: `${data.message} 登録メールアドレスに通知を送信しました。ほかの端末はログアウトされます。` },
      })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setMessage(error.message)
      } else setMessage('変更に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>パスワード変更</h1>
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <Alert kind="error">{message}</Alert>
        <Field
          label="現在のパスワード"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
          value={form.current_password}
          onChange={update('current_password')}
          errors={errors}
        />
        <Field
          label="新しいパスワード"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={form.password}
          onChange={update('password')}
          errors={errors}
          hint="8文字以上"
        />
        <Field
          label="新しいパスワード（確認）"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
          value={form.password_confirmation}
          onChange={update('password_confirmation')}
          errors={errors}
        />
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? '変更中…' : '変更する'}
        </button>
        <p className="form-footer">
          <Link to="/profile">キャンセル</Link>
        </p>
      </form>
    </>
  )
}
