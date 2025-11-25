import React, { useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

export default function AdminProjectAdd() {
  const [form, setForm] = useState({
    project_name: '',
    land_area: '',
    total_blocks: '',
    total_lots: '',
    barangay: '',
    year_started: '',
    description: '',
    proj_image: null,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  function updateField(k, v) { setForm(prev => ({ ...prev, [k]: v })) }

  async function submit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v !== null && v !== undefined) fd.append(k, v) })
      const res = await axios.post('/admin/api/project-sites', fd, { headers: { 'X-CSRF-TOKEN': csrf() } })
      if (res.data?.ok) {
        window.location.href = '/admin/project-sites'
      } else {
        setError('Failed to save project')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.errors ? JSON.stringify(err.response.data.errors) : err.message
      setError(msg)
    } finally {
      setSaving(false)
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
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/beneficiaries" className="block">Beneficiaries</Link></li>
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800 cursor-pointer"><Link href="/admin/project-sites" className="block">Project Sites</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/assignments" className="block">Assignments</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/profile" className="block">Profile</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/about" className="block">About</Link></li>
          <li className="px-2 py-3 rounded hover:bg-red-50 text-red-700 cursor-pointer mt-20"><button onClick={logoutAdmin} className="w-full text-left">Log out</button></li>
        </ul>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">
        {error && <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
          <div>
            <div className="text-sm text-gray-500">Hello Admin!</div>
            <h2 className="text-2xl text-emerald-800 font-semibold">Add Project</h2>
            <div className="text-xs text-gray-500">Create a new project site</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/project-sites" className="px-3 py-2 border rounded-xl text-emerald-800">Back to list</Link>
          </div>
        </header>

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 max-w-3xl">
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700">Project Name</label>
              <input className="mt-1 w-full border rounded p-2" value={form.project_name} onChange={e=>updateField('project_name', e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Land Area (sqm)</label>
                <input type="number" step="0.01" className="mt-1 w-full border rounded p-2" value={form.land_area} onChange={e=>updateField('land_area', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Total Blocks</label>
                <input type="number" className="mt-1 w-full border rounded p-2" value={form.total_blocks} onChange={e=>updateField('total_blocks', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Total Lots</label>
                <input type="number" className="mt-1 w-full border rounded p-2" value={form.total_lots} onChange={e=>updateField('total_lots', e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700">Barangay</label>
                <input className="mt-1 w-full border rounded p-2" value={form.barangay} onChange={e=>updateField('barangay', e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-gray-700">Year Started</label>
                <input type="number" min="1900" max="2100" className="mt-1 w-full border rounded p-2" value={form.year_started} onChange={e=>updateField('year_started', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-700">Description</label>
              <textarea className="mt-1 w-full border rounded p-2" rows="4" value={form.description} onChange={e=>updateField('description', e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-gray-700">Project Image</label>
              <input type="file" accept="image/*" className="mt-1 w-full" onChange={e=>updateField('proj_image', e.target.files?.[0] || null)} />
            </div>
            <div className="pt-2">
              <button className="px-4 py-2 bg-emerald-600 text-white rounded-xl" type="submit" disabled={saving}>{saving ? 'Saving...' : 'Save Project'}</button>
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}