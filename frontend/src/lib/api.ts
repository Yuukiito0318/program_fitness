// Small helper for calling the Rails API.
//
// VITE_API_BASE_URL is empty in development: requests go to "/api/..." on the Vite
// dev server and are proxied to Rails (see vite.config.ts).
// Set it only when the frontend and backend are served from different origins.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    throw new ApiError(response.status, `GET ${path} failed with status ${response.status}`)
  }
  return (await response.json()) as T
}
