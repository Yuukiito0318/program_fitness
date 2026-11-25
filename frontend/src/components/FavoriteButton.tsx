import { useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { api, ApiError } from '../lib/api'

type Props = {
  programId: number
  favorited: boolean
  onChange?: (favorited: boolean) => void
}

// お気に入りの追加・解除。未ログイン時はログイン画面へ誘導する。
// The backend only ever touches the logged-in user's own favorites.
export function FavoriteButton({ programId, favorited, onChange }: Props) {
  const { user } = useAuth()
  const location = useLocation()
  const [current, setCurrent] = useState(favorited)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  if (!user) {
    return (
      <Link
        className="favorite-button"
        to="/login"
        state={{ from: location.pathname + location.search }}
        aria-label="ログインしてお気に入りに追加"
      >
        ☆ お気に入り
      </Link>
    )
  }

  const toggle = async () => {
    setBusy(true)
    setError('')
    const next = !current
    try {
      if (next) await api.post('/api/my/favorites', { program_id: programId })
      else await api.delete(`/api/my/favorites/${programId}`)
      setCurrent(next)
      onChange?.(next)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '更新できませんでした。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <span className="favorite-wrap">
      <button
        type="button"
        className={current ? 'favorite-button on' : 'favorite-button'}
        onClick={toggle}
        disabled={busy}
        aria-pressed={current}
      >
        {current ? '★ お気に入り済み' : '☆ お気に入り'}
      </button>
      {error && <span className="error small-text">{error}</span>}
    </span>
  )
}
