// resources/js/Pages/AdminBeneficiaries.jsx
import React, { Fragment, useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import { Listbox, Transition } from '@headlessui/react'

const perPageDefault = 10

function FilterDropdown({ label, value, onChange, options, widthClass = 'w-48' }) {
  const selected = options.find(o => o.value === value) || options[0]
  const selectedLabel = selected?.label ?? ''

  return (
    <Listbox value={value} onChange={onChange}>
      {({ open }) => (
        <div className={`relative ${widthClass}`}>
          <Listbox.Button
            type="button"
            className="inline-flex w-full items-center justify-between gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm ring-1 ring-transparent hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className="text-gray-500">{label}</span>
              <span className={`truncate ${value ? 'text-gray-900' : 'text-gray-400'}`}>{selectedLabel}</span>
            </span>
            <svg
              className="h-4 w-4 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              {open ? (
                <path
                  fillRule="evenodd"
                  d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.83l-3.71 3.94a.75.75 0 0 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z"
                  clipRule="evenodd"
                />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              )}
            </svg>
          </Listbox.Button>

          <Transition
            as={Fragment}
            show={open}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Listbox.Options className="absolute left-0 z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
              {options.map((opt, idx) => (
                <Listbox.Option
                  key={`${opt.value ?? 'opt'}-${idx}`}
                  value={opt.value}
                  className={({ active }) =>
                    `cursor-pointer select-none rounded-xl px-3 py-2 text-xs ${
                      active ? 'bg-emerald-50 text-emerald-900' : 'text-gray-900'
                    }`
                  }
                >
                  {({ selected: isSelected }) => (
                    <div className="flex items-center justify-between gap-3">
                      <span className={`truncate ${isSelected ? 'font-medium text-emerald-700' : ''}`}>{opt.label}</span>
                      {isSelected && (
                        <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path
                            fillRule="evenodd"
                            d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.58a1 1 0 0 1-1.43.003L3.29 9.76a1 1 0 1 1 1.42-1.41l3.05 3.07 6.79-6.86a1 1 0 0 1 1.414-.006Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      )}
    </Listbox>
  )
}

function FilterPill({ label, children }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 shadow-sm ring-1 ring-transparent">
      <span className="text-gray-500">{label}</span>
      {children}
    </div>
  )
}

export default function AdminBeneficiaries() {
  const [validated, setValidated] = useState({ data: [], total: 0, page: 1, per_page: perPageDefault })
  const [affiliated, setAffiliated] = useState({ data: [], total: 0, page: 1, per_page: perPageDefault })
  const [mayor, setMayor] = useState({ data: [], total: 0, page: 1, per_page: perPageDefault })
  const [activeTab, setActiveTab] = useState('non')
  const [search, setSearch] = useState('')
<<<<<<< Updated upstream
  // Simplified filters: keep only search and barangay
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [barangayFilter, setBarangayFilter] = useState('')
=======
  const [classFilter, setClassFilter] = useState('')
  const [affType, setAffType] = useState('')
  const [statusFilter, setStatusFilter] = useState('validated')
  const [barangayFilter, setBarangayFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pointsMin, setPointsMin] = useState('')
  const [pointsMax, setPointsMax] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    classFilter: '',
    affType: '',
    statusFilter: 'validated',
    barangayFilter: '',
    dateFrom: '',
    dateTo: '',
    pointsMin: '',
    pointsMax: '',
  })
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const appliedFiltersRef = useRef(appliedFilters)
>>>>>>> Stashed changes
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
    appliedFiltersRef.current = appliedFilters
  }, [appliedFilters])

  useEffect(() => {
<<<<<<< Updated upstream
    const t = setTimeout(() => applyFilters(1), 100)
    return () => clearTimeout(t)
  }, [activeTab, barangayFilter, search])

  async function fetchValidated(page = 1, search = '', barangay = '') {
    try {
      const res = await axios.get('/admin/api/beneficiaries/validated', { params: { page, per_page: validated.per_page, search, barangay } })
=======
    applyFilters(1, appliedFiltersRef.current)
  }, [activeTab])

  useEffect(() => {
    const handle = setTimeout(() => {
      const next = { ...appliedFiltersRef.current, search: search || '' }
      setAppliedFilters(next)
      applyFilters(1, next)
    }, 350)
    return () => clearTimeout(handle)
  }, [search])

  function currentFilters() {
    return {
      search: search || '',
      classFilter: classFilter || '',
      affType: affType || '',
      statusFilter: statusFilter || 'validated',
      barangayFilter: barangayFilter || '',
      dateFrom: dateFrom || '',
      dateTo: dateTo || '',
      pointsMin: pointsMin || '',
      pointsMax: pointsMax || '',
    }
  }

  async function fetchValidated(page = 1, filters) {
    try {
      setLoading(true)
      const res = await axios.get('/admin/api/beneficiaries/validated', {
        params: {
          page,
          per_page: validated.per_page,
          search: filters?.search || '',
          classification: filters?.classFilter || '',
          status: filters?.statusFilter || 'validated',
          barangay: filters?.barangayFilter || '',
          date_from: filters?.dateFrom || '',
          date_to: filters?.dateTo || '',
          points_min: filters?.pointsMin || '',
          points_max: filters?.pointsMax || '',
        },
      })
>>>>>>> Stashed changes
      setValidated({ ...validated, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Validated fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load validated list')
    } finally {
      setLoading(false)
    }
  }


<<<<<<< Updated upstream
  async function fetchAffiliated(page = 1, search = '', barangay = '') {
    try {
      const res = await axios.get('/admin/api/beneficiaries/affiliated', { params: { page, per_page: affiliated.per_page, search, status: 'submitted', barangay } })
=======
  async function fetchAffiliated(page = 1, filters) {
    try {
      setLoading(true)
      const res = await axios.get('/admin/api/beneficiaries/affiliated', {
        params: {
          page,
          per_page: affiliated.per_page,
          search: filters?.search || '',
          affiliation: filters?.affType || '',
          classification: filters?.classFilter || '',
          status: filters?.statusFilter || 'validated',
          barangay: filters?.barangayFilter || '',
          date_from: filters?.dateFrom || '',
          date_to: filters?.dateTo || '',
          points_min: filters?.pointsMin || '',
          points_max: filters?.pointsMax || '',
        },
      })
>>>>>>> Stashed changes
      setAffiliated({ ...affiliated, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Affiliated fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load affiliated list')
    } finally {
      setLoading(false)
    }
  }

<<<<<<< Updated upstream
  async function fetchMayorEndorsed(page = 1, search = '', barangay = '') {
    try {
      const res = await axios.get('/admin/api/beneficiaries/mayor-endorsed', { params: { page, per_page: mayor.per_page, search, barangay } })
=======
  async function fetchMayorEndorsed(page = 1, filters) {
    try {
      setLoading(true)
      const res = await axios.get('/admin/api/beneficiaries/mayor-endorsed', {
        params: {
          page,
          per_page: mayor.per_page,
          search: filters?.search || '',
          classification: filters?.classFilter || '',
          status: filters?.statusFilter || 'validated',
          barangay: filters?.barangayFilter || '',
          date_from: filters?.dateFrom || '',
          date_to: filters?.dateTo || '',
          points_min: filters?.pointsMin || '',
          points_max: filters?.pointsMax || '',
        },
      })
>>>>>>> Stashed changes
      setMayor({ ...mayor, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Mayor-endorsed fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load mayor-endorsed list')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportValidated() {
    try {
<<<<<<< Updated upstream
      const params = {}
      if (search) params.search = search
      if (barangayFilter) params.barangay = barangayFilter
      const res = await axios.get('/admin/api/beneficiaries/validated/export', { params, responseType: 'blob' })
=======
      const f = currentFilters()
      const b = (f.barangayFilter || '').trim()
      if (!b) {
        setError('Please select a barangay to export')
        return
      }
      const params = {
        barangay: b,
        status: f.statusFilter || 'validated',
        classification: f.classFilter || '',
        date_from: f.dateFrom || '',
        date_to: f.dateTo || '',
        points_min: f.pointsMin || '',
        points_max: f.pointsMax || '',
      }
      const res = await axios.get('/admin/api/export/barangay', { params, responseType: 'blob' })
>>>>>>> Stashed changes
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
<<<<<<< Updated upstream
      const params = { status: 'submitted' }
      if (search) params.search = search
      if (barangayFilter) params.barangay = barangayFilter
=======
      const f = currentFilters()
      const params = {
        status: f.statusFilter || 'validated',
        search: f.search || '',
        affiliation: f.affType || '',
        classification: f.classFilter || '',
        barangay: f.barangayFilter || '',
        date_from: f.dateFrom || '',
        date_to: f.dateTo || '',
        points_min: f.pointsMin || '',
        points_max: f.pointsMax || '',
      }
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
  function applyFilters(page = 1, filters = appliedFiltersRef.current, commit = false) {
    if (commit) {
      setAppliedFilters(filters)
>>>>>>> Stashed changes
    }
    if (activeTab === 'non') {
      fetchValidated(page, filters)
    } else if (activeTab === 'aff') {
      fetchAffiliated(page, filters)
    } else {
      fetchMayorEndorsed(page, filters)
    }
  }

  function clearAll() {
    setSearch('')
    setClassFilter('')
    setAffType('')
    setStatusFilter('validated')
    setBarangayFilter('')
    setDateFrom('')
    setDateTo('')
    setPointsMin('')
    setPointsMax('')
    const next = {
      search: '',
      classFilter: '',
      affType: '',
      statusFilter: 'validated',
      barangayFilter: '',
      dateFrom: '',
      dateTo: '',
      pointsMin: '',
      pointsMax: '',
    }
    setAppliedFilters(next)
    applyFilters(1, next)
  }

  function removeChip(key) {
    const next = { ...appliedFilters }
    if (key === 'search') {
      setSearch('')
      next.search = ''
    }
    if (key === 'classFilter') {
      setClassFilter('')
      next.classFilter = ''
    }
    if (key === 'affType') {
      setAffType('')
      next.affType = ''
    }
    if (key === 'statusFilter') {
      setStatusFilter('validated')
      next.statusFilter = 'validated'
    }
    if (key === 'barangayFilter') {
      setBarangayFilter('')
      next.barangayFilter = ''
    }
    if (key === 'dateRange') {
      setDateFrom('')
      setDateTo('')
      next.dateFrom = ''
      next.dateTo = ''
    }
    if (key === 'pointsRange') {
      setPointsMin('')
      setPointsMax('')
      next.pointsMin = ''
      next.pointsMax = ''
    }
    setAppliedFilters(next)
    applyFilters(1, next)
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
        <DashboardFade delay={0}>
          <div className="md:hidden mb-4 flex items-center justify-between">
            <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="text-sm font-semibold text-emerald-800">Menu</span>
          </div>
        </DashboardFade>
        <DashboardFade delay={100}>
          {error && <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        </DashboardFade>
        <DashboardFade delay={200}>
          <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Hello Admin!</div>
              <h2 className="text-2xl text-emerald-800 font-semibold">Beneficiaries</h2>
              <div className="text-xs text-gray-500">Validated and affiliated lists</div>
            </div>
            <img src="/image/greenlogo1.jpg" alt="logo" className="h-10 w-10 rounded-full object-cover"/>
          </header>
        </DashboardFade>

        <DashboardFade delay={300}>
          <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex rounded-full bg-gray-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('non')}
                  className={`px-4 py-2 rounded-full text-xs font-medium ${
                    activeTab === 'non'
                      ? 'bg-white shadow text-emerald-700'
                      : 'text-gray-600 hover:text-emerald-700'
                  }`}
                >
                  Non-affiliated
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('aff')}
                  className={`px-4 py-2 rounded-full text-xs font-medium ${
                    activeTab === 'aff'
                      ? 'bg-white shadow text-emerald-700'
                      : 'text-gray-600 hover:text-emerald-700'
                  }`}
                >
                  Affiliated
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('mayor')}
                  className={`px-4 py-2 rounded-full text-xs font-medium ${
                    activeTab === 'mayor'
                      ? 'bg-white shadow text-emerald-700'
                      : 'text-gray-600 hover:text-emerald-700'
                  }`}
                >
                  Mayor-endorsed
                </button>
              </div>
              <div className="flex items-center gap-2">
                {loading && <span className="text-xs font-medium text-gray-500">Loading…</span>}
                <button
                  type="button"
                  onClick={() => {
                    const f = currentFilters()
                    setAppliedFilters(f)
                    if (activeTab === 'aff') {
                      handleExportAffiliated()
                    } else {
                      handleExportBarangay()
                    }
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-emerald-800 shadow-sm ring-1 ring-gray-200 hover:bg-emerald-50 hover:text-emerald-900"
                >
                  <svg
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                    <path d="M7 10l5 5 5-5" />
                    <path d="M12 15V3" />
                  </svg>
                  <span>Export CSV</span>
                </button>
              </div>
            </div>
<<<<<<< Updated upstream
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
=======

            <form
              className="flex flex-wrap items-center gap-3"
              onSubmit={e => {
                e.preventDefault()
                const f = currentFilters()
                setAppliedFilters(f)
                applyFilters(1, f)
              }}
            >
              <div className="flex-1 min-w-[220px]">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                    <svg
                      className="h-4 w-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.3-4.3" />
                    </svg>
                  </span>
                  <input
                    className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    placeholder="Search beneficiaries"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <FilterDropdown
                  label="Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={[
                    { value: 'submitted', label: 'Submitted' },
                    { value: 'validated', label: 'Validated' },
                    { value: 'approved', label: 'Approved' },
                  ]}
                  widthClass="w-40"
                />

                <FilterDropdown
                  label="Barangay"
                  value={barangayFilter}
                  onChange={setBarangayFilter}
                  options={[
                    { value: '', label: 'All' },
                    ...barangays.map(b => ({ value: b, label: b.replace(/_/g, ' ') })),
                  ]}
                  widthClass="w-48"
                />

                <FilterDropdown
                  label="Classification"
                  value={classFilter}
                  onChange={setClassFilter}
                  options={[
                    { value: '', label: 'All' },
                    { value: 'Displaced', label: 'Displaced' },
                    { value: 'Double-up', label: 'Double-up' },
                    { value: 'Homeless', label: 'Homeless' },
                    { value: 'Upgrading of Land Tenure', label: 'Upgrading of Land Tenure' },
                  ]}
                  widthClass="w-56"
                />

                {activeTab === 'aff' && (
                  <FilterDropdown
                    label="Affiliation"
                    value={affType}
                    onChange={setAffType}
                    options={[
                      { value: '', label: 'All' },
                      { value: 'SSS', label: 'SSS' },
                      { value: 'GSIS', label: 'GSIS' },
                      { value: 'PhilHealth', label: 'PhilHealth' },
                      { value: 'PagIbig', label: 'PagIbig' },
                      { value: 'PWD', label: 'PWD' },
                      { value: 'Senior_Citizen', label: 'Senior Citizen' },
                      { value: 'Solo_Parent', label: 'Solo Parent' },
                      { value: '4Ps', label: '4Ps' },
                    ]}
                    widthClass="w-48"
                  />
                )}

                <button
                  type="button"
                  onClick={() => setAdvancedOpen(v => !v)}
                  className="text-xs font-medium text-emerald-800 hover:text-emerald-900"
                >
                  {advancedOpen ? 'Hide Advanced' : 'Advanced'}
                </button>

                <button
                  className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700"
                  type="submit"
                >
                  Apply
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-gray-500 hover:text-emerald-700"
                  onClick={clearAll}
                >
                  Clear all
                </button>
              </div>
            </form>

            {advancedOpen && (
              <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <FilterPill label="Date">
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      className="bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      value={dateFrom}
                      onChange={e => setDateFrom(e.target.value)}
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="date"
                      className="bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      value={dateTo}
                      onChange={e => setDateTo(e.target.value)}
                    />
                  </div>
                </FilterPill>

                <FilterPill label="Points">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-16 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      value={pointsMin}
                      onChange={e => setPointsMin(e.target.value)}
                      placeholder="Min"
                    />
                    <span className="text-gray-400">to</span>
                    <input
                      type="number"
                      className="w-16 bg-transparent text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none"
                      value={pointsMax}
                      onChange={e => setPointsMax(e.target.value)}
                      placeholder="Max"
                    />
                  </div>
                </FilterPill>
              </div>
            )}

            {(appliedFilters.search ||
              appliedFilters.classFilter ||
              appliedFilters.affType ||
              appliedFilters.statusFilter !== 'validated' ||
              appliedFilters.barangayFilter ||
              appliedFilters.dateFrom ||
              appliedFilters.dateTo ||
              appliedFilters.pointsMin ||
              appliedFilters.pointsMax) && (
              <div className="flex flex-wrap items-center gap-2">
                {appliedFilters.search && (
                  <button
                    type="button"
                    onClick={() => removeChip('search')}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>Search: {appliedFilters.search}</span>
                    <span className="text-emerald-700">×</span>
                  </button>
                )}
                {appliedFilters.classFilter && (
                  <button
                    type="button"
                    onClick={() => removeChip('classFilter')}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>Classification: {appliedFilters.classFilter}</span>
                    <span className="text-emerald-700">×</span>
                  </button>
                )}
                {activeTab === 'aff' && appliedFilters.affType && (
                  <button
                    type="button"
                    onClick={() => removeChip('affType')}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>Affiliation: {String(appliedFilters.affType).replace(/_/g, ' ')}</span>
                    <span className="text-emerald-700">×</span>
                  </button>
                )}
                {appliedFilters.statusFilter !== 'validated' && (
                  <button
                    type="button"
                    onClick={() => removeChip('statusFilter')}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>Status: {appliedFilters.statusFilter}</span>
                    <span className="text-emerald-700">×</span>
                  </button>
                )}
                {appliedFilters.barangayFilter && (
                  <button
                    type="button"
                    onClick={() => removeChip('barangayFilter')}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>Barangay: {String(appliedFilters.barangayFilter).replace(/_/g, ' ')}</span>
                    <span className="text-emerald-700">×</span>
                  </button>
                )}
                {(appliedFilters.dateFrom || appliedFilters.dateTo) && (
                  <button
                    type="button"
                    onClick={() => removeChip('dateRange')}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>Date: {appliedFilters.dateFrom || '…'}–{appliedFilters.dateTo || '…'}</span>
                    <span className="text-emerald-700">×</span>
                  </button>
                )}
                {(appliedFilters.pointsMin || appliedFilters.pointsMax) && (
                  <button
                    type="button"
                    onClick={() => removeChip('pointsRange')}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 hover:bg-emerald-100"
                  >
                    <span>Points: {appliedFilters.pointsMin || '…'}–{appliedFilters.pointsMax || '…'}</span>
                    <span className="text-emerald-700">×</span>
                  </button>
                )}
              </div>
            )}
          </div>
>>>>>>> Stashed changes
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">{activeTab === 'non' ? 'Validated Beneficiaries (Non-affiliated)' : activeTab === 'aff' ? 'Affiliated Beneficiaries' : 'Mayor-Endorsed Beneficiaries'}</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Barangay</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Surname</th>
                  {activeTab === 'aff' && (
                    <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                      Affiliation
                    </th>
                  )}
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Classification
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Sub-Class Displaced
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Sub-Class Double Up
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Sub-Class Homeless
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Points</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'non' ? validated.data : activeTab === 'aff' ? affiliated.data : mayor.data).map(b => (
<<<<<<< Updated upstream
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
=======
                  <tr
                    key={b.survey_id}
                    className="group border-b border-gray-100 last:border-b-0 transition-colors duration-150 hover:bg-emerald-50"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{b.date_interviewed}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{b.barangay}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-900 font-medium">{b.last_name}</td>
                    {activeTab === 'aff' && (
                      <td className="px-3 py-3 whitespace-nowrap text-gray-700">
                        {b.affiliation || <span className="text-gray-400">—</span>}
                      </td>
                    )}
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{b.classification}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">
                      {b.subclass_displaced || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">
                      {b.subclass_doubleup || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">
                      {b.subclass_homeless || <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {b.points}%
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link
                        className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                        href={`/admin/beneficiaries/${b.survey_id}`}
                      >
                        <span>View</span>
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </Link>
                    </td>
>>>>>>> Stashed changes
                  </tr>
                ))}
                {!((activeTab === 'non' ? validated.data.length : activeTab === 'aff' ? affiliated.data.length : mayor.data.length)) && (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-sm text-gray-500"
                      colSpan={activeTab === 'aff' ? 11 : 10}
                    >
                      No results found.
                    </td>
                  </tr>
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
