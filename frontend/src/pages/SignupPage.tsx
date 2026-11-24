import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Alert, Field } from '../components/Form'
import { api, ApiError, type FieldErrors } from '../lib/api'
import { monthToDate, thisMonthIso, todayIso } from '../lib/date'
import type { UserResponse } from '../types/user'

// Spec: メールアドレスとパスワードで新規登録し、登録時に生年月日とトレーニング歴を入力する。
export function SignupPage() {
  const { setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    email_address: '',
    password: '',
    password_confirmation: '',
    birth_date: '',
    training_started_on: '',
  })
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
      const data = await api.post<UserResponse>('/api/registration', {
        user: { ...form, training_started_on: monthToDate(form.training_started_on) },
      })
      setUser(data.user)
      navigate('/profile', { state: { flash: '登録しました。確認メールのリンクを開いてメールアドレスを確認してください。' } })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setMessage(error.message)
      } else setMessage('登録に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>新規登録</h1>
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <Alert kind="error">{message}</Alert>
        <Field
          label="メールアドレス"
          name="email_address"
          type="email"
          autoComplete="email"
          required
          value={form.email_address}
          onChange={update('email_address')}
          errors={errors}
        />
        <Field
          label="パスワード"
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
          label="パスワード（確認）"
          name="password_confirmation"
          type="password"
          autoComplete="new-password"
          required
          value={form.password_confirmation}
          onChange={update('password_confirmation')}
          errors={errors}
        />
        <Field
          label="生年月日"
          name="birth_date"
          type="date"
          autoComplete="bday"
          required
          max={todayIso()}
          value={form.birth_date}
          onChange={update('birth_date')}
          errors={errors}
          hint="年齢は生年月日から自動で計算します"
        />
        <Field
          label="トレーニング開始年月"
          name="training_started_on"
          type="month"
          required
          max={thisMonthIso()}
          value={form.training_started_on}
          onChange={update('training_started_on')}
          errors={errors}
          hint="トレーニング歴は開始年月から自動で計算します"
        />
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? '登録中…' : '登録する'}
        </button>
        <p className="form-footer">
          登録済みの方は <Link to="/login">ログイン</Link>
        </p>
      </form>
    </>
  )
}
