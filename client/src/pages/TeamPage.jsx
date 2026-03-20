import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserPlus, Trash2, Shield, User } from 'lucide-react'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function TeamPage() {
  const currentUser = useAuthStore(s => s.user)
  const queryClient = useQueryClient()
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'staff' })
  const [adding, setAdding] = useState(false)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get('/auth/users').then(r => r.data),
  })

  const addMutation = useMutation({
    mutationFn: data => api.post('/auth/register', data),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      setForm({ name: '', email: '', password: '', role: 'staff' })
      setAdding(false)
      toast.success('Team member added')
    },
    onError: err => toast.error(err.response?.data?.error || 'Failed to add member'),
  })

  const deleteMutation = useMutation({
    mutationFn: id => api.delete(`/auth/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['users'])
      toast.success('Member removed')
    },
    onError: err => toast.error(err.response?.data?.error || 'Failed to remove'),
  })

  const handleAdd = e => {
    e.preventDefault()
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters')
    addMutation.mutate(form)
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Team</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} member{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setAdding(a => !a)} className="btn-primary">
          <UserPlus size={16} /> Add member
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="card p-5 mb-5">
          <h2 className="text-sm font-medium text-gray-900 mb-4">New team member</h2>
          <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Full name</label>
              <input className="input" placeholder="Name" required
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="email@company.com" required
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={addMutation.isPending}>
                {addMutation.isPending ? 'Adding…' : 'Add member'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      <div className="card divide-y divide-gray-100">
        {isLoading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-32" />
                <div className="h-3 bg-gray-100 rounded w-48" />
              </div>
            </div>
          ))
        ) : users.map(u => (
          <div key={u._id} className="flex items-center gap-4 px-5 py-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0
              ${u.role === 'admin' ? 'bg-sky-100 text-sky-700' : 'bg-gray-100 text-gray-600'}`}>
              {u.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-900">{u.name}</p>
                {u._id === currentUser?._id && <span className="badge-gray">You</span>}
              </div>
              <p className="text-xs text-gray-500">{u.email}</p>
            </div>
            <span className={`badge ${u.role === 'admin' ? 'badge-blue' : 'badge-gray'} shrink-0`}>
              {u.role === 'admin' ? <><Shield size={10} /> Admin</> : <><User size={10} /> Staff</>}
            </span>
            {u._id !== currentUser?._id && (
              <button onClick={() => { if (window.confirm(`Remove ${u.name}?`)) deleteMutation.mutate(u._id) }}
                className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
