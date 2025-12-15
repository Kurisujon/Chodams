// resources/js/Pages/AdminBeneficiaries.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

const perPageDefault = 10

export default function AdminBeneficiaries() {
  const [validated, setValidated] = useState({ data: [], total: 0, page: 1, per_page: perPageDefault })
  const [affiliated, setAffiliated] = useState({ data: [], total: 0, page: 1, per_page: perPageDefault })
  const [searchValidated, setSearchValidated] = useState('')
  const [searchAffiliated, setSearchAffiliated] = useState('')
  const [affType, setAffType] = useState('')
  const [classAff, setClassAff] = useState('')
  const [classVal, setClassVal] = useState('')
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [exportBarangay, setExportBarangay] = useState('')
  const [exportStatus, setExportStatus] = useState('submitted')
  const [exportClass, setExportClass] = useState('')
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
  }, [])

  async function fetchValidated(page = 1, search = '', affiliation = '', classification = '') {
    try {
      const res = await axios.get('/admin/api/beneficiaries/validated', { params: { page, per_page: validated.per_page, search, affiliation, classification } })
      setValidated({ ...validated, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Validated fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load validated list')
    }
  }


  async function fetchAffiliated(page = 1, search = '', affiliation = '', classification = '') {
    try {
      const res = await axios.get('/admin/api/beneficiaries/affiliated', { params: { page, per_page: affiliated.per_page, search, affiliation, classification, status: 'submitted' } })
      setAffiliated({ ...affiliated, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Affiliated fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load affiliated list')
    }
  }

  async function handleExportBarangay() {
    try {
      const b = (exportBarangay || '').trim()
      if (!b) {
        setError('Please select a barangay to export')
        return
      }
      const params = { barangay: b, status: exportStatus || 'submitted' }
      if (exportClass) params.classification = exportClass
      const res = await axios.get('/admin/api/export/barangay', { params, responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const fname = `barangay-${b.replace(/\s+/g,'_').toLowerCase()}.csv`
      a.href = url
      a.download = fname
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setError('')
    } catch (err) {
      console.error('Export failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to export CSV')
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
          <div className="mb-4 flex items-center gap-2">
            <select className="border border-gray-300 rounded-xl p-2.5" value={exportBarangay} onChange={e=>setExportBarangay(e.target.value)}>
              <option value="">Select barangay</option>
              {barangays.map(b => (
                <option key={b} value={b}>{b.replace(/_/g,' ')}</option>
              ))}
            </select>
            <select className="border border-gray-300 rounded-xl p-2.5" value={exportStatus} onChange={e=>setExportStatus(e.target.value)}>
              <option value="submitted">Submitted (validated + approved)</option>
              <option value="validated">Validated</option>
              <option value="approved">Approved</option>
            </select>
            <select className="border border-gray-300 rounded-xl p-2.5" value={exportClass} onChange={e=>setExportClass(e.target.value)}>
              <option value="">Classification: All</option>
              <option value="Displaced">Displaced</option>
              <option value="Double-up">Double-up</option>
              <option value="Homeless">Homeless</option>
              <option value="Upgrading of Land Tenure">Upgrading of Land Tenure</option>
            </select>
            <button type="button" onClick={handleExportBarangay} className="px-3 py-2 bg-emerald-600 text-white rounded-xl">Download CSV</button>
          </div>
          <form className="flex items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); fetchValidated(1, searchValidated, '', classVal) }}>
            <input className="border border-gray-300 rounded-xl p-2.5 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search" value={searchValidated} onChange={e=>setSearchValidated(e.target.value)}/>
            <select className="border border-gray-300 rounded-xl p-2.5" value={classVal} onChange={e=>setClassVal(e.target.value)}>
              <option value="">Classification: All</option>
              <option value="Displaced">Displaced</option>
              <option value="Double-up">Double-up</option>
              <option value="Homeless">Homeless</option>
              <option value="Upgrading of Land Tenure">Upgrading of Land Tenure</option>
            </select>
            <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit">Search</button>
          </form>
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">Validated Beneficiaries (Non-affiliated)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-emerald-50 text-emerald-800">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Barangay</th>
                  <th className="p-3 text-left">Surname</th>
                  <th className="p-3 text-left">Classification</th>
                  <th className="p-3 text-left">Sub-Class Displaced</th>
                  <th className="p-3 text-left">Sub-Class Double Up</th>
                  <th className="p-3 text-left">Sub-Class Homeless</th>
                  <th className="p-3 text-left">Points</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {validated.data.map(b => (
                  <tr key={b.survey_id} className="even:bg-gray-50">
                    <td className="p-3">{b.date_interviewed}</td>
                    <td className="p-3">{b.barangay}</td>
                    <td className="p-3">{b.last_name}</td>
                    <td className="p-3">{b.classification}</td>
                    <td className="p-3">{b.subclass_displaced}</td>
                    <td className="p-3">{b.subclass_doubleup}</td>
                    <td className="p-3">{b.subclass_homeless}</td>
                    <td className="p-3 font-semibold text-emerald-800 bg-emerald-50">{b.points}</td>
                    <td className="p-3"><Link className="px-3 py-1 border rounded text-sm text-emerald-800 hover:bg-emerald-50" href={`/admin/beneficiaries/${b.survey_id}`}>View Details</Link></td>
                  </tr>
                ))}
                {!validated.data.length && <tr><td className="p-3" colSpan="9">No results found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {pages(validated.total, validated.per_page).map(i => (
              <button key={i} onClick={() => fetchValidated(i, searchValidated)} className={`px-3 py-1 rounded border ${validated.page === i ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-gray-100'}`}>{i}</button>
            ))}
          </div>
        </section>


        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <form className="flex items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); fetchAffiliated(1, searchAffiliated, affType, classAff) }}>
            <input className="border border-gray-300 rounded-xl p-2.5 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search Affiliated" value={searchAffiliated} onChange={e=>setSearchAffiliated(e.target.value)}/>
            <select className="border border-gray-300 rounded-xl p-2.5" value={affType} onChange={e=>setAffType(e.target.value)}>
              <option value="">All</option>
              <option value="SSS">SSS</option>
              <option value="GSIS">GSIS</option>
              <option value="PhilHealth">PhilHealth</option>
              <option value="PagIbig">PagIbig</option>
              <option value="PWD">PWD</option>
              <option value="Senior_Citizen">Senior Citizen</option>
              <option value="Solo_Parent">Solo Parent</option>
              <option value="4Ps">4Ps</option>
            </select>
            <select className="border border-gray-300 rounded-xl p-2.5" value={classAff} onChange={e=>setClassAff(e.target.value)}>
              <option value="">Classification: All</option>
              <option value="Displaced">Displaced</option>
              <option value="Double-up">Double-up</option>
              <option value="Homeless">Homeless</option>
              <option value="Upgrading of Land Tenure">Upgrading of Land Tenure</option>
            </select>
            <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit">Filter</button>
          </form>
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">Affiliated Beneficiaries</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-emerald-50 text-emerald-800">
                <tr>
                  <th className="p-3 text-left">Date</th>
                  <th className="p-3 text-left">Barangay</th>
                  <th className="p-3 text-left">Surname</th>
                  <th className="p-3 text-left">Affiliation</th>
                  <th className="p-3 text-left">Classification</th>
                  <th className="p-3 text-left">Sub-Class Displaced</th>
                  <th className="p-3 text-left">Sub-Class Double Up</th>
                  <th className="p-3 text-left">Sub-Class Homeless</th>
                  <th className="p-3 text-left">Points</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {affiliated.data.map(b => (
                  <tr key={b.survey_id} className="even:bg-gray-50">
                    <td className="p-3">{b.date_interviewed}</td>
                    <td className="p-3">{b.barangay}</td>
                    <td className="p-3">{b.last_name}</td>
                    <td className="p-3">{b.affiliation}</td>
                    <td className="p-3">{b.classification}</td>
                    <td className="p-3">{b.subclass_displaced}</td>
                    <td className="p-3">{b.subclass_doubleup}</td>
                    <td className="p-3">{b.subclass_homeless}</td>
                    <td className="p-3 font-semibold text-emerald-800 bg-emerald-50">{b.points}</td>
                    <td className="p-3"><Link className="px-3 py-1 border rounded text-sm text-emerald-800 hover:bg-emerald-50" href={`/admin/beneficiaries/${b.survey_id}`}>View Details</Link></td>
                  </tr>
                ))}
                {!affiliated.data.length && <tr><td className="p-3" colSpan="10">No affiliated beneficiaries found.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            {pages(affiliated.total, affiliated.per_page).map(i => (
              <button key={i} onClick={() => fetchAffiliated(i, searchAffiliated, affType)} className={`px-3 py-1 rounded border ${affiliated.page === i ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-gray-100'}`}>{i}</button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
