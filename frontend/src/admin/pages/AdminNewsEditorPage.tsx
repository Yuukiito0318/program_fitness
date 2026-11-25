import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alert, Field, SelectField, TextAreaField } from '../../components/Form'
import { api, ApiError, type FieldErrors } from '../../lib/api'
import { NEWS_CATEGORY_LABELS } from '../../types/news'
import { useAdminAuth } from '../auth/AdminAuthContext'
import type { AdminNews } from '../types'

type Form = { title: string; body: string; category: string }
type Loaded = { id: string; form?: Form; status?: AdminNews['status']; error?: string }

// ニュースの新規作成・編集（運営者専用）。新規作成は「非公開」で保存し、詳細画面で公開する。
export function AdminNewsEditorPage() {
  const { admin } = useAdminAuth()
  const { id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()
  const [loaded, setLoaded] = useState<Loaded | null>(isNew ? { id: 'new', form: { title: '', body: '', category: '' } } : null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) return
    api
      .get<{ article: AdminNews }>(`/api/admin/news/${id}`)
      .then(({ article: a }) =>
        setLoaded({ id: id!, status: a.status, form: { title: a.title, body: a.body ?? '', category: a.category } }),
      )
      .catch((e: unknown) => setLoaded({ id: id!, error: e instanceof ApiError ? e.message : '読み込みに失敗しました。' }))
  }, [id, isNew])

  // Display control only: the API also rejects changes from operators without the permission (403).
  if (!admin?.news_management_access) {
    return (
      <>
        <Alert kind="error">ニュース管理の権限がないため、作成・編集はできません。</Alert>
        <Link to="/admin/news">ニュース一覧へ</Link>
      </>
    )
  }
  if (!loaded || (!isNew && loaded.id !== id)) return <p className="muted">読み込み中…</p>
  if (!loaded.form) return <Alert kind="error">{loaded.error}</Alert>

  const form = loaded.form
  const set = (key: keyof Form, value: string) => setLoaded({ ...loaded, form: { ...form, [key]: value } })

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setMessage('')
    try {
      const data = isNew
        ? await api.post<{ article: AdminNews }>('/api/admin/news', { article: form })
        : await api.patch<{ article: AdminNews }>(`/api/admin/news/${id}`, { article: form })
      navigate(`/admin/news/${data.article.id}`, {
        state: {
          flash: isNew
            ? '非公開で保存しました。内容を確認して「公開する」を押すとユーザー画面に表示されます。'
            : loaded.status === 'published'
              ? '保存しました。公開中のため、ユーザー画面にすぐ反映されます。'
              : '保存しました。',
        },
      })
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors(err.fieldErrors)
        setMessage(err.message)
      } else setMessage('保存できませんでした。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <p className="meta">
        <Link to={isNew ? '/admin/news' : `/admin/news/${id}`}>← 戻る</Link>
      </p>
      <h1>{isNew ? 'ニュース作成' : 'ニュース編集'}</h1>
      {loaded.status === 'published' && (
        <div className="alert alert-info">
          <p>このニュースは<strong>公開中</strong>です。保存した内容はユーザー画面にすぐ反映されます。</p>
        </div>
      )}
      <form className="card form" onSubmit={handleSubmit} noValidate>
        <Alert kind="error">{message}</Alert>
        <Field
          label="タイトル（必須）"
          name="title"
          maxLength={100}
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          errors={errors}
          hint={`${form.title.length} / 100文字`}
        />
        <SelectField
          label="ニュースの種類（必須）"
          name="category"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          errors={errors}
          placeholder="選択してください"
          options={Object.entries(NEWS_CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        />
        <TextAreaField
          label="本文（必須）"
          name="body"
          rows={14}
          maxLength={10000}
          value={form.body}
          onChange={(e) => set('body', e.target.value)}
          errors={errors}
          hint={`改行はそのまま表示されます（HTMLやMarkdownは使えません）。${form.body.length} / 10000文字`}
        />
        <button type="submit" className="button" disabled={saving}>
          {saving ? '保存中…' : isNew ? '非公開で保存' : '保存する'}
        </button>
      </form>
    </>
  )
}
