import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { QrCode, LayoutDashboard, LogOut, ScanLine, Users } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function Layout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const nav = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/qr', label: 'QR Codes', icon: QrCode },
    ...(user?.role === 'admin' ? [{ to: '/users', label: 'Team', icon: Users }] : []),
  ]

  const handleLogout = async () => {
    try { await api.post('/auth/logout') } catch {}
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
            <ScanLine size={16} className="text-white" />
          </div>
          <span className="font-semibold text-gray-900">QRTrack</span>
        </div>

        <nav className="flex-1 p-3 space-y-0.5">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink key={to} to={to} end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${isActive ? 'bg-sky-50 text-sky-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`
              }>
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-gray-200">
          <div className="px-3 py-2 mb-1">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <span className={`mt-1 badge ${user?.role === 'admin' ? 'badge-blue' : 'badge-gray'}`}>
              {user?.role}
            </span>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors">
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
