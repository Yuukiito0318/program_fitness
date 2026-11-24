import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { Alert } from '../../components/Form'
import { api, ApiError } from '../../lib/api'
import {
  CATEGORY_LABELS,
  formatDateTime,
  formatDuration,
  formatPrice,
  type ProgramSummary,
} from '../../types/program'

// 自分のプログラム一覧（現在は下書きのみ。販売中プログラムの公開一覧は販売機能と一緒に作る）
export function MyProgramsPage() {
  const location = useLocation()
  const flash = (location.state as { flash?: string } | null)?.flash
  const [programs, setPrograms] = useState<ProgramSummary[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .get<{ programs: ProgramSummary[] }>('/api/my/programs')
      .then((data) => setPrograms(data.programs))
      .catch((e: unknown) => setError(e instanceof ApiError ? e.message : '読み込みに失敗しました。'))
  }, [])

  return (
    <>
      <div className="page-title-row">
        <h1>マイプログラム</h1>
        <Link className="button small" to="/my/programs/new">
          ＋ 新規作成
        </Link>
      </div>
      <Alert kind="success">{flash}</Alert>
      <Alert kind="error">{error}</Alert>

      {programs === null && !error && <p className="muted">読み込み中…</p>}
      {programs?.length === 0 && (
        <section className="card">
          <p>まだプログラムがありません。</p>
          <Link className="button" to="/my/programs/new">
            プログラムを作成する
          </Link>
        </section>
      )}

      <ul className="program-list">
        {programs?.map((p) => (
          <li key={p.id} className="card program-card">
            <Link to={`/my/programs/${p.id}`} className="program-card-link">
              <div className="program-card-head">
                <span className="badge pending">下書き</span>
                <span className="program-card-title">{p.title}</span>
              </div>
              <div className="tags">
                {p.category && <span className="tag">{CATEGORY_LABELS[p.category]}</span>}
                {formatDuration(p.duration_value, p.duration_unit) && (
                  <span className="tag">{formatDuration(p.duration_value, p.duration_unit)}</span>
                )}
                {p.split_method && <span className="tag">{p.split_method}</span>}
              </div>
              <p className="meta">
                {p.days_count}日・{p.exercises_count}種目
                {formatPrice(p.price) && ` ・ ${formatPrice(p.price)}`} ・ 更新 {formatDateTime(p.updated_at)}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
