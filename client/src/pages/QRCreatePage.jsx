import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const DEFAULT_STYLE = { foregroundColor: '#000000', backgroundColor: '#ffffff', errorCorrectionLevel: 'M', margin: 4 }

export default function QRCreatePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: '', destinationUrl: '', tags: '',
    style: { ...DEFAULT_STYLE },
    smartRedirects: [],
  })
  const [preview, setPreview] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Live preview debounce
  useEffect(() => {
    if (!form.destinationUrl) return setPreview(null)
    const t = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const { data } = await api.post('/qr/preview', {
          destinationUrl: form.destinationUrl,
          style: form.style,
        })
        setPreview(data.qrImage)
      } catch {}
      setPreviewLoading(false)
    }, 600)
    return () => clearTimeout(t)
  }, [form.destinationUrl, form.style])

  const mutation = useMutation({
    mutationFn: payload => api.post('/qr', payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['qr'])
      queryClient.invalidateQueries(['overview'])
      toast.success('QR code created!')
      navigate(`/qr/${res.data._id}/analytics`)
    },
    onError: err => toast.error(err.response?.data?.error || 'Failed to create QR code'),
  })

  const addRedirect = () => {
    setForm(f => ({
      ...f,
      smartRedirects: [...f.smartRedirects, { condition: 'device', value: 'Android', redirectUrl: '' }],
    }))
  }

  const updateRedirect = (i, field, val) => {
    setForm(f => {
      const sr = [...f.smartRedirects]
      sr[i] = { ...sr[i], [field]: val }
      return { ...f, smartRedirects: sr }
    })
  }

  const removeRedirect = i => {
    setForm(f => ({ ...f, smartRedirects: f.smartRedirects.filter((_, idx) => idx !== i) }))
  }

  const handleSubmit = e => {
    e.preventDefault()
    if (!form.name.trim() || !form.destinationUrl.trim()) return toast.error('Name and URL required')
    mutation.mutate({
      ...form,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    })
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/qr')} className="btn-secondary px-2.5 py-2">
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Create QR code</h1>
          <p className="text-sm text-gray-500">Dynamic — edit the destination URL anytime without reprinting</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-5 space-y-4">
            <h2 className="font-medium text-gray-900 text-sm">Basic info</h2>
            <div>
              <label className="label">Name <span className="text-red-500">*</span></label>
              <input className="input" placeholder="e.g. Product Launch Campaign"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label className="label">Destination URL <span className="text-red-500">*</span></label>
              <input className="input" type="url" placeholder="https://example.com/your-page"
                value={form.destinationUrl} onChange={e => setForm(f => ({ ...f, destinationUrl: e.target.value }))} required />
              <p className="text-xs text-gray-400 mt-1">You can change this URL anytime — no reprinting needed</p>
            </div>
            <div>
              <label className="label">Tags <span className="text-gray-400 font-normal">(optional, comma separated)</span></label>
              <input className="input" placeholder="marketing, print, campaign-2025"
                value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} />
            </div>
          </div>

          {/* Style */}
          <div className="card p-5 space-y-4">
            <h2 className="font-medium text-gray-900 text-sm">Appearance</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Foreground color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" className="w-10 h-9 rounded border cursor-pointer"
                    value={form.style.foregroundColor}
                    onChange={e => setForm(f => ({ ...f, style: { ...f.style, foregroundColor: e.target.value } }))} />
                  <span className="text-sm text-gray-500 font-mono">{form.style.foregroundColor}</span>
                </div>
              </div>
              <div>
                <label className="label">Background color</label>
                <div className="flex gap-2 items-center">
                  <input type="color" className="w-10 h-9 rounded border cursor-pointer"
                    value={form.style.backgroundColor}
                    onChange={e => setForm(f => ({ ...f, style: { ...f.style, backgroundColor: e.target.value } }))} />
                  <span className="text-sm text-gray-500 font-mono">{form.style.backgroundColor}</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Error correction</label>
                <select className="input"
                  value={form.style.errorCorrectionLevel}
                  onChange={e => setForm(f => ({ ...f, style: { ...f.style, errorCorrectionLevel: e.target.value } }))}>
                  <option value="L">L — Low (7%)</option>
                  <option value="M">M — Medium (15%)</option>
                  <option value="Q">Q — High (25%)</option>
                  <option value="H">H — Highest (30%)</option>
                </select>
              </div>
              <div>
                <label className="label">Quiet margin: {form.style.margin}</label>
                <input type="range" min={1} max={10} className="w-full mt-2"
                  value={form.style.margin}
                  onChange={e => setForm(f => ({ ...f, style: { ...f.style, margin: Number(e.target.value) } }))} />
              </div>
            </div>
          </div>

          {/* Smart redirects */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-medium text-gray-900 text-sm">Smart redirects</h2>
                <p className="text-xs text-gray-400 mt-0.5">Send different devices/OS to different URLs</p>
              </div>
              <button type="button" className="btn-secondary text-xs px-3 py-1.5" onClick={addRedirect}>
                <Plus size={13} /> Add rule
              </button>
            </div>
            {form.smartRedirects.map((r, i) => (
              <div key={i} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <select className="input flex-none w-28 text-xs"
                  value={r.value}
                  onChange={e => updateRedirect(i, 'value', e.target.value)}>
                  <option>Android</option>
                  <option>iOS</option>
                  <option>Windows</option>
                  <option>Mac OS</option>
                </select>
                <span className="text-xs text-gray-400 shrink-0">→</span>
                <input className="input text-xs flex-1" type="url" placeholder="https://redirect-to.com"
                  value={r.redirectUrl} onChange={e => updateRedirect(i, 'redirectUrl', e.target.value)} />
                <button type="button" onClick={() => removeRedirect(i)}
                  className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!form.smartRedirects.length && (
              <p className="text-xs text-gray-400 text-center py-2">No rules — all devices go to the same URL</p>
            )}
          </div>
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <div className="card p-5 text-center sticky top-6">
            <p className="text-sm font-medium text-gray-700 mb-4">Live preview</p>
            <div className="w-48 h-48 mx-auto bg-gray-50 rounded-xl border flex items-center justify-center">
              {previewLoading ? (
                <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
              ) : preview ? (
                <img src={preview} alt="QR preview" className="w-44 h-44 object-contain" />
              ) : (
                <p className="text-xs text-gray-400">Enter a URL to see preview</p>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-3">400×400px · PNG &amp; SVG available</p>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={mutation.isPending || !form.name || !form.destinationUrl}
              className="btn-primary w-full justify-center mt-4">
              {mutation.isPending ? 'Creating…' : 'Create QR code'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
