// Small helper for calling the Rails API.
//
// VITE_API_BASE_URL is empty in development: requests go to "/api/..." on the Vite
// dev server and are proxied to Rails (see vite.config.ts), so the login cookie is
// a same-origin cookie.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/** Validation errors per field, already formatted as full Japanese messages. */
export type FieldErrors = Record<string, string[]>

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    // Required by the backend for state-changing requests (CSRF protection).
    'X-Requested-With': 'XMLHttpRequest',
  }
  if (body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError(0, 'サーバーに接続できませんでした。通信環境を確認してください。')
  }

  if (response.status === 204) return undefined as T

  const data: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const payload = (data ?? {}) as { error?: string; errors?: FieldErrors }
    const message =
      payload.error ??
      (payload.errors ? '入力内容を確認してください。' : `エラーが発生しました（${response.status}）`)
    throw new ApiError(response.status, message, payload.errors ?? {})
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body ?? {}),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body ?? {}),
  delete: <T>(path: string) => request<T>('DELETE', path),
}

/** @deprecated use api.get */
export const apiGet = api.get
