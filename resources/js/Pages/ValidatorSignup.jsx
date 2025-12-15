// resources/js/Pages/ValidatorSignup.jsx
import React, { useState } from 'react'
import axios from 'axios'
import { Link, router } from '@inertiajs/react'

export default function ValidatorSignup() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signatureFile, setSignatureFile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function submit(e) {
    e.preventDefault()
    try {
      setError('')
      setSaving(true)
      if (!signatureFile) {
        setError('Signature image is required')
        return
      }
      const allowed = ['image/png','image/jpeg']
      if (!allowed.includes(signatureFile.type)) {
        setError('Signature must be PNG or JPG')
        return
      }
      if (signatureFile.size > 2 * 1024 * 1024) {
        setError('Signature must be at most 2MB')
        return
      }
      const fd = new FormData()
      fd.append('name', name)
      fd.append('username', username)
      fd.append('email', email)
      fd.append('password', password)
      fd.append('signature', signatureFile)
      await axios.post('/admin/api/validators', fd, { headers: { 'X-CSRF-TOKEN': csrf() } })
      router.visit('/admin/profile')
    } catch (err) {
      const data = err?.response?.data
      setError(data?.errors?.username?.[0] || data?.message || 'Failed to create account')
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
      <aside className="w-60 flex-shrink-0 bg-white text-gray-700 p-4 border-r border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">C</div>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <ul className="space-y-1">
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/beneficiaries" className="block">Beneficiaries</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/profile" className="block">Profile</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/about" className="block">About</Link></li>
          <li className="px-2 py-3 rounded hover:bg-red-50 text-red-700 mt-20"><button onClick={logoutAdmin} className="w-full text-left">Log out</button></li>
        </ul>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">
        {error && <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        <section className="mt-6 max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-emerald-800">Create Validator Account</h3>
              <Link href="/admin/profile" className="px-3 py-1.5 border rounded text-emerald-800 text-sm">Back</Link>
            </div>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" value={name} onChange={e=>setName(e.target.value)} required/>
              </div>
              <div>
                <div className="text-sm text-gray-500">Username</div>
                <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" value={username} onChange={e=>setUsername(e.target.value)} required/>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
              </div>
              <div>
                <div className="text-sm text-gray-500">Password</div>
                <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
              </div>
              <div>
                <div className="text-sm text-gray-500">Signature</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  onChange={e=>setSignatureFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit" disabled={saving}>Create Account</button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}
