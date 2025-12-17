// resources/js/Pages/AdminProfile.jsx
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import AdminTable from '../Components/AdminTable'

export default function AdminProfile() {
  const [profile, setProfile] = useState(null)
  const [validators, setValidators] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [validatorsPage, setValidatorsPage] = useState(1)
  const [validatorsSortKey, setValidatorsSortKey] = useState('name')
  const [validatorsSortDirection, setValidatorsSortDirection] = useState('asc')

  const validatorsPageSize = 10

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
      setValidatorsPage(1)
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

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  function handleValidatorSort(id) {
    if (validatorsSortKey === id) {
      setValidatorsSortDirection(validatorsSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setValidatorsSortKey(id)
      setValidatorsSortDirection('asc')
    }
    setValidatorsPage(1)
  }

  function getValidatorSortValue(v, key) {
    if (key === 'name') return v.name || ''
    if (key === 'username') return v.username || ''
    if (key === 'email') return v.email || ''
    if (key === 'status') return v.status || ''
    return ''
  }

  const sortedValidators = [...validators].sort((a, b) => {
    const av = getValidatorSortValue(a, validatorsSortKey)
    const bv = getValidatorSortValue(b, validatorsSortKey)
    if (av < bv) return validatorsSortDirection === 'asc' ? -1 : 1
    if (av > bv) return validatorsSortDirection === 'asc' ? 1 : -1
    return 0
  })

  const validatorColumns = [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      render: v => v.name,
      cellClassName: 'text-gray-900 font-medium',
    },
    {
      id: 'username',
      header: 'Username',
      sortable: true,
      render: v => v.username,
    },
    {
      id: 'email',
      header: 'Email',
      sortable: true,
      render: v => v.email,
    },
    {
      id: 'status',
      header: 'Status',
      sortable: true,
      render: v => (
        <span
          className={
            v.status === 'approved'
              ? 'inline-flex rounded-full px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700'
              : 'inline-flex rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-700'
          }
        >
          {v.status}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      sortable: false,
      render: v =>
        v.status === 'deactivated' ? (
          <button
            onClick={() => changeStatus(v.validator_id, 'approved')}
            className="px-3 py-1 border rounded text-sm text-emerald-800 hover:bg-emerald-50"
          >
            Activate
          </button>
        ) : (
          <button
            onClick={() => changeStatus(v.validator_id, 'deactivated')}
            className="px-3 py-1 border rounded text-sm text-red-700 hover:bg-red-50"
          >
            Deactivate
          </button>
        ),
    },
  ]

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
        <DashboardFade delay={0}>
          <div className="md:hidden mb-4 flex items-center justify-between">
            <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="text-sm font-semibold text-emerald-800">Menu</span>
          </div>
        </DashboardFade>

        <DashboardFade delay={100}>
          {error && <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        </DashboardFade>

        <DashboardFade delay={200}>
          <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 p-0 overflow-hidden">
              <div className="grid grid-cols-1 gap-0">
                <div className="bg-gray-100 h-72 md:h-96">
                  <img src="/pics/office.png" alt="office" className="w-full h-full object-cover"/>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-800">Account</h3>
                <Link href="/admin/profile/edit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-sm">Edit Profile</Link>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <div className="text-sm text-gray-500">Username</div>
                  <div className="font-medium text-gray-900">{profile?.username || '-'}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Email</div>
                  <div className="font-medium text-gray-900">{profile?.email || '-'}</div>
                </div>
                <div className="mt-2">
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
                <input className="border border-gray-300 rounded-xl p-2.5 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search" value={search} onChange={e=>setSearch(e.target.value)}/>
                <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit">Search</button>
              </form>
              <AdminTable
                columns={validatorColumns}
                rows={sortedValidators}
                getRowKey={v => v.validator_id}
                page={validatorsPage}
                pageSize={validatorsPageSize}
                onPageChange={setValidatorsPage}
                sortKey={validatorsSortKey}
                sortDirection={validatorsSortDirection}
                onSortChange={handleValidatorSort}
                emptyMessage="No employees found."
              />
            </div>
          </section>
        </DashboardFade>
      </main>
    </div>
  )
}

function DashboardFade({ children, delay = 0 }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-in-out transform motion-reduce:transition-none motion-reduce:transform-none ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}
