import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

export default function AdminProjectSites() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => { load() }, [])

  async function load(q = '') {
    try {
      const res = await axios.get('/admin/api/project-sites', { params: { search: q } })
      setProjects(res.data.data || [])
      setError('')
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load projects')
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
            <h2 className="text-2xl text-emerald-800 font-semibold">Project Sites</h2>
            <div className="text-xs text-gray-500">Existing projects and site details</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/project-sites/add" className="px-3 py-2 bg-emerald-600 text-white rounded-xl">Add Project</Link>
          </div>
        </header>

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <form className="flex items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); load(search) }}>
            <input className="border border-gray-300 rounded-xl p-2.5 w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search projects" value={search} onChange={e=>setSearch(e.target.value)}/>
            <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit">Search</button>
          </form>

          {projects.length === 0 ? (
            <div className="text-center text-gray-600">
              <div>No projects found.</div>
              <Link href="/admin/project-sites/add" className="inline-block mt-4 px-3 py-2 bg-emerald-600 text-white rounded-xl">Add Project</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(p => (
                <div key={p.project_id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.project_name} className="w-full h-40 object-cover"/>
                  ) : (
                    <div className="w-full h-40 bg-gray-100 grid place-items-center text-gray-500">No image</div>
                  )}
                  <div className="p-4">
                    <div className="text-lg font-semibold text-emerald-800">{p.project_name}</div>
                    <div className="text-sm text-gray-600">Barangay: {p.barangay || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">Year Started: {p.year_started || '—'}</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded bg-emerald-50 p-2">
                        <div className="text-xs text-gray-500">Land Area</div>
                        <div className="text-sm font-semibold text-emerald-800">{p.land_area ?? 0}</div>
                      </div>
                      <div className="rounded bg-emerald-50 p-2">
                        <div className="text-xs text-gray-500">Blocks</div>
                        <div className="text-sm font-semibold text-emerald-800">{p.total_blocks ?? 0}</div>
                      </div>
                      <div className="rounded bg-emerald-50 p-2">
                        <div className="text-xs text-gray-500">Lots</div>
                        <div className="text-sm font-semibold text-emerald-800">{p.total_lots ?? 0}</div>
                      </div>
                    </div>
                    {p.description && <div className="mt-3 text-sm text-gray-700 line-clamp-3">{p.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}