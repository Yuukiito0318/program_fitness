import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Form'
import { api, ApiError } from '../lib/api'
import type { MessageResponse } from '../types/user'

// Opened from the link in the verification email: /verify-email?token=...
export function VerifyEmailPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const { user, refresh } = useAuth()
  const [result, setResult] = useState<{ kind: 'success' | 'error'; message: string } | null>(
    token ? null : { kind: 'error', message: '確認リンクが正しくありません。' },
  )
  const sent = useRef(false)

  useEffect(() => {
    if (!token || sent.current) return
    sent.current = true // avoid sending twice in React StrictMode
    api
      .post<MessageResponse>('/api/email_verification', { token })
      .then((data) => {
        setResult({ kind: 'success', message: data.message })
        refresh().catch(() => {})
      })
      .catch((error: unknown) =>
        setResult({
          kind: 'error',
          message: error instanceof ApiError ? error.message : '確認に失敗しました。',
        }),
      )
  }, [token, refresh])

  return (
    <>
      <h1>メールアドレスの確認</h1>
      <section className="card">
        {result ? <Alert kind={result.kind}>{result.message}</Alert> : <p className="muted">確認中…</p>}
        {result?.kind === 'error' && user && (
          <p className="hint">マイページから確認メールを再送できます。</p>
        )}
        <Link className="button" to={user ? '/profile' : '/login'}>
          {user ? 'マイページへ' : 'ログインへ'}
        </Link>
      </section>
    </>
  )
}
