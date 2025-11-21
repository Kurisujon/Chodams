// resources/js/Pages/AdminProfile.jsx
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

export default function AdminProfile() {
  const [profile, setProfile] = useState(null)
  const [validators, setValidators] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  useEffect(() => {
    loadProfile()
    loadValidators()
  }, [])

  async function loadProfile() {
    try {
      const res = await axios.get('/admin/api/profile')
      setProfile(res.data.profile)
      setError('')
    } catch (e) {
      setError('Failed to load admin profile.')
    }
  }

  async function loadValidators(q = '') {
    try {
      const res = await axios.get('/admin/api/validators', { params: { search: q } })
      setValidators(res.data.data || [])
      setError('')
    } catch (e) {
      setError('Failed to load validators.')
    }
  }

  async function changeStatus(id, status) {
    try {
      await axios.post(`/admin/api/validators/${id}/status`, { status }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      loadValidators(search)
    } catch (e) {
      setError('Failed to update status.')
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
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/beneficiaries" className="block">Beneficiaries</Link></li>
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800"><Link href="/admin/profile" className="block">Profile</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/about" className="block">About</Link></li>
          <li className="px-2 py-3 rounded hover:bg-red-50 text-red-700 mt-20"><Link href="/admin/logout" method="post" as="button" className="w-full text-left">Log out</Link></li>
        </ul>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">

        {error && <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-0 overflow-hidden">
            <div className="grid grid-cols-1 gap-0">
              <div className="bg-gray-100 h-72 md:h-96">
                <img src={'/image/office.jpg'} alt="office" className="w-full h-full object-cover"/>
              </div>
            </div>
          </div>

          <div className="md:col-span-1 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-emerald-800">Account</h3>
              <Link href="/admin/profile/edit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-sm">Edit Profile</Link>
            </div>
            <div className="flex flex-col items-center text-center">
              <img src={profile?.avatar_url || '/image/greenlogo1.jpg'} alt="avatar" className="w-20 h-20 rounded-full object-cover border"/>
              <div className="mt-3 w-full space-y-2">
                <div>
                  <div className="text-sm text-gray-500">Username</div>
                  <div className="font-medium text-gray-900">{profile?.username || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium text-gray-900">{profile?.email || '-'}</div>
                </div>
              </div>
              <div className="mt-4">
                <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs">Active</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-emerald-800">Validators</h3>
              <Link href="/admin/validators/create" className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-sm">Create</Link>
            </div>
            <form className="flex items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); loadValidators(search) }}>
              <input className="border border-gray-300 rounded-xl p-2.5 w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/>
              <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit">Search</button>
            </form>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-emerald-50 text-emerald-800">
                  <tr>
                    <th className="p-3 text-left">Name</th>
                    <th className="p-3 text-left">Username</th>
                    <th className="p-3 text-left">Email</th>
                    <th className="p-3 text-left">Status</th>
                    <th className="p-3 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {validators.length ? validators.map(v => (
                    <tr key={v.validator_id} className="even:bg-gray-50">
                      <td className="p-3">{v.name}</td>
                      <td className="p-3">{v.username}</td>
                      <td className="p-3">{v.email}</td>
                      <td className="p-3">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${v.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>{v.status}</span>
                      </td>
                      <td className="p-3">
                        {v.status === 'deactivated' ? (
                          <button onClick={() => changeStatus(v.validator_id, 'approved')} className="px-3 py-1 border rounded text-emerald-800 hover:bg-emerald-50">Activate</button>
                        ) : (
                          <button onClick={() => changeStatus(v.validator_id, 'deactivated')} className="px-3 py-1 border rounded text-red-700 hover:bg-red-50">Deactivate</button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td className="p-3" colSpan="5">No employees found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}