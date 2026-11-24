import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, ApiError } from '../lib/api'
import type { CurrentUser, UserResponse } from '../types/user'

type AuthContextValue = {
  /** undefined = still checking, null = not logged in */
  user: CurrentUser | null | undefined
  setUser: (user: CurrentUser | null) => void
  refresh: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null | undefined>(undefined)

  const refresh = useCallback(async () => {
    try {
      const data = await api.get<UserResponse>('/api/session')
      setUser(data.user)
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setUser(null)
      else {
        setUser(null)
        throw error
      }
    }
  }, [])

  // Ask the backend who is logged in (the session cookie is HttpOnly, so JS cannot read it).
  // refresh() only updates state after the request completes.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    refresh().catch(() => {})
  }, [refresh])

  const login = useCallback(async (email: string, password: string) => {
    const data = await api.post<UserResponse>('/api/session', { email_address: email, password })
    setUser(data.user)
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.delete('/api/session')
    } finally {
      setUser(null)
    }
  }, [])

  const value = useMemo(() => ({ user, setUser, refresh, login, logout }), [user, refresh, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
