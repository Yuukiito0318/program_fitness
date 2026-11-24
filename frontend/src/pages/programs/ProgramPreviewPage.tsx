import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import { Alert } from '../../components/Form'
import { api, ApiError } from '../../lib/api'
import {
  CATEGORY_LABELS,
  formatDateTime,
  formatDuration,
  formatPrice,
  type ProgramDetail,
  type ProgramExercise,
} from '../../types/program'

// プレビュー：購入前の詳細画面（仕様：内容、対象者、必要な器具、販売者情報、価格）に近い形で表示する。
// Owner only (the API returns 404 for other users' programs).
export function ProgramPreviewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const [program, setProgram] = useState<ProgramDetail | null>(null)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api
      .get<{ program: ProgramDetail }>(`/api/my/programs/${id}`)
      .then((data) => setProgram(data.program))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '読み込みに失敗しました。'))
  }, [id])

  const handleDelete = async () => {
    if (!program || !window.confirm(`「${program.title}」を削除しますか？この操作は取り消せません。`)) return
    setDeleting(true)
    try {
      await api.delete(`/api/my/programs/${program.id}`)
      navigate('/my/programs', { state: { flash: '下書きを削除しました。' } })
    } catch (e) {
      setError(e instanceof ApiError ? e.message : '削除に失敗しました。')
      setDeleting(false)
    }
  }

  if (error && !program) {
    return (
      <>
        <Alert kind="error">{error}</Alert>
        <Link to="/my/programs">マイプログラムへ戻る</Link>
      </>
    )
  }
  if (!program) return <p className="muted">読み込み中…</p>

  const duration = formatDuration(program.duration_value, program.duration_unit)
  const price = formatPrice(program.price)
  const r = program.creator.seller_requirements

  return (
    <>
      <p className="meta">
        <Link to="/my/programs">← マイプログラム</Link>
      </p>
      <Alert kind="success">{flash}</Alert>
      <Alert kind="error">{error}</Alert>
      <div className="alert alert-info">
        <p>
          <strong>プレビュー（下書き）</strong>：購入者に表示される内容のイメージです。この画面はあなただけが見られます。
          販売開始機能は準備中です。
        </p>
      </div>

      {program.missing_items.length > 0 && (
        <section className="card">
          <h2>販売に向けて未入力の項目</h2>
          <ul className="missing-list">
            {program.missing_items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      )}

      <article className="card">
        <div className="tags">
          <span className="badge pending">下書き</span>
          {program.category && <span className="tag">{CATEGORY_LABELS[program.category]}</span>}
          {duration && <span className="tag">{duration}</span>}
          {program.split_method && <span className="tag">{program.split_method}</span>}
        </div>
        <h1 className="program-title">{program.title}</h1>
        <p className="program-price">{price ?? <span className="muted">価格未設定</span>}</p>

        <Section title="プログラムの内容" text={program.description} />
        <Section title="対象者" text={program.target_audience} />
        <Section title="必要な器具" text={program.equipment} />
      </article>

      <h2 className="section-heading">トレーニング内容</h2>
      {program.days.length === 0 && <p className="muted">トレーニング日が登録されていません。</p>}
      {program.days.map((day, i) => (
        <section key={i} className="card">
          <h3 className="day-title">{day.name}</h3>
          {day.exercises.length === 0 ? (
            <p className="muted">種目が登録されていません。</p>
          ) : (
            <ol className="exercise-list">
              {day.exercises.map((ex, j) => (
                <li key={j}>
                  <div className="exercise-name">{ex.name}</div>
                  <div className="exercise-spec">{exerciseSpec(ex)}</div>
                  {ex.note && <div className="hint pre-wrap">{ex.note}</div>}
                </li>
              ))}
            </ol>
          )}
          {day.note && <p className="hint pre-wrap">{day.note}</p>}
        </section>
      ))}

      <section className="card">
        <h2>作成者</h2>
        <dl className="details">
          <dt>ニックネーム</dt>
          <dd>{program.creator.nickname ?? <span className="muted">未設定（プロフィールで設定できます）</span>}</dd>
          <dt>トレーニング歴</dt>
          <dd>{program.creator.training_years}年</dd>
          <dt>自己紹介</dt>
          <dd className="pre-wrap">{program.creator.bio || <span className="muted">未設定</span>}</dd>
        </dl>
        <h3 className="sub-heading">販売者条件の確認状態</h3>
        <div className="row">
          <span>{r.age.required}歳以上</span>
          <span className={r.age.met ? 'badge ok' : 'badge ng'}>{r.age.met ? '満たす' : '満たさない'}</span>
        </div>
        <div className="row">
          <span>トレーニング歴{r.training_years.required}年以上</span>
          <span className={r.training_years.met ? 'badge ok' : 'badge ng'}>
            {r.training_years.met ? '満たす' : '満たさない'}
          </span>
        </div>
        <div className="row">
          <span>本人確認</span>
          <span className="badge pending">未実施</span>
        </div>
        <p className="hint">
          販売には上記すべての条件が必要です。本人確認サービスは準備中です。
          <Link to="/profile/edit">プロフィールを編集</Link>
        </p>
      </section>

      <p className="meta">
        作成 {formatDateTime(program.created_at)} ・ 更新 {formatDateTime(program.updated_at)}
      </p>

      <div className="button-row">
        <Link className="button" to={`/my/programs/${program.id}/edit`}>
          編集する
        </Link>
        <button type="button" className="button danger-outline" onClick={handleDelete} disabled={deleting}>
          {deleting ? '削除中…' : '削除する'}
        </button>
      </div>
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

function exerciseSpec(ex: ProgramExercise): string {
  const parts: string[] = []
  if (ex.sets != null && ex.reps) parts.push(`${ex.sets}セット × ${ex.reps}回`)
  else if (ex.sets != null) parts.push(`${ex.sets}セット`)
  else if (ex.reps) parts.push(`${ex.reps}回`)
  if (ex.weight) parts.push(ex.weight)
  if (ex.rest) parts.push(`休憩 ${ex.rest}`)
  return parts.join(' ・ ') || '—'
}
