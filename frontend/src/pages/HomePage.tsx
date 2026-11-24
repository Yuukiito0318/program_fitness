import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'

// Placeholder home. News and recommended programs (spec section 2) are not implemented yet.
export function HomePage() {
  const { user } = useAuth()

  return (
    <>
      <h1>program fitness</h1>
      <p className="lead">中級者・上級者向けトレーニングプログラム</p>

      <section className="card">
        {user ? (
          <>
            <p>
              ようこそ、{user.nickname ?? 'ゲスト'} さん
            </p>
            <Link className="button" to="/profile">
              マイページへ
            </Link>
          </>
        ) : user === null ? (
          <>
            <p>はじめての方は新規登録してください。</p>
            <div className="button-row">
              <Link className="button" to="/signup">
                新規登録
              </Link>
              <Link className="button secondary" to="/login">
                ログイン
              </Link>
            </div>
          </>
        ) : (
          <p className="muted">読み込み中…</p>
        )}
      </section>

      <p className="meta">
        <Link to="/health">開発環境の接続確認</Link>
      </p>
    </>
  )
}
