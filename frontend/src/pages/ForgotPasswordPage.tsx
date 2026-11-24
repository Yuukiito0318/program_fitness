import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Alert, Field } from '../components/Form'
import { api, ApiError } from '../lib/api'
import type { MessageResponse } from '../types/user'

// Spec: パスワードを忘れた場合は登録メールアドレスから再設定できる。
export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [result, setResult] = useState<{ kind: 'success' | 'error'; message: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setResult(null)
    try {
      const data = await api.post<MessageResponse>('/api/password_reset', { email_address: email })
      setResult({ kind: 'success', message: data.message })
    } catch (error) {
      setResult({ kind: 'error', message: error instanceof ApiError ? error.message : '送信に失敗しました。' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <h1>パスワード再設定</h1>
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <p>登録したメールアドレスを入力してください。再設定用のリンクをお送りします。</p>
        {result && <Alert kind={result.kind}>{result.message}</Alert>}
        <Field
          label="メールアドレス"
          name="email_address"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="button" disabled={submitting || !email}>
          {submitting ? '送信中…' : '再設定メールを送る'}
        </button>
        <p className="form-footer">
          <Link to="/login">ログインに戻る</Link>
        </p>
      </form>
    </>
  )
}
