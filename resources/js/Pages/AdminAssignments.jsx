import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

export default function AdminAssignments() {
  const [pending, setPending] = useState([])
  const [assigned, setAssigned] = useState([])
  const [projects, setProjects] = useState([])
  const [blocksMap, setBlocksMap] = useState({})
  const [lotsMap, setLotsMap] = useState({})
  const [searchPending, setSearchPending] = useState('')
  const [searchAssigned, setSearchAssigned] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [assignForms, setAssignForms] = useState({})
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [p1, p2, p3] = await Promise.all([
        axios.get('/admin/api/assignments/pending'),
        axios.get('/admin/api/assignments'),
        axios.get('/admin/api/project-sites'),
      ])
      setPending(p1.data.data || [])
      setAssigned(p2.data.data || [])
      setProjects(p3.data.data || [])
      setError('')
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  async function searchLists() {
    try {
      const [p1, p2] = await Promise.all([
        axios.get('/admin/api/assignments/pending', { params: { search: searchPending } }),
        axios.get('/admin/api/assignments', { params: { search: searchAssigned } }),
      ])
      setPending(p1.data.data || [])
      setAssigned(p2.data.data || [])
      setError('')
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  function ProjectSelect({ value, onChange }) {
    return (
      <select className="border border-gray-300 rounded p-2" value={value} onChange={e=>onChange(e.target.value)}>
        <option value="">Select Project</option>
        {projects.map(p => <option key={p.project_id} value={p.project_id}>{p.project_name}</option>)}
      </select>
    )
  }

  async function loadBlocks(project_id) {
    if (!project_id) return
    try {
      const res = await axios.get(`/admin/api/project-sites/${project_id}/blocks`)
      setBlocksMap(prev => ({ ...prev, [project_id]: res.data.data || [] }))
    } catch (e) {
      setBlocksMap(prev => ({ ...prev, [project_id]: [] }))
    }
  }
  async function loadAvailableLots(project_id, block_no) {
    if (!project_id || !block_no) return
    try {
      const res = await axios.get(`/admin/api/project-sites/${project_id}/blocks/${block_no}/available-lots`)
      setLotsMap(prev => ({ ...prev, [`${project_id}#${block_no}`]: res.data.data || [] }))
    } catch (e) {
      setLotsMap(prev => ({ ...prev, [`${project_id}#${block_no}`]: [] }))
    }
  }

  async function assignRow(survey_id, project_id, block_no, lot_no) {
    if (!project_id) { alert('Select a project'); return }
    if (!block_no) { alert('Select a block'); return }
    if (!lot_no) { alert('Select a lot'); return }
    setBusyId(survey_id)
    try {
      await axios.post('/admin/api/assignments', { survey_id, project_id, block_no, lot_no }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      await loadAll()
      await loadBlocks(project_id)
      await loadAvailableLots(project_id, block_no)
    } catch (e) {
      alert(e?.response?.data?.message || e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:block w-64 flex flex-col flex-shrink-0 bg-white text-gray-700 p-6 border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <img src="/icons/appicon1.png" alt="App" className="w-9 h-9 rounded-xl ring-1 ring-emerald-200"/>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <nav className="space-y-2 flex flex-col flex-1">
          <Link href="/admin/dashboard" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/dashboard') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/dashboardicon.png" alt="Dashboard" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Dashboard</span>
          </Link>
          <Link href="/admin/beneficiaries" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/beneficiaries') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/beneficiariesicon.png" alt="Beneficiaries" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Beneficiaries</span>
          </Link>
          <Link href="/admin/project-sites" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/project-sites') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/projectsiteicon.png" alt="Project Sites" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Project Sites</span>
          </Link>
          <Link href="/admin/assignments" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/assignments') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/assignmenticon.png" alt="Assignments" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Assignments</span>
          </Link>
          <Link href="/admin/profile" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/profile') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/profileicon.png" alt="Profile" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">My Profile</span>
          </Link>
          <Link href="/admin/about" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/about') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/abouticon.png" alt="About" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">About</span>
          </Link>
          <div className="mt-auto">
            <button onClick={logoutAdmin} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 hover:text-red-700">
              <img src="/icons/logouticon.png" alt="Log out" className="w-5 h-5"/>
              <span className="tracking-wider uppercase text-xs">Log out</span>
            </button>
          </div>
        </nav>
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <img src="/icons/appicon1.png" alt="App" className="w-9 h-9 rounded-xl ring-1 ring-emerald-200"/>
              <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
            </div>
            <nav className="space-y-2 flex flex-col flex-1">
              <Link href="/admin/dashboard" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/dashboard') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
                <img src="/icons/dashboardicon.png" alt="Dashboard" className="w-5 h-5"/>
                <span className="tracking-wider uppercase text-xs">Dashboard</span>
              </Link>
              <Link href="/admin/beneficiaries" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/beneficiaries') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
                <img src="/icons/beneficiariesicon.png" alt="Beneficiaries" className="w-5 h-5"/>
                <span className="tracking-wider uppercase text-xs">Beneficiaries</span>
              </Link>
              <Link href="/admin/project-sites" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/project-sites') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
                <img src="/icons/projectsiteicon.png" alt="Project Sites" className="w-5 h-5"/>
                <span className="tracking-wider uppercase text-xs">Project Sites</span>
              </Link>
              <Link href="/admin/assignments" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/assignments') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
                <img src="/icons/assignmenticon.png" alt="Assignments" className="w-5 h-5"/>
                <span className="tracking-wider uppercase text-xs">Assignments</span>
              </Link>
              <Link href="/admin/profile" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/profile') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
                <img src="/icons/profileicon.png" alt="Profile" className="w-5 h-5"/>
                <span className="tracking-wider uppercase text-xs">My Profile</span>
              </Link>
              <Link href="/admin/about" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/about') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
                <img src="/icons/abouticon.png" alt="About" className="w-5 h-5"/>
                <span className="tracking-wider uppercase text-xs">About</span>
              </Link>
              <div className="mt-auto">
                <button onClick={logoutAdmin} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 hover:text-red-700">
                  <img src="/icons/logouticon.png" alt="Log out" className="w-5 h-5"/>
                  <span className="tracking-wider uppercase text-xs">Log out</span>
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      <main className="flex-1 p-6 bg-gray-50">
        <div className="md:hidden mb-4 flex items-center justify-between">
          <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="text-sm font-semibold text-emerald-800">Menu</span>
        </div>
        {error && <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
          <div>
            <div className="text-sm text-gray-500">Hello Admin!</div>
            <h2 className="text-2xl text-emerald-800 font-semibold">Assignments</h2>
            <div className="text-xs text-gray-500">Assign approved beneficiaries to project sites</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/project-sites" className="px-3 py-2 border rounded-xl text-emerald-800">Manage Projects</Link>
          </div>
        </header>

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <form className="flex items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); searchLists() }}>
            <input className="border border-gray-300 rounded-xl p-2.5 w-full md:w-64" placeholder="Search pending" value={searchPending} onChange={e=>setSearchPending(e.target.value)} />
            <input className="border border-gray-300 rounded-xl p-2.5 w-full md:w-64" placeholder="Search assigned" value={searchAssigned} onChange={e=>setSearchAssigned(e.target.value)} />
            <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit">Search</button>
          </form>
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">Pending Approval Assignments</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-emerald-50 text-emerald-800">
                <tr>
                  <th className="p-3 text-left">Surname</th>
                  <th className="p-3 text-left">Barangay</th>
                  <th className="p-3 text-left">Classification</th>
                  <th className="p-3 text-left">Project</th>
                  <th className="p-3 text-left">Block</th>
                  <th className="p-3 text-left">Lot</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {pending.map(r => {
                  const f = assignForms[r.survey_id] || { project_id: '', block_no: '', lot_no: '' }
                  const blocks = f.project_id ? (blocksMap[f.project_id] || []) : []
                  const lotsKey = `${f.project_id}#${f.block_no}`
                  const lots = (lotsMap[lotsKey] || [])
                  return (
                    <tr key={r.survey_id} className="even:bg-gray-50">
                      <td className="p-3">{r.last_name}</td>
                      <td className="p-3">{r.barangay}</td>
                      <td className="p-3">{r.classification}</td>
                      <td className="p-3">
                        <ProjectSelect value={f.project_id} onChange={(v)=>{
                          setAssignForms(prev=>({ ...prev, [r.survey_id]: { ...prev[r.survey_id], project_id: v, block_no: '', lot_no: '' } }))
                          loadBlocks(v)
                        }} />
                      </td>
                      <td className="p-3">
                        <select className="border rounded p-2 w-28" value={f.block_no} disabled={!f.project_id || blocks.length===0}
                          onChange={e=>{
                            const bn = e.target.value
                            setAssignForms(prev=>({ ...prev, [r.survey_id]: { ...prev[r.survey_id], block_no: bn, lot_no: '' } }))
                            loadAvailableLots(f.project_id, bn)
                          }}>
                          <option value="">Select Block</option>
                          {blocks.map(b => (
                            <option key={`b-${b.block_no}`} value={b.block_no}>Block {b.block_no} (avail {b.available_lots})</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <select className="border rounded p-2 w-28" value={f.lot_no} disabled={!f.project_id || !f.block_no || lots.length===0}
                          onChange={e=>setAssignForms(prev=>({ ...prev, [r.survey_id]: { ...prev[r.survey_id], lot_no: e.target.value } }))}>
                          <option value="">Select Lot</option>
                          {lots.map(n => (<option key={`l-${n}`} value={n}>Lot {n}</option>))}
                        </select>
                      </td>
                      <td className="p-3"><button className="px-3 py-1 border rounded text-sm text-emerald-800 hover:bg-emerald-50" disabled={busyId===r.survey_id} onClick={() => assignRow(r.survey_id, f.project_id, f.block_no, f.lot_no)}>{busyId===r.survey_id?'Assigning...':'Assign'}</button></td>
                    </tr>
                  )
                })}
                {!pending.length && <tr><td className="p-3" colSpan="7">No pending approved beneficiaries.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">Assigned Beneficiaries</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-emerald-50 text-emerald-800">
                <tr>
                  <th className="p-3 text-left">Surname</th>
                  <th className="p-3 text-left">Barangay</th>
                  <th className="p-3 text-left">Project</th>
                  <th className="p-3 text-left">Block</th>
                  <th className="p-3 text-left">Lot</th>
                  <th className="p-3 text-left">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {assigned.map(a => (
                  <tr key={a.assignment_id} className="even:bg-gray-50">
                    <td className="p-3">{a.last_name}</td>
                    <td className="p-3">{a.barangay}</td>
                    <td className="p-3">{a.project_name}</td>
                    <td className="p-3">{a.block_no}</td>
                    <td className="p-3">{a.lot_no}</td>
                    <td className="p-3">{a.date_assigned}</td>
                  </tr>
                ))}
                {!assigned.length && <tr><td className="p-3" colSpan="6">No assignments yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

      </main>
    </div>
  )
}
