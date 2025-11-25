import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

export default function AdminAssignments() {
  const [pending, setPending] = useState([])
  const [assigned, setAssigned] = useState([])
  const [projects, setProjects] = useState([])
  const [searchPending, setSearchPending] = useState('')
  const [searchAssigned, setSearchAssigned] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [assignForms, setAssignForms] = useState({})

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

  async function assignRow(survey_id, project_id, block_no, lot_no) {
    if (!project_id) { alert('Select a project'); return }
    setBusyId(survey_id)
    try {
      await axios.post('/admin/api/assignments', { survey_id, project_id, block_no, lot_no }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      await loadAll()
    } catch (e) {
      alert(e?.response?.data?.message || e.message)
    } finally {
      setBusyId(null)
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
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/project-sites" className="block">Project Sites</Link></li>
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800 cursor-pointer"><Link href="/admin/assignments" className="block">Assignments</Link></li>
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
            <h2 className="text-2xl text-emerald-800 font-semibold">Assignments</h2>
            <div className="text-xs text-gray-500">Assign approved beneficiaries to project sites</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin/project-sites" className="px-3 py-2 border rounded-xl text-emerald-800">Manage Projects</Link>
          </div>
        </header>

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <form className="flex items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); searchLists() }}>
            <input className="border border-gray-300 rounded-xl p-2.5 w-64" placeholder="Search pending" value={searchPending} onChange={e=>setSearchPending(e.target.value)} />
            <input className="border border-gray-300 rounded-xl p-2.5 w-64" placeholder="Search assigned" value={searchAssigned} onChange={e=>setSearchAssigned(e.target.value)} />
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
                  return (
                    <tr key={r.survey_id} className="even:bg-gray-50">
                      <td className="p-3">{r.last_name}</td>
                      <td className="p-3">{r.barangay}</td>
                      <td className="p-3">{r.classification}</td>
                      <td className="p-3"><ProjectSelect value={f.project_id} onChange={(v)=>setAssignForms(prev=>({ ...prev, [r.survey_id]: { ...prev[r.survey_id], project_id: v } }))} /></td>
                      <td className="p-3"><input className="border rounded p-2 w-24" value={f.block_no} onChange={e=>setAssignForms(prev=>({ ...prev, [r.survey_id]: { ...prev[r.survey_id], block_no: e.target.value } }))} /></td>
                      <td className="p-3"><input className="border rounded p-2 w-24" value={f.lot_no} onChange={e=>setAssignForms(prev=>({ ...prev, [r.survey_id]: { ...prev[r.survey_id], lot_no: e.target.value } }))} /></td>
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