import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAdminAuth } from './AdminAuthContext'

/**
 * Shows admin screens only to logged-in operators.
 * Display control only — every /api/admin request is checked again by Rails.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { admin } = useAdminAuth()
  const location = useLocation()
  if (admin === undefined) return <p className="muted admin-page">読み込み中…</p>
  if (admin === null) return <Navigate to="/admin/login" replace state={{ from: location.pathname + location.search }} />
  return children
}
