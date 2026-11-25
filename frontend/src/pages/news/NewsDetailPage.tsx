import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alert } from '../../components/Form'
import { NewsArticleView } from '../../components/NewsArticleView'
import { api, ApiError } from '../../lib/api'
import type { NewsDetail } from '../../types/news'

type Loaded = { id: string; article?: NewsDetail; error?: string }

// ニュース詳細（公開中のみ。非公開・存在しないニュースは API が 404 を返す）
export function NewsDetailPage() {
  const { id = '' } = useParams()
  const [loaded, setLoaded] = useState<Loaded | null>(null)

  useEffect(() => {
    api
      .get<{ article: NewsDetail }>(`/api/news/${id}`)
      .then((data) => setLoaded({ id, article: data.article }))
      .catch((e: unknown) => setLoaded({ id, error: e instanceof ApiError ? e.message : '読み込みに失敗しました。' }))
  }, [id])

  if (loaded?.id !== id) return <p className="muted">読み込み中…</p>
  if (!loaded.article) {
    return (
      <>
        <Alert kind="error">{loaded.error}</Alert>
        <Link to="/news">ニュース一覧へ</Link>
      </>
    )
  }

  const a = loaded.article
  return (
    <>
      <p className="meta">
        <Link to="/news">← ニュース一覧</Link>
      </p>
      <NewsArticleView
        title={a.title}
        category={a.category}
        publishedAt={a.published_at}
        updatedAt={a.updated_at}
        body={a.body}
      />
    </>
  )
}
