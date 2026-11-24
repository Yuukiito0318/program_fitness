import { useEffect, useState } from 'react'
import { api } from '../lib/api'

// Development connectivity check (frontend -> Rails -> PostgreSQL). Open /health.
type HealthResponse = {
  status: string
  database: 'ok' | 'error'
  rails_env: string
  time: string
}

type CheckState =
  | { kind: 'loading' }
  | { kind: 'ok'; data: HealthResponse }
  | { kind: 'error'; message: string }

export function HealthCheckPage() {
  const [state, setState] = useState<CheckState>({ kind: 'loading' })

  // Only calls setState after the request finishes.
  const fetchHealth = () => {
    api
      .get<HealthResponse>('/api/health')
      .then((data) => setState({ kind: 'ok', data }))
      .catch((error: unknown) =>
        setState({
          kind: 'error',
          message: error instanceof Error ? error.message : String(error),
        }),
      )
  }

  const runCheck = () => {
    setState({ kind: 'loading' })
    fetchHealth()
  }

  useEffect(fetchHealth, [])

  return (
    <>
      <h1>開発環境の接続確認</h1>

      <section className="card" aria-live="polite">
        <Row label="フロントエンド (Vite + React)" ok />
        <Row label="バックエンド (Rails API)" ok={state.kind === 'ok'} pending={state.kind === 'loading'} />
        <Row
          label="データベース (PostgreSQL)"
          ok={state.kind === 'ok' && state.data.database === 'ok'}
          pending={state.kind === 'loading'}
        />

        {state.kind === 'ok' && (
          <p className="meta">
            Rails env: {state.data.rails_env} / {state.data.time}
          </p>
        )}
        {state.kind === 'error' && (
          <p className="error">
            接続できませんでした: {state.message}
            <br />
            Rails サーバーと DB が起動しているか確認してください（README 参照）。
          </p>
        )}

        <button type="button" className="button" onClick={runCheck} disabled={state.kind === 'loading'}>
          再確認
        </button>
      </section>
    </>
  )
}

function Row({ label, ok, pending = false }: { label: string; ok: boolean; pending?: boolean }) {
  const text = pending ? '確認中…' : ok ? 'OK' : 'NG'
  const className = pending ? 'badge pending' : ok ? 'badge ok' : 'badge ng'
  return (
    <div className="row">
      <span>{label}</span>
      <span className={className}>{text}</span>
    </div>
  )
}
