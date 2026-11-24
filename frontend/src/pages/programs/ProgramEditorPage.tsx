import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { Alert, Field, FieldMessages, SelectField, TextAreaField } from '../../components/Form'
import { api, ApiError, type FieldErrors } from '../../lib/api'
import {
  CATEGORY_LABELS,
  DURATION_UNITS,
  PRICE_MAX,
  PRICE_MIN,
  type DurationUnit,
  type ProgramDetail,
} from '../../types/program'

// Technical limits (same as the backend).
const MAX_DAYS = 14
const MAX_EXERCISES = 30

type ExerciseForm = { key: string; name: string; sets: string; reps: string; weight: string; rest: string; note: string }
type DayForm = { key: string; name: string; note: string; exercises: ExerciseForm[] }
type ProgramForm = {
  title: string
  description: string
  target_audience: string
  equipment: string
  category: string
  duration_value: string
  duration_unit: string
  split_method: string
  price: string
  days: DayForm[]
}

let keySeq = 0
const newKey = () => `k${++keySeq}`

const emptyExercise = (): ExerciseForm => ({ key: newKey(), name: '', sets: '', reps: '', weight: '', rest: '', note: '' })
const emptyDay = (n: number): DayForm => ({ key: newKey(), name: `Day${n}`, note: '', exercises: [emptyExercise()] })

const emptyForm = (): ProgramForm => ({
  title: '',
  description: '',
  target_audience: '',
  equipment: '',
  category: '',
  duration_value: '',
  duration_unit: 'week',
  split_method: '',
  price: '',
  days: [emptyDay(1)],
})

function toForm(p: ProgramDetail): ProgramForm {
  return {
    title: p.title,
    description: p.description ?? '',
    target_audience: p.target_audience ?? '',
    equipment: p.equipment ?? '',
    category: p.category ?? '',
    duration_value: p.duration_value?.toString() ?? '',
    duration_unit: p.duration_unit ?? 'week',
    split_method: p.split_method ?? '',
    price: p.price?.toString() ?? '',
    days: p.days.map((d) => ({
      key: newKey(),
      name: d.name,
      note: d.note ?? '',
      exercises: d.exercises.map((e) => ({
        key: newKey(),
        name: e.name,
        sets: e.sets?.toString() ?? '',
        reps: e.reps ?? '',
        weight: e.weight ?? '',
        rest: e.rest ?? '',
        note: e.note ?? '',
      })),
    })),
  }
}

const numberOrNull = (v: string) => (v.trim() === '' ? null : v.trim())

function toPayload(f: ProgramForm) {
  return {
    program: {
      title: f.title,
      description: f.description,
      target_audience: f.target_audience,
      equipment: f.equipment,
      category: f.category,
      // Send the unit only together with a value (an empty duration is allowed for drafts).
      duration_value: numberOrNull(f.duration_value),
      duration_unit: f.duration_value.trim() === '' ? '' : f.duration_unit,
      split_method: f.split_method,
      price: numberOrNull(f.price),
      days: f.days.map((d) => ({
        name: d.name,
        note: d.note,
        exercises: d.exercises.map((e) => ({
          name: e.name,
          sets: numberOrNull(e.sets),
          reps: e.reps,
          weight: e.weight,
          rest: e.rest,
          note: e.note,
        })),
      })),
    },
  }
}

function move<T>(list: T[], index: number, delta: number): T[] {
  const target = index + delta
  if (target < 0 || target >= list.length) return list
  const copy = [...list]
  ;[copy[index], copy[target]] = [copy[target], copy[index]]
  return copy
}

export function ProgramEditorPage() {
  const { id } = useParams()
  const isNew = id === undefined
  const navigate = useNavigate()
  const [form, setForm] = useState<ProgramForm | null>(isNew ? emptyForm() : null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isNew) return
    api
      .get<{ program: ProgramDetail }>(`/api/my/programs/${id}`)
      .then((data) => setForm(toForm(data.program)))
      .catch((e: unknown) => setMessage(e instanceof ApiError ? e.message : '読み込みに失敗しました。'))
  }, [id, isNew])

  if (!form) {
    return message ? <Alert kind="error">{message}</Alert> : <p className="muted">読み込み中…</p>
  }

  const set = <K extends keyof ProgramForm>(key: K, value: ProgramForm[K]) => setForm({ ...form, [key]: value })
  const setDays = (days: DayForm[]) => set('days', days)
  const updateDay = (i: number, patch: Partial<DayForm>) =>
    setDays(form.days.map((d, idx) => (idx === i ? { ...d, ...patch } : d)))
  const updateExercise = (i: number, j: number, patch: Partial<ExerciseForm>) =>
    updateDay(i, { exercises: form.days[i].exercises.map((e, idx) => (idx === j ? { ...e, ...patch } : e)) })

  const unit = DURATION_UNITS[(form.duration_unit as DurationUnit) || 'week']

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setErrors({})
    setMessage('')
    try {
      const payload = toPayload(form)
      const data = isNew
        ? await api.post<{ program: ProgramDetail }>('/api/my/programs', payload)
        : await api.patch<{ program: ProgramDetail }>(`/api/my/programs/${id}`, payload)
      navigate(`/my/programs/${data.program.id}`, { state: { flash: '下書きを保存しました。' } })
    } catch (error) {
      if (error instanceof ApiError) {
        setErrors(error.fieldErrors)
        setMessage(error.message)
      } else setMessage('保存に失敗しました。')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <h1>{isNew ? 'プログラム作成' : 'プログラム編集'}</h1>
      <form onSubmit={handleSubmit} noValidate>
        <Alert kind="error">{message}</Alert>
        <FieldMessages messages={errors.base ?? []} />

        <section className="card form">
          <h2>基本情報</h2>
          <Field
            label="タイトル（必須）"
            name="title"
            maxLength={100}
            value={form.title}
            onChange={(e) => set('title', e.target.value)}
            errors={errors}
            hint="下書きはタイトルだけで保存できます"
          />
          <SelectField
            label="区分"
            name="category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            errors={errors}
            placeholder="選択してください"
            options={Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label }))}
          />
          <div className="field-row">
            <Field
              label="期間"
              name="duration_value"
              type="number"
              inputMode="numeric"
              min={unit.min}
              max={unit.max}
              value={form.duration_value}
              onChange={(e) => set('duration_value', e.target.value)}
              errors={errors}
            />
            <SelectField
              label="単位"
              name="duration_unit"
              value={form.duration_unit}
              onChange={(e) => set('duration_unit', e.target.value)}
              errors={errors}
              options={Object.entries(DURATION_UNITS).map(([value, u]) => ({
                value,
                label: `${u.label}（${u.min}〜${u.max}）`,
              }))}
            />
          </div>
          <Field
            label="分割法"
            name="split_method"
            maxLength={100}
            placeholder="例：4分割（胸・背中・脚・肩腕）"
            value={form.split_method}
            onChange={(e) => set('split_method', e.target.value)}
            errors={errors}
          />
          <Field
            label="販売価格（円）"
            name="price"
            type="number"
            inputMode="numeric"
            min={PRICE_MIN}
            max={PRICE_MAX}
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            errors={errors}
            hint={`${PRICE_MIN.toLocaleString()}〜${PRICE_MAX.toLocaleString()}円。販売開始機能は準備中のため、現在は保存のみです`}
          />
        </section>

        <section className="card form">
          <h2>説明</h2>
          <TextAreaField
            label="プログラムの内容"
            name="description"
            rows={6}
            maxLength={5000}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            errors={errors}
            hint="狙い・進め方・週ごとの変化（重量の上げ方など）を書いてください"
          />
          <TextAreaField
            label="対象者"
            name="target_audience"
            rows={3}
            maxLength={1000}
            value={form.target_audience}
            onChange={(e) => set('target_audience', e.target.value)}
            errors={errors}
            placeholder="例：ベンチプレス80kg以上の中級者"
          />
          <TextAreaField
            label="必要な器具"
            name="equipment"
            rows={3}
            maxLength={1000}
            value={form.equipment}
            onChange={(e) => set('equipment', e.target.value)}
            errors={errors}
            placeholder="例：バーベル、パワーラック、ダンベル"
          />
        </section>

        <h2 className="section-heading">トレーニング日と種目</h2>
        {form.days.map((day, i) => (
          <section key={day.key} className="card form day-card">
            <div className="day-head">
              <strong>トレーニング日 {i + 1}</strong>
              <div className="icon-buttons">
                <button type="button" onClick={() => setDays(move(form.days, i, -1))} disabled={i === 0} aria-label="上へ">
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => setDays(move(form.days, i, 1))}
                  disabled={i === form.days.length - 1}
                  aria-label="下へ"
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => setDays(form.days.filter((_, idx) => idx !== i))}
                  aria-label="このトレーニング日を削除"
                >
                  削除
                </button>
              </div>
            </div>
            <FieldMessages messages={errors[`days.${i}.base`] ?? []} />
            <Field
              label="名前"
              name={`days.${i}.name`}
              maxLength={50}
              placeholder="例：Day1 胸・三頭"
              value={day.name}
              onChange={(e) => updateDay(i, { name: e.target.value })}
              errors={errors}
            />

            {day.exercises.map((ex, j) => (
              <div key={ex.key} className="exercise">
                <div className="day-head">
                  <span className="muted">種目 {j + 1}</span>
                  <div className="icon-buttons">
                    <button
                      type="button"
                      onClick={() => updateDay(i, { exercises: move(day.exercises, j, -1) })}
                      disabled={j === 0}
                      aria-label="上へ"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => updateDay(i, { exercises: move(day.exercises, j, 1) })}
                      disabled={j === day.exercises.length - 1}
                      aria-label="下へ"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => updateDay(i, { exercises: day.exercises.filter((_, idx) => idx !== j) })}
                      aria-label="この種目を削除"
                    >
                      削除
                    </button>
                  </div>
                </div>
                <Field
                  label="種目名"
                  name={`days.${i}.exercises.${j}.name`}
                  maxLength={100}
                  placeholder="例：ベンチプレス"
                  value={ex.name}
                  onChange={(e) => updateExercise(i, j, { name: e.target.value })}
                  errors={errors}
                />
                <div className="field-grid">
                  <Field
                    label="セット数"
                    name={`days.${i}.exercises.${j}.sets`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={20}
                    value={ex.sets}
                    onChange={(e) => updateExercise(i, j, { sets: e.target.value })}
                    errors={errors}
                  />
                  <Field
                    label="回数"
                    name={`days.${i}.exercises.${j}.reps`}
                    maxLength={20}
                    placeholder="例：8〜10"
                    value={ex.reps}
                    onChange={(e) => updateExercise(i, j, { reps: e.target.value })}
                    errors={errors}
                  />
                  <Field
                    label="重量"
                    name={`days.${i}.exercises.${j}.weight`}
                    maxLength={50}
                    placeholder="例：80kg / 1RMの75%"
                    value={ex.weight}
                    onChange={(e) => updateExercise(i, j, { weight: e.target.value })}
                    errors={errors}
                  />
                  <Field
                    label="休憩"
                    name={`days.${i}.exercises.${j}.rest`}
                    maxLength={20}
                    placeholder="例：3分"
                    value={ex.rest}
                    onChange={(e) => updateExercise(i, j, { rest: e.target.value })}
                    errors={errors}
                  />
                </div>
                <Field
                  label="メモ"
                  name={`days.${i}.exercises.${j}.note`}
                  maxLength={500}
                  value={ex.note}
                  onChange={(e) => updateExercise(i, j, { note: e.target.value })}
                  errors={errors}
                />
              </div>
            ))}

            <button
              type="button"
              className="button secondary small"
              onClick={() => updateDay(i, { exercises: [...day.exercises, emptyExercise()] })}
              disabled={day.exercises.length >= MAX_EXERCISES}
            >
              ＋ 種目を追加
            </button>
            <TextAreaField
              label="この日のメモ"
              name={`days.${i}.note`}
              rows={2}
              maxLength={1000}
              value={day.note}
              onChange={(e) => updateDay(i, { note: e.target.value })}
              errors={errors}
            />
          </section>
        ))}

        <button
          type="button"
          className="button secondary"
          onClick={() => setDays([...form.days, emptyDay(form.days.length + 1)])}
          disabled={form.days.length >= MAX_DAYS}
        >
          ＋ トレーニング日を追加（最大{MAX_DAYS}日）
        </button>

        <div className="sticky-actions">
          <button type="submit" className="button" disabled={saving}>
            {saving ? '保存中…' : '下書き保存してプレビュー'}
          </button>
          <Link className="form-footer" to={isNew ? '/my/programs' : `/my/programs/${id}`}>
            キャンセル
          </Link>
        </div>
      </form>
    </>
  )
}
