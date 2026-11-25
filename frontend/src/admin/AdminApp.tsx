import { Route, Routes } from 'react-router'
import { AdminAuthProvider } from './auth/AdminAuthContext'
import { RequireAdmin } from './auth/RequireAdmin'
import { AdminLayout } from './components/AdminLayout'
import { AdminDashboardPage } from './pages/AdminDashboardPage'
import { AdminLoginPage } from './pages/AdminLoginPage'
import { AdminNewsDetailPage } from './pages/AdminNewsDetailPage'
import { AdminNewsEditorPage } from './pages/AdminNewsEditorPage'
import { AdminNewsListPage } from './pages/AdminNewsListPage'
import { AdminUserDetailPage } from './pages/AdminUserDetailPage'
import { AdminUsersPage } from './pages/AdminUsersPage'
import './admin.css'

// Admin (operator) screens under /admin. Loaded lazily from App.tsx, so this code is
// downloaded only when someone opens /admin. Access control is enforced by Rails on every API call.
export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="login" element={<AdminLoginPage />} />
        <Route
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="users/:id" element={<AdminUserDetailPage />} />
          <Route path="news" element={<AdminNewsListPage />} />
          <Route path="news/new" element={<AdminNewsEditorPage key="new" />} />
          <Route path="news/:id" element={<AdminNewsDetailPage />} />
          <Route path="news/:id/edit" element={<AdminNewsEditorPage />} />
          <Route path="*" element={<p>ページが見つかりません。</p>} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  )
}
