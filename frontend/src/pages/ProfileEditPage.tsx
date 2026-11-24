import { useState, type ChangeEvent, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Alert, Field, TextAreaField } from '../components/Form'
import { api, ApiError, type FieldErrors } from '../lib/api'
import { monthToDate, thisMonthIso, todayIso } from '../lib/date'
import type { UserResponse } from '../types/user'

// Spec: ニックネーム、自己紹介、生年月日、トレーニング歴を登録・編集する。
// (Profile image is not implemented yet: production file storage depends on the hosting choice.)
export function ProfileEditPage() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nickname: user?.nickname ?? '',
    bio: user?.bio ?? '',
    birth_date: user?.birth_date ?? '',
    training_started_on: user?.training_started_on ?? '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (key: keyof typeof form) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setErrors({})
    setMessage('')
    try {
      const data = await api.patch<UserResponse>('/api/profile', {
        user: { ...form, training_started_on: monthToDate(form.training_started_on) },
      })
      setUser(data.user)
      navigate('/profile', { state: { flash: 'プロフィールを更新しました。' } })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setMessage(error.message)
      } else setMessage('更新に失敗しました。')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>プロフィール編集</h1>
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <Alert kind="error">{message}</Alert>
        <Field
          label="ニックネーム"
          name="nickname"
          maxLength={30}
          autoComplete="nickname"
          value={form.nickname}
          onChange={update('nickname')}
          errors={errors}
          hint="30文字以内"
        />
        <TextAreaField
          label="自己紹介"
          name="bio"
          rows={5}
          maxLength={1000}
          value={form.bio}
          onChange={update('bio')}
          errors={errors}
          hint={`${form.bio.length} / 1000文字`}
        />
        <Field
          label="生年月日"
          name="birth_date"
          type="date"
          required
          max={todayIso()}
          value={form.birth_date}
          onChange={update('birth_date')}
          errors={errors}
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
        />
        <button type="submit" className="button" disabled={submitting}>
          {submitting ? '保存中…' : '保存する'}
        </button>
        <p className="form-footer">
          <Link to="/profile">キャンセル</Link>
        </p>
      </form>
    </>
  )
}
