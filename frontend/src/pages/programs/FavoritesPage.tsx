import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Alert } from '../../components/Form'
import { PublicProgramCard } from '../../components/PublicProgramCard'
import { api, ApiError } from '../../lib/api'
import type { PublicProgramCard as Card } from '../../types/program'

// お気に入り一覧（ログインユーザー本人のもののみ。公開中のプログラムだけを表示）
export function FavoritesPage() {
  const [programs, setPrograms] = useState<Card[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<{ programs: Card[] }>('/api/my/favorites')
      .then((data) => setPrograms(data.programs))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '読み込みに失敗しました。'))
  }, [])

  // Remove a card from the list when it is unfavorited here.
  const handleChange = (id: number) => (favorited: boolean) => {
    if (!favorited) setPrograms((list) => list?.filter((p) => p.id !== id) ?? null)
  }

  return (
    <>
      <h1>お気に入り</h1>
      <Alert kind="error">{error}</Alert>
      {programs === null && !error && <p className="muted">読み込み中…</p>}
      {programs?.length === 0 && (
        <section className="card">
          <p>お気に入りはまだありません。</p>
          <Link className="button" to="/programs">
            プログラムを探す
          </Link>
        </section>
      )}
      <ul className="program-list">
        {programs?.map((p) => (
          <PublicProgramCard key={p.id} program={p} onFavoriteChange={handleChange(p.id)} />
        ))}
      </ul>
    </>
  )
}
