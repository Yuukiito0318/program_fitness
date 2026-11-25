import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { Alert } from '../../components/Form'
import { NewsArticleView } from '../../components/NewsArticleView'
import { api, ApiError } from '../../lib/api'
import { formatDateTime } from '../format'
import { NEWS_STATUS_LABELS, type AdminNews } from '../types'

type Loaded = { key: string; article?: AdminNews; error?: string }

// ニュース詳細・公開前プレビュー・公開／非公開の切り替え（運営者専用）
export function AdminNewsDetailPage() {
  const { id = '' } = useParams()
  const location = useLocation()
  const [version, setVersion] = useState(0)
  const key = `${id}:${version}`
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [flash, setFlash] = useState((location.state as { flash?: string } | null)?.flash ?? '')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    api
      .get<{ article: AdminNews }>(`/api/admin/news/${id}`)
      .then((data) => setLoaded({ key, article: data.article }))
      .catch((e: unknown) => setLoaded({ key, error: e instanceof ApiError ? e.message : '読み込みに失敗しました。' }))
  }, [id, key])

  const a = loaded?.article
  if (!loaded || (!a && loaded.key !== key)) return <p className="muted">読み込み中…</p>
  if (!a) {
    return (
      <>
        <Alert kind="error">{loaded.error}</Alert>
        <Link to="/admin/news">ニュース一覧へ</Link>
      </>
    )
  }

  const published = a.status === 'published'

  const toggle = async () => {
    const question = published
      ? 'このニュースを非公開にしますか？ユーザー画面からすぐに表示されなくなります。'
      : 'このニュースを公開しますか？ユーザー画面のホームとニュース一覧に表示されます。'
    if (!window.confirm(question)) return
    setBusy(true)
    setError('')
    try {
      const data = published
        ? await api.delete<{ message: string }>(`/api/admin/news/${a.id}/publication`)
        : await api.post<{ message: string }>(`/api/admin/news/${a.id}/publication`)
      setFlash(data.message)
      setVersion((v) => v + 1)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '変更できませんでした。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <p className="meta">
        <Link to="/admin/news">← ニュース一覧</Link>
      </p>
      <Alert kind="success">{flash}</Alert>
      <Alert kind="error">{error}</Alert>

      <section className="card">
        <div className="page-title-row">
          <h2>
            公開状態：
            <span className={published ? 'badge ok' : 'badge pending'}>{NEWS_STATUS_LABELS[a.status]}</span>
          </h2>
          {a.can_manage && (
            <div className="admin-filter-actions">
              <Link className="button secondary" to={`/admin/news/${a.id}/edit`}>
                編集
              </Link>
              <button type="button" className={published ? 'button danger-solid' : 'button'} onClick={toggle} disabled={busy}>
                {busy ? '処理中…' : published ? '非公開にする' : '公開する'}
              </button>
            </div>
          )}
        </div>
        {!a.can_manage && <p className="hint">ニュース管理の権限がないため、閲覧のみできます。</p>}
        <dl className="details">
          <dt>公開日時</dt>
          <dd>
            {a.published_at ? formatDateTime(a.published_at) : <span className="muted">未公開</span>}
            {a.published_at && !published && <span className="muted">（現在は非公開）</span>}
          </dd>
          <dt>公開後の更新</dt>
          <dd>
            {a.content_updated_at ? (
              <>
                {formatDateTime(a.content_updated_at)}
                <span className="muted">（ユーザー画面に更新日として表示）</span>
              </>
            ) : (
              <span className="muted">なし</span>
            )}
          </dd>
          <dt>作成</dt>
          <dd>
            {formatDateTime(a.created_at)}（{a.created_by}）
          </dd>
          <dt>最終更新</dt>
          <dd>
            {formatDateTime(a.updated_at)}（{a.updated_by}）
          </dd>
        </dl>
      </section>

      <h2 className="section-heading">プレビュー（ユーザー画面での表示）</h2>
      {!published && <p className="hint">非公開のため、ユーザー画面には表示されていません。</p>}
      <div className="preview-frame">
        <NewsArticleView
          title={a.title}
          category={a.category}
          publishedAt={a.published_at}
          updatedAt={a.content_updated_at}
          body={a.body ?? ''}
        />
      </div>
    </>
  )
}
