// resources/js/Pages/AdminBeneficiaries.jsx
import React, { Fragment, useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import { Listbox, Transition } from '@headlessui/react'
import { AdminSidebarWrapper } from '../Components/AdminSidebar'

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
  const [classFilter, setClassFilter] = useState('')
  const [affType, setAffType] = useState('')
  const [statusFilter, setStatusFilter] = useState('submitted')
  const [barangayFilter, setBarangayFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [pointsMin, setPointsMin] = useState('')
  const [pointsMax, setPointsMax] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(true)
  const [loading, setLoading] = useState(false)
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    classFilter: '',
    affType: '',
    statusFilter: 'submitted',
    barangayFilter: '',
    dateFrom: '',
    dateTo: '',
    pointsMin: '',
    pointsMax: '',
  })
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const appliedFiltersRef = useRef(appliedFilters)
  
  // Format priority score with one decimal place and % suffix
  const formatScore = (score) => {
    if (score === null || score === undefined) return '0.0%'
    return `${parseFloat(score).toFixed(1)}%`
  }
  const barangays = [
    'Aplaya','Balabag','Binaton','Cogon','Colorado','Dawis','Dulangan','Goma','Igpit','Kapatagan','Kiagot','Lungag','Mahayahay','Matti','Ruparan','San_Agustin','San_Jose','San_Miguel','San_Roque','Sinawilan','Soong','Tiguman','Tres_De_Mayo','Zone_I','Zone_II','Zone_III'
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

  // Auto-apply filters when they change
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = {
        ...appliedFiltersRef.current,
        classFilter: classFilter || '',
        affType: affType || '',
        statusFilter: statusFilter || 'submitted',
        barangayFilter: barangayFilter || '',
        dateFrom: dateFrom || '',
        dateTo: dateTo || '',
        pointsMin: pointsMin || '',
        pointsMax: pointsMax || '',
      }
      setAppliedFilters(next)
      applyFilters(1, next)
    }, 300)
    return () => clearTimeout(handle)
  }, [classFilter, affType, statusFilter, barangayFilter, dateFrom, dateTo, pointsMin, pointsMax])

  function currentFilters() {
    return {
      search: search || '',
      classFilter: classFilter || '',
      affType: affType || '',
      statusFilter: statusFilter || 'submitted',
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
      setValidated({ ...validated, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Validated fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load validated list')
    } finally {
      setLoading(false)
    }
  }


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
      setAffiliated({ ...affiliated, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Affiliated fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load affiliated list')
    } finally {
      setLoading(false)
    }
  }

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
      setMayor({ ...mayor, ...res.data, page })
      setError('')
    } catch (err) {
      console.error('Mayor-endorsed fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load mayor-endorsed list')
    } finally {
      setLoading(false)
    }
  }

  async function handleExportBarangay() {
    try {
      const f = currentFilters()
      const params = {
        search: f.search || '',
        status: f.statusFilter || 'validated',
        classification: f.classFilter || '',
        barangay: f.barangayFilter || '',
        date_from: f.dateFrom || '',
        date_to: f.dateTo || '',
        points_min: f.pointsMin || '',
        points_max: f.pointsMax || '',
      }

      let apiUrl = ''
      let filename = 'beneficiaries.csv'
      if (activeTab === 'non') {
        apiUrl = '/admin/api/beneficiaries/validated/export'
        filename = 'validated_beneficiaries.csv'
      } else if (activeTab === 'mayor') {
        apiUrl = '/admin/api/beneficiaries/mayor-endorsed/export'
        filename = 'mayor_endorsed_beneficiaries.csv'
      } else {
        apiUrl = '/admin/api/export/barangay'
        const b = (params.barangay || '').trim()
        if (!b) {
          setError('Please select a barangay to export')
          return
        }
        filename = `barangay-${b.replace(/\s+/g, '_').toLowerCase()}.csv`
      }

      const res = await axios.get(apiUrl, { params, responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
      setError('')
    } catch (err) {
      console.error('Export failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to export CSV')
    }
  }

  async function handleExportAffiliated() {
    try {
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

  function applyFilters(page = 1, filters = appliedFiltersRef.current, commit = false) {
    if (commit) {
      setAppliedFilters(filters)
    }
    if (activeTab === 'non') {
      fetchValidated(page, filters)
    } else {
      fetchAffiliated(page, filters)
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

  const getPageNumbers = () => {
    const total = activeTab === 'non' ? validated.total : affiliated.total;
    const perPage = activeTab === 'non' ? validated.per_page : affiliated.per_page;
    const currentPage = activeTab === 'non' ? validated.page : affiliated.page;
    const totalPages = Math.ceil((total || 0) / (perPage || perPageDefault));
    
    const maxButtons = 10;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = startPage + maxButtons - 1;

    if (endPage > totalPages) {
      endPage = totalPages;
      startPage = Math.max(1, endPage - maxButtons + 1);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return { pages, currentPage, totalPages };
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <AdminSidebarWrapper
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        onLogout={logoutAdmin}
      />

      <main className="flex-1 p-4 sm:p-6 bg-gray-50">
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
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Hello Admin!</div>
              <h2 className="text-2xl text-emerald-800 font-semibold">Beneficiaries</h2>
              <div className="text-xs text-gray-500">Validated and affiliated lists</div>
            </div>
            <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200"/>
          </header>
        </DashboardFade>

        <DashboardFade delay={300}>
          <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="inline-flex flex-wrap justify-center rounded-full bg-gray-100 p-1">
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
                {/* <button
                  type="button"
                  onClick={() => setActiveTab('mayor')}
                  className={`px-4 py-2 rounded-full text-xs font-medium ${
                    activeTab === 'mayor'
                      ? 'bg-white shadow text-emerald-700'
                      : 'text-gray-600 hover:text-emerald-700'
                  }`}
                >
                  Mayor-endorsed
                </button> */}
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

            <div className="flex flex-wrap items-center gap-3">
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
                    { value: 'submitted', label: 'All' },
                    { value: 'validated', label: 'Validated' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'assigned', label: 'Assigned' },
                    { value: 'disapproved', label: 'Disapproved' },
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
                  className="text-xs font-medium text-gray-500 hover:text-emerald-700"
                  onClick={clearAll}
                >
                  Clear all
                </button>
              </div>
            </div>

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
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">{activeTab === 'non' ? 'Validated Beneficiaries (Non-affiliated)' : activeTab === 'aff' ? 'Affiliated Beneficiaries' : 'Mayor-Endorsed Beneficiaries'}</h3>
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="min-w-full text-xs sm:text-sm">
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
                  <th 
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide"
                  >
                    Points (Highest to Lowest)
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody key={`${activeTab}-${activeTab === 'non' ? validated.page : activeTab === 'aff' ? affiliated.page : mayor.page}`} className="animate-table-fade">
                {(activeTab === 'non' ? validated.data : activeTab === 'aff' ? affiliated.data : mayor.data)
                  .map(b => (
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
                      <div className="flex items-center gap-2">
                        <Link
                          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
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
                      </div>
                    </td>
                  </tr>
                ))}
                {!((activeTab === 'non' ? validated.data.length : affiliated.data.length)) && (
                  <tr>
                    <td
                      className="px-3 py-6 text-center text-sm text-gray-500"
                      colSpan={activeTab === 'aff' ? 12 : 11}
                    >
                      No results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex flex-wrap justify-center items-center gap-2">
            {(() => {
              const { pages, currentPage, totalPages } = getPageNumbers();
              return (
                <>
                  <button
                    onClick={() => applyFilters(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded border text-emerald-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Prev
                  </button>
                  {pages.map(i => (
                    <button
                      key={i}
                      onClick={() => applyFilters(i)}
                      className={`px-3 py-1 rounded border ${
                        currentPage === i ? 'bg-emerald-600 text-white' : 'text-emerald-700 hover:bg-gray-100'
                      }`}
                    >{i}</button>
                  ))}
                  <button
                    onClick={() => applyFilters(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded border text-emerald-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </>
              );
            })()}
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
