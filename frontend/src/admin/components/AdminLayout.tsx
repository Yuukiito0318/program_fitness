import { Link, NavLink, Outlet, useNavigate } from 'react-router'
import { useAdminAuth } from '../auth/AdminAuthContext'

export function AdminLayout() {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout().catch(() => {})
    navigate('/admin/login')
  }

  return (
    <div className="admin">
      <header className="admin-header">
        <Link to="/admin" className="admin-brand">
          program fitness <span>運営</span>
        </Link>
        <nav className="admin-nav">
          <NavLink to="/admin" end>
            ダッシュボード
          </NavLink>
          <NavLink to="/admin/users">ユーザー管理</NavLink>
          <NavLink to="/admin/news">ニュース管理</NavLink>
        </nav>
        <div className="admin-account">
          <span>{admin?.name}</span>
          <button type="button" className="link-button" onClick={handleLogout}>
            ログアウト
          </button>
        </div>
      </header>
      <main className="admin-page">
        <Outlet />
      </main>
    </div>
  )
}
