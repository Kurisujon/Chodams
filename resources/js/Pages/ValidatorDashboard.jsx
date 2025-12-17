import React, { Fragment, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import { Listbox, Transition } from '@headlessui/react'

const perPage = 10

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
            <svg className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
                    `cursor-pointer select-none rounded-xl px-3 py-2 text-xs ${active ? 'bg-emerald-50 text-emerald-900' : 'text-gray-900'}`
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
  const [exportScope, setExportScope] = useState('all')
  const [exportClass, setExportClass] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
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

  async function handleExportBarangay() {
    try {
      const b = (barangayFilter || '').trim()
      if (!b) return
      const params = { barangay: b, scope: exportScope || 'submitted' }
      if (exportClass) params.classification = exportClass
      const res = await axios.get('/validator/api/export/barangay', { params, responseType: 'blob' })
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `barangay-${b.replace(/\s+/g,'_').toLowerCase()}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      console.error('Export failed', e)
    }
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
      <aside className="hidden md:block w-64 flex flex-col flex-shrink-0 bg-white text-gray-700 p-6 border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200"/>
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

      {mobileNavOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)}></div>
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-6 shadow-xl flex flex-col h-full">
            <div className="flex items-center gap-3 mb-8">
              <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200"/>
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
          </div>
        </div>
      )}

      {/* Main */}
      <main className="flex-1 h-screen overflow-y-auto p-6 bg-gray-50">
        <DashboardFade delay={0}>
          <div>
            <div className="md:hidden mb-4 flex items-center justify-between">
              <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              </button>
              <span className="text-sm font-semibold text-emerald-800">Menu</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-9 relative">
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
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search applicants"
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </div>
              <div className="md:col-span-3 flex md:justify-end">
                <Link href="/validator/survey-form" className="px-3 py-3 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700 hover:ring-emerald-400 flex items-center gap-2 shadow-sm">
                  <img src="/icons/assignmenticon.png" alt="New Survey" className="w-5 h-5"/>
                  <span className="text-sm font-medium">New Survey</span>
                </Link>
              </div>
            </div>
          </div>
        </DashboardFade>

        <DashboardFade delay={100}>
          <div className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90">Welcome back, Validator!</div>
                <div className="mt-2 text-xs opacity-85">Today is {new Date().toLocaleDateString()}. You have <span className="font-semibold">{pending}</span> surveys pending submission.</div>
              </div>
            </div>
          </div>
        </DashboardFade>

        {/* Cards */}
        <DashboardFade delay={200}>
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
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l4-4 4 4 4-4 4 4"/><path d="M5 19h14"/></svg>
                </div>
                <div className="mt-4 text-lg font-semibold text-gray-900">Browse by Barangay</div>
                <div className="mt-1 text-xs text-gray-500">Tap to filter and export</div>
              </button>
            </div>
          </section>
        </DashboardFade>

        {showBarangayList && (
          <DashboardFade delay={300}>
            <section className="mt-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-emerald-800 mb-3">Browse by Barangay</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <FilterDropdown
                    label="Barangay"
                    value={barangayFilter}
                    onChange={(v) => {
                      setBarangayFilter(v)
                      setShowTable('survey')
                    }}
                    options={[
                      { value: '', label: 'Select' },
                      ...barangays.map(b => ({ value: b, label: b.replace(/_/g, ' ') })),
                    ]}
                    widthClass="w-56"
                  />

                  <FilterDropdown
                    label="Scope"
                    value={exportScope}
                    onChange={setExportScope}
                    options={[
                      { value: 'submitted', label: 'Submitted' },
                      { value: 'survey', label: 'Surveyed' },
                      { value: 'all', label: 'All' },
                    ]}
                    widthClass="w-44"
                  />

                  <FilterDropdown
                    label="Class"
                    value={exportClass}
                    onChange={setExportClass}
                    options={[
                      { value: '', label: 'All' },
                      { value: 'Displaced', label: 'Displaced' },
                      { value: 'Double-up', label: 'Double-up' },
                      { value: 'Homeless', label: 'Homeless' },
                      { value: 'Upgrading of Land Tenure', label: 'Upgrading of Land Tenure' },
                    ]}
                    widthClass="w-56"
                  />

                  <button
                    type="button"
                    onClick={handleExportBarangay}
                    disabled={!barangayFilter}
                    className={`inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-medium text-emerald-800 shadow-sm ring-1 ring-gray-200 hover:bg-emerald-50 hover:text-emerald-900 ${
                      !barangayFilter ? 'cursor-not-allowed opacity-50 hover:bg-white hover:text-emerald-800' : ''
                    }`}
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
            </section>
          </DashboardFade>
        )}

        {showTable === 'survey' && (
          <DashboardFade delay={400}>
            <section className="mt-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">List of Applicants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Barangay</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Purok</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Surname</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Classification</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Sub-Class Displaced</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Double Up</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {surveysFinal.map(row => (
                  <tr
                    key={row.survey_id}
                    className="group border-b border-gray-100 last:border-b-0 transition-colors duration-150 hover:bg-emerald-50"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.date_interviewed}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.barangay}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.purok}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-900 font-medium">{row.last_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.classification}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.subclass_displaced || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.subclass_doubleup || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <Link
                          className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                          href={`/validator/survey/${row.survey_id}`}
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
                        <button
                          onClick={() => handleSubmitSurvey(row.survey_id)}
                          className="rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700"
                        >
                          Submit
                        </button>
                      </div>
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
          </DashboardFade>
        )}

        {/* Submitted Table */}
        {showTable === 'submitted' && (
          <DashboardFade delay={400}>
            <section className="mt-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">Submitted Applicants</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Barangay</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Purok</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Surname</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Classification</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Sub-Class Displaced</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Double Up</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {submittedFiltered.map(row => (
                  <tr
                    key={row.survey_id}
                    className="group border-b border-gray-100 last:border-b-0 transition-colors duration-150 hover:bg-emerald-50"
                  >
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.date_interviewed}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.barangay}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.purok}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-900 font-medium">{row.last_name}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.classification}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.subclass_displaced || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-gray-700">{row.subclass_doubleup || <span className="text-gray-400">—</span>}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <Link
                        className="inline-flex items-center gap-2 text-xs font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                        href={`/validator/survey/${row.survey_id}`}
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
          </DashboardFade>
        )}

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
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Barangay</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Purok</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Surname</th>
                      <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wide">Classification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modalRows.map((r, idx) => (
                      <tr
                        key={idx}
                        className="group border-b border-gray-100 last:border-b-0 transition-colors duration-150 hover:bg-emerald-50"
                      >
                        <td className="px-3 py-3 whitespace-nowrap text-gray-700">{r.date_interviewed}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-700">{r.barangay}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-700">{r.purok}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-900 font-medium">{r.last_name}</td>
                        <td className="px-3 py-3 whitespace-nowrap text-gray-700">{r.classification}</td>
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
