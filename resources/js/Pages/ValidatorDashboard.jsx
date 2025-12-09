import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

const perPage = 10

export default function ValidatorDashboard() {
  const [totals, setTotals] = useState({ total_surveyed: 0, total_submitted: 0 })
  const [surveys, setSurveys] = useState({ data: [], total: 0, page: 1 })
  const [submitted, setSubmitted] = useState({ data: [], total: 0, page: 1 })
  const [showTable, setShowTable] = useState('none') // 'survey' or 'submitted' or 'none'
  const [modalOpen, setModalOpen] = useState(false)
  const [modalRows, setModalRows] = useState([])
  const [search, setSearch] = useState('')
  const [showBarangayList, setShowBarangayList] = useState(false)
  const [barangayFilter, setBarangayFilter] = useState('')
  const barangays = [
    'Aplaya','Balabag','Binaton','Cogon','Colorado','Dawis','Dulangan','Goma','Igpit','Kapatagan','Kiagot','Lungag','Mahayahay','Matti','Ruparan','San_Agustin','San_Jose','San_Miguel','San_Roque','Sinawilan','Soong','Tiguman','Tres_De_Mayo','Zone_1','Zone_2','Zone_3'
  ]

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutValidator() {
    try {
      await fetch('/validator/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    fetchTotals()
    fetchSurveys(1)
    fetchSubmitted(1)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSurveys(1, search)
      setSurveys(prev => ({ ...prev, page: 1 }))
      fetchSubmitted(1, search)
      setSubmitted(prev => ({ ...prev, page: 1 }))
    }, 300)
    return () => clearTimeout(t)
  }, [search])

  async function fetchTotals() {
    try {
      const res = await axios.get('/validator/api/totals')
      setTotals(res.data)
    } catch (e) { console.error(e) }
  }

  async function fetchSurveys(page = 1, s = '') {
    try {
      const res = await axios.get('/validator/api/surveys', { params: { page, per_page: perPage, search: s } })
      setSurveys(res.data)
    } catch (e) { console.error(e) }
  }

  async function fetchSubmitted(page = 1, s = '') {
    try {
      const res = await axios.get('/validator/api/submitted', { params: { page, per_page: perPage, search: s } })
      setSubmitted(res.data)
    } catch (e) { console.error(e) }
  }

  async function handleSubmitSurvey(survey_id) {
    if (!confirm('Submit to admin?')) return
    try {
      await axios.post('/validator/api/submit', { survey_id })
      // refresh lists
      fetchSurveys(surveys.page)
      fetchSubmitted(submitted.page)
      fetchTotals()
    } catch (e) { console.error(e) }
  }

  function openModalWithSurveyRows(rows) {
    setModalRows(rows)
    setModalOpen(true)
  }

  // small UI helpers
  const pages = (total) => {
    const count = Math.ceil(total / perPage)
    return Array.from({length: count}, (_,i) => i+1)
  }

  const pending = Math.max(0, (totals.total_surveyed || 0) - (totals.total_submitted || 0))
  const q = search.trim().toLowerCase()
  const surveysFiltered = q ? (surveys.data || []).filter(r => [r.date_interviewed, r.barangay, r.purok, r.last_name, r.classification, r.subclass_displaced, r.subclass_doubleup].some(v => String(v || '').toLowerCase().includes(q))) : (surveys.data || [])
  const submittedFiltered = q ? (submitted.data || []).filter(r => [r.date_interviewed, r.barangay, r.purok, r.last_name, r.classification, r.subclass_displaced, r.subclass_doubleup].some(v => String(v || '').toLowerCase().includes(q))) : (submitted.data || [])
  const surveysFinal = barangayFilter ? surveysFiltered.filter(r => r.barangay === barangayFilter) : surveysFiltered
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white text-gray-700 p-4 border-r border-gray-200 flex flex-col h-screen sticky top-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-6">
          <img src="/icons/appicon1.png" alt="logo" className="w-7 h-7 rounded-xl object-cover"/>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <nav className="space-y-2 flex flex-col flex-1">
          <Link href="/validator/dashboard" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/validator/dashboard') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/dashboardicon.png" alt="Dashboard" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Dashboard</span>
          </Link>
          <Link href="/validator/survey-form" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/validator/survey-form') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/assignmenticon.png" alt="Survey Form" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Survey Form</span>
          </Link>
          <Link href="/validator/profile" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/validator/profile') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/profileicon.png" alt="Profile" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Profile</span>
          </Link>
          <div className="mt-auto">
            <button onClick={logoutValidator} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 hover:text-red-700">
              <img src="/icons/logouticon.png" alt="Log out" className="w-5 h-5"/>
              <span className="tracking-wider uppercase text-xs">Log out</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 h-screen overflow-y-auto p-6 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-9 relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search"
                className="w-full rounded-2xl bg-white text-gray-900 px-4 py-3 pl-12 ring-2 ring-emerald-300 focus:ring-2 focus:ring-emerald-400 outline-none shadow-sm"
              />
              <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
            </div>
            <div className="md:col-span-3 flex md:justify-end">
              <Link href="/validator/survey-form" className="px-3 py-3 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700 hover:ring-emerald-400 flex items-center gap-2 shadow-sm">
                <img src="/icons/assignmenticon.png" alt="New Survey" className="w-5 h-5"/>
                <span className="text-sm font-medium">New Survey</span>
              </Link>
            </div>
        </div>
        <div className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Welcome back, Validator!</div>
              <div className="mt-2 text-xs opacity-85">Today is {new Date().toLocaleDateString()}. You have <span className="font-semibold">{pending}</span> surveys pending submission.</div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <section className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setShowTable(showTable === 'survey' ? 'none' : 'survey')} className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 11c0 2.761-2.239 5-5 5s-5-2.239-5-5 2.239-5 5-5 5 2.239 5 5z"/><path d="M20 21a8 8 0 10-16 0"/></svg>
              </div>
              <div className="mt-4 text-3xl font-semibold text-gray-900">{totals.total_surveyed}</div>
              <div className="mt-1 text-sm text-gray-600">Total Surveyed</div>
              <div className="mt-1 text-xs text-gray-500">Tap to view list</div>
            </button>

            <button onClick={() => setShowTable(showTable === 'submitted' ? 'none' : 'submitted')} className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </div>
              <div className="mt-4 text-3xl font-semibold text-gray-900">{totals.total_submitted}</div>
              <div className="mt-1 text-sm text-gray-600">Submitted</div>
              <div className="mt-1 text-xs text-gray-500">Tap to view list</div>
            </button>

            <button type="button" onClick={() => setShowBarangayList(v => !v)} className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition min-h-[160px] w-full">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v12"/><path d="M6 12h12"/></svg>
              </div>
              <div className="mt-4 text-3xl font-semibold text-gray-900">{pending}</div>
              <div className="mt-1 text-sm text-gray-600">Pending to Submit</div>
              <div className="mt-1 text-xs text-gray-500">Tap to browse by barangay</div>
            </button>
          </div>
        </section>

        <section className={`${!showBarangayList && 'hidden'} mt-6`}>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-emerald-800 mb-3">Browse by Barangay</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {barangays.map(b => (
                <button key={b} type="button" onClick={() => { setBarangayFilter(b); setShowTable('survey') }} className={`px-3 py-2 rounded-xl ring-1 ring-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 text-left ${barangayFilter===b ? 'bg-emerald-50 text-emerald-800' : ''}`}>
                  <span className="text-xs font-medium">{b.replace(/_/g,' ')}</span>
                </button>
              ))}
            </div>
            {barangayFilter && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-gray-600">Showing: <span className="font-medium text-emerald-700">{barangayFilter.replace(/_/g,' ')}</span></span>
                <button type="button" onClick={() => setBarangayFilter('')} className="text-xs px-2 py-1 rounded-xl bg-gray-100 hover:bg-gray-200">Clear</button>
              </div>
            )}
          </div>
        </section>

        {/* Survey Table */}
        <section className={`mt-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm ${showTable !== 'survey' && 'hidden'}`}>
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">List of Applicants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-emerald-600 text-white">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Barangay</th>
                  <th className="p-3 text-left">Purok</th>
                  <th className="p-3 text-left">Surname</th>
                  <th className="p-3 text-left">Classification</th>
                  <th className="p-3 text-left">Sub-Class Displaced</th>
                  <th className="p-3 text-left">Double Up</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {surveysFinal.map(row => (
                  <tr key={row.survey_id} className="even:bg-gray-50">
                    <td className="p-3">{row.date_interviewed}</td>
                    <td className="p-3">{row.barangay}</td>
                    <td className="p-3">{row.purok}</td>
                    <td className="p-3">{row.last_name}</td>
                    <td className="p-3">{row.classification}</td>
                    <td className="p-3">{row.subclass_displaced}</td>
                    <td className="p-3">{row.subclass_doubleup}</td>
                    <td className="p-3 space-x-2">
                      <Link className="px-3 py-1 border rounded text-sm text-emerald-800" href={`/validator/survey/${row.survey_id}`}>View Details</Link>
                      <button onClick={() => handleSubmitSurvey(row.survey_id)} className="px-3 py-1 bg-emerald-600 text-white rounded text-sm">Submit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex justify-center gap-2">
            {pages(surveys.total).map(i => (
              <button key={i}
                      onClick={() => { fetchSurveys(i, search); setSurveys(prev => ({...prev, page: i})) }}
                      className={`px-3 py-1 rounded border ${surveys.page === i ? 'bg-emerald-600 text-white' : 'text-emerald-800'}`}>
                {i}
              </button>
            ))}
          </div>
        </section>

        {/* Submitted Table */}
        <section className={`mt-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm ${showTable !== 'submitted' && 'hidden'}`}>
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">Submitted Applicants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-emerald-600 text-white">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Barangay</th>
                  <th className="p-3 text-left">Purok</th>
                  <th className="p-3 text-left">Surname</th>
                  <th className="p-3 text-left">Classification</th>
                  <th className="p-3 text-left">Sub-Class Displaced</th>
                  <th className="p-3 text-left">Double Up</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {submittedFiltered.map(row => (
                  <tr key={row.survey_id} className="even:bg-gray-50">
                    <td className="p-3">{row.date_interviewed}</td>
                    <td className="p-3">{row.barangay}</td>
                    <td className="p-3">{row.purok}</td>
                    <td className="p-3">{row.last_name}</td>
                    <td className="p-3">{row.classification}</td>
                    <td className="p-3">{row.subclass_displaced}</td>
                    <td className="p-3">{row.subclass_doubleup}</td>
                    <td className="p-3">
                      <Link className="px-3 py-1 border rounded text-sm text-emerald-800" href={`/validator/survey/${row.survey_id}`}>View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            {pages(submitted.total).map(i => (
              <button key={i}
                      onClick={() => { fetchSubmitted(i, search); setSubmitted(prev => ({...prev, page: i})) }}
                      className={`px-3 py-1 rounded border ${submitted.page === i ? 'bg-emerald-600 text-white' : 'text-emerald-800'}`}>
                {i}
              </button>
            ))}
          </div>
        </section>

        {/* Modal for showing all surveys (Total Surveyed click) */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 w-11/12 md:w-3/4 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-emerald-800">All Survey Data</h3>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100">
                  <svg className="w-5 h-5 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18"/><path d="M6 6l12 12"/></svg>
                </button>
              </div>
              <div className="overflow-auto">
                <table className="min-w-full">
                  <thead className="bg-emerald-600 text-white">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Barangay</th>
                      <th className="p-2">Purok</th>
                      <th className="p-2">Surname</th>
                      <th className="p-2">Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalRows.map((r, idx) => (
                      <tr key={idx} className="even:bg-gray-50">
                        <td className="p-2">{r.date_interviewed}</td>
                        <td className="p-2">{r.barangay}</td>
                        <td className="p-2">{r.purok}</td>
                        <td className="p-2">{r.last_name}</td>
                        <td className="p-2">{r.classification}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
