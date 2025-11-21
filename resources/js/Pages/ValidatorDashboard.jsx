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

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-28 hover:w-60 transition-all duration-300 bg-green-800 text-white p-4">
        <ul className="space-y-2 mt-6">
          <li className="px-2 py-3 rounded hover:bg-green-700 cursor-pointer">Validator Dashboard</li>
          <li className="px-2 py-3 rounded hover:bg-green-700 cursor-pointer"><a href="/validator/survey-form">Survey Form</a></li>
          <li className="px-2 py-3 rounded hover:bg-green-700 cursor-pointer"><a href="/validator/profile">Profile</a></li>
          <li className="px-2 py-3 rounded hover:bg-red-600 cursor-pointer mt-20"><Link href="/validator/logout" method="post" as="button" className="w-full text-left">Logout</Link></li>
        </ul>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 bg-gray-100">
        <header className="flex justify-between items-center bg-white p-4 rounded shadow">
          <h2 className="text-2xl text-green-800 font-semibold">Validator Dashboard</h2>
          <img src="/image/greenlogo1.jpg" alt="logo" className="h-14 object-contain"/>
        </header>

        {/* Cards */}
        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded shadow flex justify-between items-center cursor-pointer hover:shadow-md"
               onClick={() => setShowTable(showTable === 'survey' ? 'none' : 'survey')}>
            <div>
              <div className="text-sm text-gray-500">Total Surveyed</div>
              <div className="text-3xl font-mono text-green-800">{totals.total_surveyed}</div>
            </div>
            <div className="bg-green-800 text-white p-4 rounded-full">
              <i className="fas fa-users"></i>
            </div>
          </div>

          <div className="bg-white p-6 rounded shadow flex justify-between items-center cursor-pointer hover:shadow-md"
               onClick={() => setShowTable(showTable === 'submitted' ? 'none' : 'submitted')}>
            <div>
              <div className="text-sm text-gray-500">Submitted</div>
              <div className="text-3xl font-mono text-green-800">{totals.total_submitted}</div>
            </div>
            <div className="bg-green-800 text-white p-4 rounded-full">
              <i className="fas fa-clipboard-check"></i>
            </div>
          </div>
        </section>

        {/* Survey Table */}
        <section className={`mt-6 bg-white p-6 rounded shadow ${showTable !== 'survey' && 'hidden'}`}>
          <h3 className="text-lg font-semibold text-green-800 mb-4">List of Applicants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-green-800 text-white">
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
                      <Link className="px-3 py-1 border rounded text-sm text-green-800" href={`/validator/survey/${row.survey_id}`}>View Details</Link>
                      <button onClick={() => handleSubmitSurvey(row.survey_id)} className="px-3 py-1 bg-green-800 text-white rounded text-sm">Submit</button>
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
                      className={`px-3 py-1 rounded border ${surveys.page === i ? 'bg-green-800 text-white' : 'text-green-800'}`}>
                {i}
              </button>
            ))}
          </div>
        </section>

        {/* Submitted Table */}
        <section className={`mt-6 bg-white p-6 rounded shadow ${showTable !== 'submitted' && 'hidden'}`}>
          <h3 className="text-lg font-semibold text-green-800 mb-4">Submitted Applicants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-green-800 text-white">
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
                      <Link className="px-3 py-1 border rounded text-sm text-green-800" href={`/validator/survey/${row.survey_id}`}>View</Link>
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
                      className={`px-3 py-1 rounded border ${submitted.page === i ? 'bg-green-800 text-white' : 'text-green-800'}`}>
                {i}
              </button>
            ))}
          </div>
        </section>

        {/* Modal for showing all surveys (Total Surveyed click) */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-white rounded p-6 w-11/12 md:w-3/4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">All Survey Data</h3>
                <button onClick={() => setModalOpen(false)} className="text-gray-500">Close</button>
              </div>
              <div className="overflow-auto">
                <table className="min-w-full">
                  <thead className="bg-green-800 text-white">
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
