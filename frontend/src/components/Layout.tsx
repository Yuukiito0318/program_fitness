import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'

export function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout().catch(() => {})
    navigate('/login')
  }

  return (
    <>
      <header className="site-header">
        <Link to="/" className="brand">
          program fitness
        </Link>
        <nav className="site-nav">
          {user ? (
            <>
              <NavLink to="/my/programs">マイプログラム</NavLink>
              <NavLink to="/profile">マイページ</NavLink>
              <button type="button" className="link-button" onClick={handleLogout}>
                ログアウト
              </button>
            </>
          ) : user === null ? (
            <>
              <NavLink to="/login">ログイン</NavLink>
              <NavLink to="/signup">新規登録</NavLink>
            </>
          ) : null}
        </nav>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </>
  )
}
