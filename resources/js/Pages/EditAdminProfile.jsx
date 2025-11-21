// resources/js/Pages/EditAdminProfile.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, router } from '@inertiajs/react'

export default function EditAdminProfile() {
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  useEffect(() => {
    axios.get('/admin/api/profile').then(res => {
      setEmail(res.data?.profile?.email || '')
    }).catch(() => setError('Failed to load profile'))
  }, [])

  async function submit(e) {
    e.preventDefault()
    try {
      await axios.post('/admin/api/profile', { email, password: newPassword || undefined, current_password: newPassword ? currentPassword : undefined }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      router.visit('/admin/profile')
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-xl mx-auto bg-white rounded shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl text-green-800 font-semibold">Edit Profile</h2>
          <Link href="/admin/profile" className="px-3 py-2 border rounded text-green-800">Back</Link>
        </div>
        {error && <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Email</label>
            <input className="border rounded p-2 w-full" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Current Password</label>
              <input className="border rounded p-2 w-full" type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} placeholder="Required if changing password"/>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">New Password</label>
              <input className="border rounded p-2 w-full" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Leave blank to keep existing"/>
            </div>
          </div>
          <button className="px-4 py-2 bg-green-800 text-white rounded" type="submit">Save Changes</button>
        </form>
      </div>
    </div>
  )
}