import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

/**
 * Shows children only to logged-in users; others are sent to the login page.
 * This only controls what is displayed: the backend checks authentication on every request.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const location = useLocation()

  if (user === undefined) return <p className="muted">読み込み中…</p>
  if (user === null) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return children
}

/** Pages such as login/signup: logged-in users are sent to their profile. */
export function GuestOnly({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user === undefined) return <p className="muted">読み込み中…</p>
  if (user) return <Navigate to="/profile" replace />
  return children
}
