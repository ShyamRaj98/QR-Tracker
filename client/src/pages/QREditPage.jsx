import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function QREditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState(null)

  const { data: qr, isLoading } = useQuery({
    queryKey: ['qr', id],
    queryFn: () => api.get(`/qr/${id}`).then(r => r.data),
  })

  useEffect(() => {
    if (qr) setForm({
      name: qr.name,
      destinationUrl: qr.destinationUrl,
      isActive: qr.isActive,
      tags: qr.tags?.join(', ') || '',
      style: qr.style || {},
    })
  }, [qr])

  const mutation = useMutation({
    mutationFn: payload => api.put(`/qr/${id}`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['qr'])
      toast.success('QR code updated — destination changed, no reprinting needed!')
      navigate('/qr')
    },
    onError: err => toast.error(err.response?.data?.error || 'Update failed'),
  })

  const handleSubmit = e => {
    e.preventDefault()
    mutation.mutate({ ...form, tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [] })
  }

  if (isLoading || !form) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/qr')} className="btn-secondary px-2.5 py-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Edit QR code</h1>
          <p className="text-sm text-gray-500">Change destination URL without reprinting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <form onSubmit={handleSubmit} className="card p-5 space-y-4">
            <div>
              <label className="label">Name</label>
              <input className="input" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Destination URL</label>
              <input className="input" type="url" value={form.destinationUrl}
                onChange={e => setForm(f => ({ ...f, destinationUrl: e.target.value }))} required />
              <p className="text-xs text-emerald-600 mt-1">✓ Changing this URL does not require reprinting your QR code</p>
            </div>
            <div>
              <label className="label">Tags</label>
              <input className="input" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="tag1, tag2" />
            </div>
            <div className="flex items-center gap-3 pt-1">
              <input type="checkbox" id="active" checked={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
                className="w-4 h-4 rounded text-sky-600" />
              <label htmlFor="active" className="text-sm text-gray-700">QR code is active</label>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => navigate('/qr')}>Cancel</button>
            </div>
          </form>
        </div>

        <div>
          <div className="card p-4 text-center">
            <p className="text-xs text-gray-500 mb-3">Current QR image</p>
            {qr?.qrImage && <img src={qr.qrImage} alt="QR" className="w-full rounded" />}
            <p className="text-xs text-gray-400 mt-2 font-mono break-all">{qr?.shortUrl}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
