import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { QrCode, ScanLine, TrendingUp, Plus, ArrowRight } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card p-5 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={22} />
    </div>
    <div>
      <p className="text-2xl font-semibold text-gray-900">{value ?? '—'}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  </div>
)

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)

  const { data: overview } = useQuery({
    queryKey: ['overview'],
    queryFn: () => api.get('/analytics/overview').then(r => r.data),
  })

  const { data: recentQR } = useQuery({
    queryKey: ['qr', 'recent'],
    queryFn: () => api.get('/qr?limit=5').then(r => r.data),
  })

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Welcome, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">Company QR code dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={QrCode} label="Total QR codes" value={overview?.qrCount} color="bg-sky-50 text-sky-600" />
        <StatCard icon={ScanLine} label="Total scans" value={overview?.totalScans?.toLocaleString()} color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={TrendingUp} label="Scans this month" value={overview?.recentScans?.toLocaleString()} color="bg-violet-50 text-violet-600" />
      </div>

      <div className="card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Recent QR codes</h2>
          <div className="flex items-center gap-2">
            <Link to="/qr/create" className="btn-primary text-xs px-3 py-1.5">
              <Plus size={13} /> New QR
            </Link>
            <Link to="/qr" className="btn-secondary text-xs px-3 py-1.5">
              View all <ArrowRight size={13} />
            </Link>
          </div>
        </div>

        {!recentQR?.data?.length ? (
          <div className="py-12 text-center">
            <QrCode size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-4">No QR codes yet</p>
            <Link to="/qr/create" className="btn-primary">
              <Plus size={16} /> Create your first QR code
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentQR.data.map(qr => (
              <div key={qr._id} className="flex items-center gap-4 px-5 py-3 hover:bg-gray-50 transition-colors">
                <img src={qr.qrImage} alt={qr.name} className="w-10 h-10 rounded border" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{qr.name}</p>
                  <p className="text-xs text-gray-400 truncate">{qr.destinationUrl}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-gray-900">{qr.totalScans}</p>
                  <p className="text-xs text-gray-400">scans</p>
                </div>
                <Link to={`/qr/${qr._id}/analytics`} className="btn-secondary text-xs px-2.5 py-1.5">
                  Analytics
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
