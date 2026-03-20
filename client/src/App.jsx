import { Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'
import Layout from './components/dashboard/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import QRListPage from './pages/QRListPage'
import QRCreatePage from './pages/QRCreatePage'
import QREditPage from './pages/QREditPage'
import AnalyticsPage from './pages/AnalyticsPage'

const Guard = ({ children }) => {
  const token = useAuthStore(s => s.accessToken)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index element={<DashboardPage />} />
        <Route path="qr" element={<QRListPage />} />
        <Route path="qr/create" element={<QRCreatePage />} />
        <Route path="qr/:id/edit" element={<QREditPage />} />
        <Route path="qr/:id/analytics" element={<AnalyticsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
