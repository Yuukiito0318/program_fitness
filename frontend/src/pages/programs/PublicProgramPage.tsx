import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { Alert } from '../../components/Form'
import { FavoriteButton } from '../../components/FavoriteButton'
import { api, ApiError } from '../../lib/api'
import {
  CATEGORY_LABELS,
  formatDateTime,
  formatDuration,
  formatPrice,
  type PublicProgramDetail,
} from '../../types/program'

type State = { id: string; program?: PublicProgramDetail; error?: string }

// 公開中プログラムの詳細（購入前）。仕様：内容、対象者、必要な器具、販売者情報、価格。
// Per-exercise details (sets/reps/weight) are not shown before purchase; purchase is not implemented.
export function PublicProgramPage() {
  const { id = '' } = useParams()
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    api
      .get<{ program: PublicProgramDetail }>(`/api/programs/${id}`)
      .then((data) => setState({ id, program: data.program }))
      .catch((e: unknown) => setState({ id, error: e instanceof ApiError ? e.message : '読み込みに失敗しました。' }))
  }, [id])

  if (state?.id !== id) return <p className="muted">読み込み中…</p>
  if (!state.program) {
    return (
      <>
        <Alert kind="error">{state.error}</Alert>
        <Link to="/programs">プログラムを探す</Link>
      </>
    )
  }

  const p = state.program
  const duration = formatDuration(p.duration_value, p.duration_unit)

  return (
    <>
      <p className="meta">
        <Link to="/programs">← プログラムを探す</Link>
      </p>

      <article className="card">
        <div className="tags">
          {p.category && <span className="tag">{CATEGORY_LABELS[p.category]}</span>}
          {duration && <span className="tag">{duration}</span>}
          {p.split_method && <span className="tag">{p.split_method}</span>}
        </div>
        <h1 className="program-title">{p.title}</h1>
        <p className="program-price">{formatPrice(p.price) ?? '価格未設定'}</p>
        <div className="program-card-actions">
          <FavoriteButton key={p.id} programId={p.id} favorited={p.favorited} />
        </div>
        <p className="hint">購入機能は準備中です。</p>

        <Section title="プログラムの内容" text={p.description} />
        <Section title="対象者" text={p.target_audience} />
        <Section title="必要な器具" text={p.equipment} />
        <section className="program-section">
          <h2>構成</h2>
          <p>
            {p.days_count}日・全{p.exercises_count}種目
          </p>
          <p className="hint">各種目のセット数・回数・重量は購入後に表示されます。</p>
        </section>
      </article>

      <section className="card">
        <h2>作成者</h2>
        <dl className="details">
          <dt>ニックネーム</dt>
          <dd>{p.creator.nickname ?? <span className="muted">名前未設定</span>}</dd>
          <dt>トレーニング歴</dt>
          <dd>{p.creator.training_years}年</dd>
          <dt>自己紹介</dt>
          <dd className="pre-wrap">{p.creator.bio || <span className="muted">未設定</span>}</dd>
        </dl>
      </section>

      {p.published_at && <p className="meta">公開 {formatDateTime(p.published_at)}</p>}
    </>
  )
}

function Section({ title, text }: { title: string; text: string | null }) {
  return (
    <section className="program-section">
      <h2>{title}</h2>
      {text ? <p className="pre-wrap">{text}</p> : <p className="muted">未入力</p>}
    </section>
  )
}
