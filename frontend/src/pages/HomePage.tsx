import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { NewsList } from '../components/NewsList'
import { api } from '../lib/api'
import type { NewsListResponse, NewsSummary } from '../types/news'

const HOME_NEWS_COUNT = 5

// Home: latest published news (spec: 運営作成の筋トレニュースを表示する).
// Recommended programs are not implemented (selection method is undecided in the spec).
export function HomePage() {
  const { user } = useAuth()
  const [news, setNews] = useState<NewsSummary[] | null>(null)
  const [newsError, setNewsError] = useState(false)

  useEffect(() => {
    api
      .get<NewsListResponse>(`/api/news?limit=${HOME_NEWS_COUNT}`)
      .then((data) => setNews(data.articles))
      .catch(() => setNewsError(true))
  }, [])

  return (
    <>
      <h1>program fitness</h1>
      <p className="lead">中級者・上級者向けトレーニングプログラム</p>

      <section className="card">
        <div className="section-title-row">
          <h2>ニュース</h2>
          <Link to="/news">すべて見る →</Link>
        </div>
        {newsError && <p className="muted">ニュースを読み込めませんでした。</p>}
        {!newsError && news === null && <p className="muted">読み込み中…</p>}
        {news?.length === 0 && <p className="muted">現在お知らせはありません。</p>}
        {news && news.length > 0 && <NewsList articles={news} showExcerpt={false} />}
      </section>

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
