// resources/js/Pages/AdminBeneficiaries.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

const perPageDefault = 10

export default function AdminBeneficiaries() {
  const [validated, setValidated] = useState({ data: [], total: 0, page: 1, per_page: perPageDefault })
  const [affiliated, setAffiliated] = useState({ data: [], total: 0, page: 1, per_page: perPageDefault })
  const [mayor, setMayor] = useState({ data: [], total: 0, page: 1, per_page: perPageDefault })
  const [activeTab, setActiveTab] = useState('non')
  const [search, setSearch] = useState('')
  // Simplified filters: keep only search and barangay
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [barangayFilter, setBarangayFilter] = useState('')
  const barangays = [
    'Aplaya','Balabag','Binaton','Cogon','Colorado','Dawis','Dulangan','Goma','Igpit','Kapatagan','Kiagot','Lungag','Mahayahay','Matti','Ruparan','San_Agustin','San_Jose','San_Miguel','San_Roque','Sinawilan','Soong','Tiguman','Tres_De_Mayo','Zone_1','Zone_2','Zone_3'
  ]

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    fetchValidated(1, '', '', '')
    fetchAffiliated(1, '', '', '')
    fetchMayorEndorsed(1, '', '')
  }, [])

  useEffect(() => {
    const t = setTimeout(() => applyFilters(1), 100)
    return () => clearTimeout(t)
  }, [activeTab, barangayFilter, search])

  async function fetchValidated(page = 1, search = '', barangay = '') {
    try {
      const res = await axios.get('/admin/api/beneficiaries/validated', { params: { page, per_page: validated.per_page, search, barangay } })
      setValidated({ ...validated, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Validated fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load validated list')
    }
  }


  async function fetchAffiliated(page = 1, search = '', barangay = '') {
    try {
      const res = await axios.get('/admin/api/beneficiaries/affiliated', { params: { page, per_page: affiliated.per_page, search, status: 'submitted', barangay } })
      setAffiliated({ ...affiliated, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Affiliated fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load affiliated list')
    }
  }

  async function fetchMayorEndorsed(page = 1, search = '', barangay = '') {
    try {
      const res = await axios.get('/admin/api/beneficiaries/mayor-endorsed', { params: { page, per_page: mayor.per_page, search, barangay } })
      setMayor({ ...mayor, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Mayor-endorsed fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load mayor-endorsed list')
    }
  }

  async function handleExportValidated() {
    try {
      const params = {}
      if (search) params.search = search
      if (barangayFilter) params.barangay = barangayFilter
      const res = await axios.get('/admin/api/beneficiaries/validated/export', { params, responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'validated_beneficiaries.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setError('')
    } catch (err) {
      console.error('Export validated failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to export validated CSV')
    }
  }

  async function handleExportAffiliated() {
    try {
      const params = { status: 'submitted' }
      if (search) params.search = search
      if (barangayFilter) params.barangay = barangayFilter
      const res = await axios.get('/admin/api/beneficiaries/affiliated/export', { params, responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'affiliated_beneficiaries.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setError('')
    } catch (err) {
      console.error('Export affiliated failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to export affiliated CSV')
    }
  }

  async function handleExportMayor() {
    try {
      const params = {}
      if (search) params.search = search
      if (barangayFilter) params.barangay = barangayFilter
      const res = await axios.get('/admin/api/beneficiaries/mayor-endorsed/export', { params, responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'mayor_endorsed_beneficiaries.csv'
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setError('')
    } catch (err) {
      console.error('Export mayor-endorsed failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to export mayor-endorsed CSV')
    }
  }

  function applyFilters(page = 1) {
    if (activeTab === 'non') {
      fetchValidated(page, search, barangayFilter)
    } else if (activeTab === 'aff') {
      fetchAffiliated(page, search, barangayFilter)
    } else {
      fetchMayorEndorsed(page, search, barangayFilter)
    }
  }

  const pages = (total, perPage) => Array.from({ length: Math.ceil((total || 0) / (perPage || perPageDefault)) }, (_, i) => i + 1)

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
            <h2 className="text-2xl text-emerald-800 font-semibold">Beneficiaries</h2>
            <div className="text-xs text-gray-500">Validated and affiliated lists</div>
          </div>
          <img src="/image/greenlogo1.jpg" alt="logo" className="h-10 w-10 rounded-full object-cover"/>
        </header>

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="inline-flex rounded-xl bg-gray-100 p-1">
              <button type="button" onClick={() => setActiveTab('non')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'non' ? 'bg-white shadow text-emerald-700' : 'text-gray-600 hover:text-emerald-700'}`}>Non-affiliated</button>
              <button type="button" onClick={() => setActiveTab('aff')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'aff' ? 'bg-white shadow text-emerald-700' : 'text-gray-600 hover:text-emerald-700'}`}>Affiliated</button>
              <button type="button" onClick={() => setActiveTab('mayor')} className={`px-4 py-2 rounded-lg text-sm ${activeTab === 'mayor' ? 'bg-white shadow text-emerald-700' : 'text-gray-600 hover:text-emerald-700'}`}>Mayor-endorsed</button>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'non' && <button type="button" onClick={handleExportValidated} className="px-3 py-2 bg-emerald-600 text-white rounded-xl">Download CSV</button>}
              {activeTab === 'aff' && <button type="button" onClick={handleExportAffiliated} className="px-3 py-2 bg-emerald-600 text-white rounded-xl">Download CSV</button>}
              {activeTab === 'mayor' && <button type="button" onClick={handleExportMayor} className="px-3 py-2 bg-emerald-600 text-white rounded-xl">Download CSV</button>}
            </div>
          </div>
          <form className="flex flex-wrap items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); applyFilters(1) }}>
            <input className="border border-gray-300 rounded-xl p-2.5 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/>
            <select className="border border-gray-300 rounded-xl p-2.5" value={barangayFilter} onChange={e=>setBarangayFilter(e.target.value)}>
              <option value="">Barangay: All</option>
              {barangays.map(b => (
                <option key={b} value={b}>{b.replace(/_/g,' ')}</option>
              ))}
            </select>
            {/* Simplified controls: no classification/affiliation or extra buttons */}
          </form>
            {/* Export panel removed as per requirement */}
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">{activeTab === 'non' ? 'Validated Beneficiaries (Non-affiliated)' : activeTab === 'aff' ? 'Affiliated Beneficiaries' : 'Mayor-Endorsed Beneficiaries'}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-emerald-50 text-emerald-800">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Barangay</th>
                  <th className="p-3 text-left">Surname</th>
                  {activeTab === 'aff' && <th className="p-3 text-left">Affiliation</th>}
                  <th className="p-3 text-left">Classification</th>
                  <th className="p-3 text-left">Sub-Class Displaced</th>
                  <th className="p-3 text-left">Sub-Class Double Up</th>
                  <th className="p-3 text-left">Sub-Class Homeless</th>
                  <th className="p-3 text-left">Points</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'non' ? validated.data : activeTab === 'aff' ? affiliated.data : mayor.data).map(b => (
                  <tr key={b.survey_id} className="even:bg-gray-50">
                    <td className="p-3">{b.date_interviewed}</td>
                    <td className="p-3">{String(b.barangay || '').replace(/_/g,' ')}</td>
                    <td className="p-3">{b.last_name}</td>
                    {activeTab === 'aff' && <td className="p-3">{String(b.affiliation || '').replace(/_/g,' ')}</td>}
                    <td className="p-3">{b.classification}</td>
                    <td className="p-3">{b.subclass_displaced}</td>
                    <td className="p-3">{b.subclass_doubleup}</td>
                    <td className="p-3">{b.subclass_homeless}</td>
                    <td className="p-3 font-semibold text-emerald-800 bg-emerald-50">{b.points}%</td>
                    <td className="p-3"><Link className="px-3 py-1 border rounded text-sm text-emerald-800 hover:bg-emerald-50" href={`/admin/beneficiaries/${b.survey_id}`}>View Details</Link></td>
                  </tr>
                ))}
                {!((activeTab === 'non' ? validated.data.length : activeTab === 'aff' ? affiliated.data.length : mayor.data.length)) && (
                  <tr><td className="p-3" colSpan={activeTab === 'aff' ? 10 : 9}>No results found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {pages(
              activeTab === 'non' ? validated.total : activeTab === 'aff' ? affiliated.total : mayor.total,
              activeTab === 'non' ? validated.per_page : activeTab === 'aff' ? affiliated.per_page : mayor.per_page
            ).map(i => (
              <button
                key={i}
                onClick={() => applyFilters(i)}
                className={`px-3 py-1 rounded border ${(
                  activeTab === 'non' ? validated.page : activeTab === 'aff' ? affiliated.page : mayor.page
                ) === i ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-gray-100'}`}
              >{i}</button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
