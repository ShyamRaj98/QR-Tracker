import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Plus, Search, Copy, Download, Pencil, Trash2, BarChart3, CheckCircle } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function QRListPage() {
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(null)
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['qr', search],
    queryFn: () => api.get(`/qr?search=${search}&limit=50`).then(r => r.data),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/qr/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['qr'])
      queryClient.invalidateQueries(['overview'])
      toast.success('QR code deleted')
    },
    onError: err => toast.error(err.response?.data?.error || 'Delete failed'),
  })

  const copyLink = async (shortUrl, id) => {
    await navigator.clipboard.writeText(shortUrl)
    setCopied(id)
    toast.success('Link copied!')
    setTimeout(() => setCopied(null), 2000)
  }

  const downloadQR = (qr) => {
    const link = document.createElement('a')
    link.href = qr.qrImage
    link.download = `${qr.name.replace(/\s+/g, '-')}.png`
    link.click()
  }

  const confirmDelete = (qr) => {
    if (window.confirm(`Delete "${qr.name}"? This cannot be undone.`)) {
      deleteMutation.mutate(qr._id)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">QR Codes</h1>
          <p className="text-sm text-gray-500 mt-0.5">{data?.total || 0} codes total</p>
        </div>
        <Link to="/qr/create" className="btn-primary">
          <Plus size={16} /> Create QR code
        </Link>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text" className="input pl-9" placeholder="Search QR codes…"
          value={search} onChange={e => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="card divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-14 h-14 bg-gray-100 rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-40" />
                <div className="h-3 bg-gray-100 rounded w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.data?.length ? (
        <div className="card py-16 text-center">
          <p className="text-gray-400 mb-4 text-sm">{search ? 'No results found' : 'No QR codes yet'}</p>
          {!search && <Link to="/qr/create" className="btn-primary"><Plus size={15} /> Create one now</Link>}
        </div>
      ) : (
        <div className="card divide-y">
          {data.data.map(qr => (
            <div key={qr._id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors group">
              {/* QR preview */}
              <img src={qr.qrImage} alt={qr.name} className="w-14 h-14 rounded border shrink-0" />

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-gray-900 truncate">{qr.name}</p>
                  <span className={qr.isActive ? 'badge-green' : 'badge-red'}>
                    {qr.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mb-1">{qr.destinationUrl}</p>
                <p className="text-xs text-gray-400 font-mono">{qr.shortUrl}</p>
              </div>

              {/* Scan count */}
              <div className="text-center shrink-0 hidden sm:block">
                <p className="text-lg font-semibold text-gray-900">{qr.totalScans}</p>
                <p className="text-xs text-gray-400">scans</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => copyLink(qr.shortUrl, qr._id)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copy link">
                  {copied === qr._id ? <CheckCircle size={16} className="text-emerald-600" /> : <Copy size={16} />}
                </button>
                <button onClick={() => downloadQR(qr)}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Download PNG">
                  <Download size={16} />
                </button>
                <Link to={`/qr/${qr._id}/analytics`}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Analytics">
                  <BarChart3 size={16} />
                </Link>
                <Link to={`/qr/${qr._id}/edit`}
                  className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Edit">
                  <Pencil size={16} />
                </Link>
                <button onClick={() => confirmDelete(qr)}
                  className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
