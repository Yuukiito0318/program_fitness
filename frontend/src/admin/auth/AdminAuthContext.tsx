import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../../lib/api'
import type { AdminAccount } from '../types'

// Operator login state. Completely separate from the user login (different API and cookie).
type AdminAuthValue = {
  /** undefined = checking, null = not logged in as operator */
  admin: AdminAccount | null | undefined
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminAccount | null | undefined>(undefined)

  useEffect(() => {
    api
      .get<{ admin: AdminAccount }>('/api/admin/session')
      .then((data) => setAdmin(data.admin))
      .catch(() => setAdmin(null))
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<{ admin: AdminAccount }>('/api/admin/session', { email_address: email, password })
    setAdmin(data.admin)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.delete('/api/admin/session')
    } finally {
      setAdmin(null)
    }
  }, [])

  const value = useMemo(() => ({ admin, login, logout }), [admin, login, logout])
  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (!context) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>')
  return context
}
