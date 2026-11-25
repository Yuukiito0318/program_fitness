import { useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { Alert, Field, SelectField } from '../../components/Form'
import { PublicProgramCard } from '../../components/PublicProgramCard'
import { api, ApiError, type FieldErrors } from '../../lib/api'
import { CATEGORY_LABELS, DURATION_UNITS, type DurationUnit, type ProgramSearchResponse } from '../../types/program'

const FILTER_KEYS = ['q', 'category', 'duration_unit', 'duration_min', 'duration_max', 'price_min', 'price_max'] as const
type FilterKey = (typeof FILTER_KEYS)[number]
type Filters = Record<FilterKey, string>

const readFilters = (params: URLSearchParams): Filters =>
  Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ''])) as Filters

type Result =
  | { key: string; kind: 'ok'; data: ProgramSearchResponse }
  | { key: string; kind: 'error'; message: string; fieldErrors: FieldErrors }

// プログラムを探す（公開中のみ・新着順）。Search conditions live in the URL query string.
export function ProgramSearchPage() {
  const [params, setParams] = useSearchParams()
  const queryKey = params.toString()
  const [form, setForm] = useState<Filters>(() => readFilters(params))
  const [result, setResult] = useState<Result | null>(null)
  const loading = result?.key !== queryKey

  useEffect(() => {
    api
      .get<ProgramSearchResponse>(`/api/programs${queryKey ? `?${queryKey}` : ''}`)
      .then((data) => setResult({ key: queryKey, kind: 'ok', data }))
      .catch((e: unknown) =>
        setResult({
          key: queryKey,
          kind: 'error',
          message: e instanceof ApiError ? e.message : '検索に失敗しました。',
          fieldErrors: e instanceof ApiError ? e.fieldErrors : {},
        }),
      )
  }, [queryKey])

  const set = (key: FilterKey, value: string) => setForm({ ...form, [key]: value })

  const applyFilters = (filters: Filters, page = 1) => {
    const next = new URLSearchParams()
    for (const k of FILTER_KEYS) {
      const v = filters[k].trim()
      // Duration range only makes sense together with a unit.
      if (v && !((k === 'duration_min' || k === 'duration_max') && !filters.duration_unit)) next.set(k, v)
    }
    if (page > 1) next.set('page', String(page))
    setParams(next)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    applyFilters(form)
  }

  const handleClear = () => {
    const empty = readFilters(new URLSearchParams())
    setForm(empty)
    setParams(new URLSearchParams())
  }

  const goToPage = (page: number) => {
    applyFilters(readFilters(params), page)
    window.scrollTo({ top: 0 })
  }

  const fieldErrors = result?.kind === 'error' ? result.fieldErrors : {}
  const unit = form.duration_unit ? DURATION_UNITS[form.duration_unit as DurationUnit] : null

  return (
    <>
      <h1>プログラムを探す</h1>

      <form className="card form search-form" onSubmit={handleSubmit} noValidate>
        <Field
          label="キーワード"
          name="q"
          type="search"
          maxLength={100}
          placeholder="例：ベンチプレス 4分割"
          value={form.q}
          onChange={(e) => set('q', e.target.value)}
          errors={fieldErrors}
          hint="タイトル・内容・対象者・分割法・器具・種目名から探します（スペース区切りで絞り込み）"
        />
        <SelectField
          label="区分"
          name="category"
          value={form.category}
          onChange={(e) => set('category', e.target.value)}
          placeholder="すべて"
          options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
        />

        <fieldset className="fieldset">
          <legend>期間</legend>
          <SelectField
            label="単位"
            name="duration_unit"
            value={form.duration_unit}
            onChange={(e) => set('duration_unit', e.target.value)}
            placeholder="指定なし"
            options={Object.entries(DURATION_UNITS).map(([value, u]) => ({ value, label: u.label }))}
          />
          <div className="field-row">
            <Field
              label={`下限${unit ? `（${unit.label}）` : ''}`}
              name="duration_min"
              type="number"
              inputMode="numeric"
              min={unit?.min}
              max={unit?.max}
              disabled={!unit}
              value={form.duration_min}
              onChange={(e) => set('duration_min', e.target.value)}
              errors={fieldErrors}
            />
            <Field
              label={`上限${unit ? `（${unit.label}）` : ''}`}
              name="duration_max"
              type="number"
              inputMode="numeric"
              min={unit?.min}
              max={unit?.max}
              disabled={!unit}
              value={form.duration_max}
              onChange={(e) => set('duration_max', e.target.value)}
              errors={fieldErrors}
            />
          </div>
          <p className="hint">週と月は換算せず、選んだ単位で登録されたプログラムから探します。</p>
        </fieldset>

        <fieldset className="fieldset">
          <legend>価格帯（円）</legend>
          <div className="field-row">
            <Field
              label="下限"
              name="price_min"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.price_min}
              onChange={(e) => set('price_min', e.target.value)}
              errors={fieldErrors}
            />
            <Field
              label="上限"
              name="price_max"
              type="number"
              inputMode="numeric"
              min={0}
              value={form.price_max}
              onChange={(e) => set('price_max', e.target.value)}
              errors={fieldErrors}
            />
          </div>
        </fieldset>

        <div className="button-row">
          <button type="submit" className="button">
            検索する
          </button>
          <button type="button" className="button secondary" onClick={handleClear}>
            条件をクリア
          </button>
        </div>
      </form>

      {result?.kind === 'error' && <Alert kind="error">{result.message}</Alert>}

      <div className="result-head">
        <span>{loading ? '検索中…' : result?.kind === 'ok' ? `${result.data.total}件` : ''}</span>
        <span className="muted">新着順</span>
      </div>

      {!loading && result?.kind === 'ok' && result.data.programs.length === 0 && (
        <section className="card">
          <p>条件に合う公開中のプログラムはありません。</p>
        </section>
      )}

      {result?.kind === 'ok' && (
        <>
          <ul className={loading ? 'program-list is-loading' : 'program-list'}>
            {result.data.programs.map((p) => (
              <PublicProgramCard key={p.id} program={p} />
            ))}
          </ul>
          {result.data.total_pages > 1 && (
            <nav className="pagination" aria-label="ページ">
              <button
                type="button"
                className="button secondary small"
                disabled={result.data.page <= 1 || loading}
                onClick={() => goToPage(result.data.page - 1)}
              >
                ← 前へ
              </button>
              <span>
                {result.data.page} / {result.data.total_pages}
              </span>
              <button
                type="button"
                className="button secondary small"
                disabled={result.data.page >= result.data.total_pages || loading}
                onClick={() => goToPage(result.data.page + 1)}
              >
                次へ →
              </button>
            </nav>
          )}
        </>
      )}
    </>
  )
}
