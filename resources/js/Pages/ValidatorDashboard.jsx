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

  async function fetchTotals() {
    try {
      const res = await axios.get('/validator/api/totals')
      setTotals(res.data)
    } catch (e) { console.error(e) }
  }

  async function fetchSurveys(page = 1) {
    try {
      const res = await axios.get('/validator/api/surveys', { params: { page, per_page: perPage } })
      setSurveys(res.data)
    } catch (e) { console.error(e) }
  }

  async function fetchSubmitted(page = 1) {
    try {
      const res = await axios.get('/validator/api/submitted', { params: { page, per_page: perPage } })
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
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-white text-gray-700 p-4 border-r border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">C</div>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <ul className="space-y-1">
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800 cursor-pointer"><Link href="/validator/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/validator/survey-form" className="block">Survey Form</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/validator/profile" className="block">Profile</Link></li>
          <li className="px-2 py-3 rounded hover:bg-red-50 text-red-700 cursor-pointer mt-20"><button onClick={logoutValidator} className="w-full text-left">Log out</button></li>
        </ul>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 bg-gray-100">
        <header className="flex justify-between items-center bg-white p-4 rounded shadow">
          <h2 className="text-2xl text-emerald-800 font-semibold">Validator Dashboard</h2>
          <img src="/image/greenlogo1.jpg" alt="logo" className="h-14 object-contain"/>
        </header>

        {/* Cards */}
        <section className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button onClick={() => setShowTable(showTable === 'survey' ? 'none' : 'survey')} className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 11c0 2.761-2.239 5-5 5s-5-2.239-5-5 2.239-5 5-5 5 2.239 5 5z"/><path d="M20 21a8 8 0 10-16 0"/></svg>
              </div>
              <div className="mt-4 text-3xl font-mono text-gray-900">{totals.total_surveyed}</div>
              <div className="mt-1 text-sm text-gray-600">Total Surveyed</div>
              <div className="mt-1 text-xs text-gray-500">Tap to view list</div>
            </button>

            <button onClick={() => setShowTable(showTable === 'submitted' ? 'none' : 'submitted')} className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
              </div>
              <div className="mt-4 text-3xl font-mono text-gray-900">{totals.total_submitted}</div>
              <div className="mt-1 text-sm text-gray-600">Submitted</div>
              <div className="mt-1 text-xs text-gray-500">Tap to view list</div>
            </button>

            <div className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v12"/><path d="M6 12h12"/></svg>
              </div>
              <div className="mt-4 text-3xl font-mono text-gray-900">{pending}</div>
              <div className="mt-1 text-sm text-gray-600">Pending to Submit</div>
              <div className="mt-1 text-xs text-gray-500">Surveys not yet submitted</div>
            </div>
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
                {surveys.data.map(row => (
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
                      onClick={() => { fetchSurveys(i); setSurveys(prev => ({...prev, page: i})) }}
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
                {submitted.data.map(row => (
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
                      onClick={() => { fetchSubmitted(i); setSubmitted(prev => ({...prev, page: i})) }}
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
