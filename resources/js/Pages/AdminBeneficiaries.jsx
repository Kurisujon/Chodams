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

  const pages = (total, perPage) => Array.from({ length: Math.ceil((total || 0) / (perPage || perPageDefault)) }, (_, i) => i + 1)

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 bg-white text-gray-700 p-4 border-r border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">C</div>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <ul className="space-y-1">
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800 cursor-pointer"><Link href="/admin/beneficiaries" className="block">Beneficiaries</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/project-sites" className="block">Project Sites</Link></li>
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
            <h2 className="text-2xl text-emerald-800 font-semibold">Beneficiaries</h2>
            <div className="text-xs text-gray-500">Validated and affiliated lists</div>
          </div>
          <img src="/image/greenlogo1.jpg" alt="logo" className="h-10 w-10 rounded-full object-cover"/>
        </header>

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <form className="flex items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); fetchValidated(1, searchValidated, '', classVal) }}>
            <input className="border border-gray-300 rounded-xl p-2.5 w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search" value={searchValidated} onChange={e=>setSearchValidated(e.target.value)}/>
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
            <input className="border border-gray-300 rounded-xl p-2.5 w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search Affiliated" value={searchAffiliated} onChange={e=>setSearchAffiliated(e.target.value)}/>
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