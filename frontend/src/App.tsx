import { Route, Routes } from 'react-router'
import { GuestOnly, RequireAuth } from './auth/RequireAuth'
import { Layout } from './components/Layout'
import { ChangePasswordPage } from './pages/ChangePasswordPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { HealthCheckPage } from './pages/HealthCheckPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { ProfileEditPage } from './pages/ProfileEditPage'
import { ProfilePage } from './pages/ProfilePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { SignupPage } from './pages/SignupPage'
import { VerifyEmailPage } from './pages/VerifyEmailPage'
import { MyProgramsPage } from './pages/programs/MyProgramsPage'
import { ProgramEditorPage } from './pages/programs/ProgramEditorPage'
import { ProgramPreviewPage } from './pages/programs/ProgramPreviewPage'
import './App.css'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="health" element={<HealthCheckPage />} />

        {/* Account (not logged in) */}
        <Route path="signup" element={<GuestOnly><SignupPage /></GuestOnly>} />
        <Route path="login" element={<GuestOnly><LoginPage /></GuestOnly>} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />

        {/* Account (logged in) */}
        <Route path="profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
        <Route path="profile/edit" element={<RequireAuth><ProfileEditPage /></RequireAuth>} />
        <Route path="profile/password" element={<RequireAuth><ChangePasswordPage /></RequireAuth>} />

        {/* Programs (logged in, own drafts) */}
        <Route path="my/programs" element={<RequireAuth><MyProgramsPage /></RequireAuth>} />
        <Route path="my/programs/new" element={<RequireAuth><ProgramEditorPage key="new" /></RequireAuth>} />
        <Route path="my/programs/:id"element={<RequireAuth><ProgramPreviewPage /></RequireAuth>} />
        <Route path="my/programs/:id/edit" element={<RequireAuth><ProgramEditorPage /></RequireAuth>} />

        <Route path="*" element={<p>ページが見つかりません。</p>} />
      </Route>
    </Routes>
  )
}

export default App
