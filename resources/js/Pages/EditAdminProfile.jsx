// resources/js/Pages/EditAdminProfile.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link, router } from '@inertiajs/react'

export default function EditAdminProfile() {
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  useEffect(() => {
    axios.get('/admin/api/profile').then(res => {
      setEmail(res.data?.profile?.email || '')
    }).catch(() => setError('Failed to load profile'))
  }, [])

  async function submitEmail(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await axios.post('/admin/api/profile', { email }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      router.visit('/admin/profile')
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function submitPassword(e) {
    e.preventDefault()
    setError('')
    if (!currentPassword || !newPassword) {
      setError('Current and new password are required')
      return
    }
    setSaving(true)
    try {
      await axios.post('/admin/api/profile', { password: newPassword, current_password: currentPassword }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      router.visit('/admin/profile')
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 flex-shrink-0 bg-white text-gray-700 p-6 border-r border-gray-200">
        <div className="flex items-center gap-3 mb-8">
          <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200"/>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <ul className="space-y-1">
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/beneficiaries" className="block">Beneficiaries</Link></li>
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800"><Link href="/admin/profile" className="block">Profile</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/about" className="block">About</Link></li>
          <li className="px-2 py-3 rounded hover:bg-red-50 text-red-700 mt-20"><button onClick={logoutAdmin} className="w-full text-left">Log out</button></li>
        </ul>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">
        {error && <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

        <section className="mt-6 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-2 mb-6">
            <div className="flex gap-2">
              <button type="button" onClick={()=>setActiveTab('account')} className={`px-3 py-2 rounded-xl text-sm font-medium ${activeTab==='account' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Account Details</button>
              <button type="button" onClick={()=>setActiveTab('password')} className={`px-3 py-2 rounded-xl text-sm font-medium ${activeTab==='password' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}>Change Password</button>
            </div>
          </div>

          {activeTab === 'account' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-800">Account</h3>
                <Link href="/admin/profile" className="px-3 py-1.5 border rounded text-emerald-800 text-sm">Back</Link>
              </div>
              <form onSubmit={submitEmail} className="space-y-4">
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
                </div>
                <div className="flex justify-end">
                  <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit" disabled={saving}>Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'password' && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-800">Change Password</h3>
                <Link href="/admin/profile" className="px-3 py-1.5 border rounded text-emerald-800 text-sm">Back</Link>
              </div>
              <form onSubmit={submitPassword} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-500">Current Password</div>
                    <div className="relative">
                      <input
                        className="border border-gray-300 rounded-xl p-2.5 w-full pr-20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={e=>setCurrentPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(v => !v)}
                        className="absolute inset-y-0 right-4 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        {showCurrentPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">New Password</div>
                    <div className="relative">
                      <input
                        className="border border-gray-300 rounded-xl p-2.5 w-full pr-20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={e=>setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(v => !v)}
                        className="absolute inset-y-0 right-4 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        {showNewPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit" disabled={saving}>Update Password</button>
                </div>
              </form>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
