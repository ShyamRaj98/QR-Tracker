import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, Copy, Download, CheckCircle, TrendingUp, Users, MapPin, Smartphone } from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
} from 'recharts'
import api from '../utils/api'
import toast from 'react-hot-toast'

const COLORS = ['#0ea5e9', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316']

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card p-4 flex items-start gap-3">
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
      <Icon size={17} />
    </div>
    <div>
      <p className="text-xl font-semibold text-gray-900 leading-tight">{value ?? '—'}</p>
      <p className="text-xs text-gray-500">{label}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
)

export default function AnalyticsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [days, setDays] = useState(30)
  const [copied, setCopied] = useState(false)

  const { data: qr } = useQuery({
    queryKey: ['qr', id],
    queryFn: () => api.get(`/qr/${id}`).then(r => r.data),
  })

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', id, days],
    queryFn: () => api.get(`/analytics/${id}?days=${days}`).then(r => r.data),
    enabled: !!id,
  })

  const copyLink = async () => {
    await navigator.clipboard.writeText(qr?.shortUrl || '')
    setCopied(true)
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadQR = () => {
    if (!qr?.qrImage) return
    const a = document.createElement('a')
    a.href = qr.qrImage
    a.download = `${qr.name?.replace(/\s+/g, '-')}.png`
    a.click()
  }

  const deviceData = analytics?.byDevice?.map(d => ({
    name: d._id || 'unknown',
    value: d.count,
  })) || []

  const countryData = analytics?.byCountry?.slice(0, 8) || []
  const osData = analytics?.byOS || []
  const timeData = analytics?.scansOverTime?.map(d => ({ date: d._id, scans: d.count })) || []

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/qr')} className="btn-secondary px-2.5 py-2">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{qr?.name || 'Analytics'}</h1>
            <a href={qr?.destinationUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-sky-600 hover:underline truncate block max-w-xs">
              {qr?.destinationUrl}
            </a>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {qr?.qrImage && (
            <img src={qr.qrImage} alt="QR" className="w-10 h-10 rounded border" />
          )}
          <button onClick={copyLink} className="btn-secondary text-xs">
            {copied ? <CheckCircle size={14} className="text-emerald-600" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>
          <button onClick={downloadQR} className="btn-secondary text-xs">
            <Download size={14} /> PNG
          </button>
          <Link to={`/qr/${id}/edit`} className="btn-secondary text-xs">
            <Pencil size={14} /> Edit
          </Link>
        </div>
      </div>

      {/* Period selector */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sm text-gray-500">Period:</span>
        {[7, 30, 90].map(d => (
          <button key={d}
            onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${days === d ? 'bg-sky-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {d}d
          </button>
        ))}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={TrendingUp} label="Total scans" value={analytics?.totals?.total?.toLocaleString()}
          color="bg-sky-50 text-sky-600" />
        <StatCard icon={Users} label="Unique scans" value={analytics?.totals?.unique?.toLocaleString()}
          sub={analytics?.totals?.total ? `${Math.round((analytics.totals.unique / analytics.totals.total) * 100)}% unique` : ''}
          color="bg-violet-50 text-violet-600" />
        <StatCard icon={MapPin} label="Countries" value={analytics?.byCountry?.length}
          color="bg-emerald-50 text-emerald-600" />
        <StatCard icon={Smartphone} label="Top device"
          value={deviceData[0]?.name || '—'}
          sub={deviceData[0] ? `${deviceData[0].value} scans` : ''}
          color="bg-amber-50 text-amber-600" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* Scans over time */}
          <div className="card p-5">
            <h2 className="text-sm font-medium text-gray-900 mb-4">Scans over time</h2>
            {timeData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-sm text-gray-400">No scan data yet</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={timeData}>
                  <defs>
                    <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false}
                    tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}
                    labelFormatter={v => `Date: ${v}`} />
                  <Area type="monotone" dataKey="scans" stroke="#0ea5e9" strokeWidth={2} fill="url(#grad)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Device breakdown */}
            <div className="card p-5">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Device type</h2>
              {deviceData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={deviceData} cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                      dataKey="value" nameKey="name" paddingAngle={3}>
                      {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* OS breakdown */}
            <div className="card p-5">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Operating system</h2>
              {osData.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">No data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={osData} layout="vertical" barSize={14}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis type="category" dataKey="_id" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={70} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {osData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top countries */}
            <div className="card p-5 md:col-span-2">
              <h2 className="text-sm font-medium text-gray-900 mb-4">Top countries</h2>
              {countryData.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">No location data yet — scans will appear here</div>
              ) : (
                <div className="space-y-2">
                  {countryData.map((c, i) => {
                    const total = analytics?.totals?.total || 1
                    const pct = Math.round((c.count / total) * 100)
                    return (
                      <div key={c._id} className="flex items-center gap-3">
                        <span className="text-sm text-gray-500 w-5 text-right">{i + 1}</span>
                        <span className="text-sm font-medium text-gray-800 w-28 truncate">{c._id || 'Unknown'}</span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div className="h-2 rounded-full bg-sky-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-sm text-gray-600 w-16 text-right">{c.count} <span className="text-gray-400 text-xs">({pct}%)</span></span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
