// resources/js/Pages/AdminRevocations.jsx
import React, { Fragment, useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import { Listbox, Transition } from '@headlessui/react'
import { AdminSidebarWrapper } from '../Components/AdminSidebar'

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
                <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 0 1-1.06-.02L10 8.83l-3.71 3.94a.75.75 0 0 1-1.08-1.04l4.25-4.5a.75.75 0 0 1 1.08 0l4.25 4.5a.75.75 0 0 1-.02 1.06Z" clipRule="evenodd" />
              ) : (
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" clipRule="evenodd" />
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
                          <path fillRule="evenodd" d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.5 7.58a1 1 0 0 1-1.43.003L3.29 9.76a1 1 0 1 1 1.42-1.41l3.05 3.07 6.79-6.86a1 1 0 0 1 1.414-.006Z" clipRule="evenodd" />
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

export default function AdminRevocations() {
  // State for revocation list
  const [revocations, setRevocations] = useState({ data: [], total: 0, current_page: 1, per_page: 15 })
  const [projects, setProjects] = useState([])
  const [violationReasons, setViolationReasons] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Filter state
  const [projectFilter, setProjectFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [search, setSearch] = useState('')

  // State for create modal
  const [showModal, setShowModal] = useState(false)
  const [beneficiaries, setBeneficiaries] = useState([])
  const [beneficiarySearch, setBeneficiarySearch] = useState('')
  const [beneficiaryProjectFilter, setBeneficiaryProjectFilter] = useState('') // Filter for beneficiary list
  const [beneficiaryLoading, setBeneficiaryLoading] = useState(false)
  const [formData, setFormData] = useState({
    survey_id: '',
    project_id: '',
    lot_info: '',
    violation_reasons: [],
    remarks: '',
    documentation: null,
  })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null)

  // State for detail view
  const [showDetail, setShowDetail] = useState(false)
  const [selectedRevocation, setSelectedRevocation] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  // Fetch revocations on mount and when filters change
  useEffect(() => {
    fetchRevocations()
  }, [projectFilter, dateFrom, dateTo])

  // Debounced search
  useEffect(() => {
    const handle = setTimeout(() => {
      fetchRevocations(1)
    }, 350)
    return () => clearTimeout(handle)
  }, [search])

  async function fetchRevocations(page = 1) {
    try {
      setLoading(true)
      const res = await axios.get('/admin/api/revocations', {
        params: {
          page,
          per_page: revocations.per_page,
          project_id: projectFilter || '',
          date_from: dateFrom || '',
          date_to: dateTo || '',
          search: search || '',
        },
      })
      setRevocations(res.data.revocations)
      setProjects(res.data.projects || [])
      setViolationReasons(res.data.violation_reasons || {})
      setError('')
    } catch (err) {
      console.error('Revocations fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load revocations')
    } finally {
      setLoading(false)
    }
  }

  async function fetchBeneficiaries(searchTerm = '', projectId = '') {
    try {
      setBeneficiaryLoading(true)
      const res = await axios.get('/admin/api/beneficiaries/assigned', {
        params: {
          search: searchTerm,
          project_id: projectId,
          per_page: 20,
        },
      })
      setBeneficiaries(res.data.data || [])
    } catch (err) {
      console.error('Beneficiaries fetch failed', err)
    } finally {
      setBeneficiaryLoading(false)
    }
  }

  async function fetchRevocationDetail(id) {
    try {
      setDetailLoading(true)
      const res = await axios.get(`/admin/api/revocations/${id}`)
      setSelectedRevocation(res.data.revocation)
      setShowDetail(true)
    } catch (err) {
      console.error('Revocation detail fetch failed', err)
      setError(err?.response?.data?.message || 'Failed to load revocation details')
    } finally {
      setDetailLoading(false)
    }
  }

  // Project filter options
  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map(p => ({ value: String(p.project_id), label: p.project_name }))
  ]

  // Pagination
  const totalPages = Math.ceil((revocations.total || 0) / (revocations.per_page || 15))
  const currentPage = revocations.current_page || 1

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      fetchRevocations(page)
    }
  }

  // ==================== REVOCATION FORM HANDLERS ====================

  function openCreateModal() {
    setFormData({
      survey_id: '',
      project_id: '',
      lot_info: '',
      violation_reasons: [],
      remarks: '',
      documentation: null,
    })
    setFormErrors({})
    setSelectedBeneficiary(null)
    setBeneficiarySearch('')
    setBeneficiaryProjectFilter('')
    setBeneficiaries([])
    setShowModal(true)
    fetchBeneficiaries('', '')
  }

  function handleBeneficiarySelect(beneficiary) {
    setSelectedBeneficiary(beneficiary)
    // Auto-populate lot info from assignment data
    const lotInfo = beneficiary.assignment 
      ? `${beneficiary.assignment.project_name} - Block ${beneficiary.assignment.block_no}, Lot ${beneficiary.assignment.lot_no}`
      : ''
    setFormData(prev => ({
      ...prev,
      survey_id: beneficiary.survey_id,
      project_id: beneficiary.assignment?.project_id || beneficiary.project_id || '',
      lot_info: lotInfo,
    }))
  }

  function handleViolationReasonToggle(code) {
    setFormData(prev => {
      const reasons = prev.violation_reasons.includes(code)
        ? prev.violation_reasons.filter(r => r !== code)
        : [...prev.violation_reasons, code]
      return { ...prev, violation_reasons: reasons }
    })
  }

  async function handleSaveRevocation(e) {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})

    try {
      const fd = new FormData()
      fd.append('survey_id', formData.survey_id)
      if (formData.project_id) fd.append('project_id', formData.project_id)
      if (formData.lot_info) fd.append('lot_info', formData.lot_info)
      formData.violation_reasons.forEach(reason => {
        fd.append('violation_reasons[]', reason)
      })
      if (formData.remarks) fd.append('remarks', formData.remarks)
      if (formData.documentation) fd.append('documentation', formData.documentation)

      const res = await axios.post('/admin/api/revocations', fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-CSRF-TOKEN': csrf() },
      })

      if (res.data.success) {
        setShowModal(false)
        fetchRevocations(currentPage)
      }
    } catch (err) {
      console.error('Revocation save failed', err)
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors)
      } else {
        setFormErrors({ general: err.response?.data?.message || 'Failed to record revocation' })
      }
    } finally {
      setSaving(false)
    }
  }

  // ==================== HELPER FUNCTIONS ====================

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function getViolationReasonLabel(code) {
    return violationReasons[code] || code
  }

  function getBeneficiaryName(beneficiary) {
    if (!beneficiary) return 'Unknown'
    // Try to get name from demographic data (different structures)
    if (beneficiary.demographic?.first_name) {
      return `${beneficiary.demographic.first_name} ${beneficiary.demographic.last_name || ''}`.trim()
    }
    // Direct properties (from assigned beneficiaries list)
    if (beneficiary.first_name) {
      return `${beneficiary.first_name} ${beneficiary.last_name || ''}`.trim()
    }
    return `Survey #${beneficiary.survey_id}`
  }


  // ==================== RENDER ====================

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <AdminSidebarWrapper
        mobileNavOpen={mobileNavOpen}
        setMobileNavOpen={setMobileNavOpen}
        onLogout={logoutAdmin}
      />

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 bg-gray-50">
        <DashboardFade delay={0}>
          <div className="md:hidden mb-4 flex items-center justify-between">
            <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
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
              <h2 className="text-2xl text-emerald-800 font-semibold">Lot Revocations</h2>
              <div className="text-xs text-gray-500">Track and manage lot revocations</div>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Record Revocation
            </button>
          </header>
        </DashboardFade>


        {/* Revocation List Section */}
        <DashboardFade delay={300}>
          <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search by name, barangay, or lot info..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <FilterDropdown
                    label="Project:"
                    value={projectFilter}
                    onChange={setProjectFilter}
                    options={projectOptions}
                    widthClass="w-48"
                  />
                </div>
              </div>
              
              {/* Date Range Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">From:</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-500">To:</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => { setDateFrom(''); setDateTo(''); }}
                    className="text-xs text-gray-500 hover:text-red-600"
                  >
                    Clear dates
                  </button>
                )}
              </div>
            </div>

            {/* Revocations Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiary</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barangay</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project / Lot</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Violation Reasons</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">Loading...</td>
                    </tr>
                  ) : revocations.data?.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-gray-500">No revocations found</td>
                    </tr>
                  ) : (
                    revocations.data?.map((revocation) => (
                      <tr key={revocation.revocation_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {getBeneficiaryName(revocation.survey)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {revocation.survey?.demographic?.barangay?.replace(/_/g, ' ') || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {revocation.project?.project_name || '—'}
                          {revocation.lot_info && <div className="text-xs text-gray-500">{revocation.lot_info}</div>}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-1">
                            {revocation.violation_reasons?.slice(0, 2).map((code) => (
                              <span
                                key={code}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"
                                title={getViolationReasonLabel(code)}
                              >
                                {code}
                              </span>
                            ))}
                            {revocation.violation_reasons?.length > 2 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                +{revocation.violation_reasons.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {formatDate(revocation.revoked_at)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <button
                            onClick={() => fetchRevocationDetail(revocation.revocation_id)}
                            className="text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * revocations.per_page) + 1} to {Math.min(currentPage * revocations.per_page, revocations.total)} of {revocations.total} results
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </DashboardFade>


        {/* Create Revocation Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30" onClick={() => setShowModal(false)}></div>
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Record Lot Revocation</h3>
                    <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveRevocation} className="p-6 space-y-6">
                  {formErrors.general && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      {formErrors.general}
                    </div>
                  )}

                  {/* Beneficiary Selection with Project Filter */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">Select Beneficiary *</label>
                      <select
                        value={beneficiaryProjectFilter}
                        onChange={(e) => {
                          setBeneficiaryProjectFilter(e.target.value)
                          fetchBeneficiaries(beneficiarySearch, e.target.value)
                        }}
                        className="rounded-lg border border-gray-200 bg-white py-1.5 px-3 text-xs text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      >
                        <option value="">All Project Sites</option>
                        {projects.map((p) => (
                          <option key={p.project_id} value={p.project_id}>
                            {p.project_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedBeneficiary ? (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-200">
                        <div>
                          <div className="font-medium text-gray-900">{getBeneficiaryName(selectedBeneficiary)}</div>
                          <div className="text-sm text-gray-500">
                            {selectedBeneficiary.demographic?.barangay?.replace(/_/g, ' ') || selectedBeneficiary.barangay?.replace(/_/g, ' ') || ''}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBeneficiary(null)
                            setFormData(prev => ({ ...prev, survey_id: '', project_id: '', lot_info: '' }))
                          }}
                          className="text-gray-400 hover:text-red-600"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="relative mb-2">
                          <input
                            type="text"
                            placeholder="Search beneficiaries..."
                            value={beneficiarySearch}
                            onChange={(e) => {
                              setBeneficiarySearch(e.target.value)
                              fetchBeneficiaries(e.target.value, beneficiaryProjectFilter)
                            }}
                            className="w-full rounded-xl border border-gray-200 bg-white py-2 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                          />
                        </div>
                        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-xl">
                          {beneficiaryLoading ? (
                            <div className="p-3 text-center text-gray-500 text-sm">Loading...</div>
                          ) : beneficiaries.length === 0 ? (
                            <div className="p-3 text-center text-gray-500 text-sm">No beneficiaries found</div>
                          ) : (
                            beneficiaries.map((b) => (
                              <button
                                key={b.survey_id}
                                type="button"
                                onClick={() => handleBeneficiarySelect(b)}
                                className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{getBeneficiaryName(b)}</div>
                                <div className="text-xs text-gray-500">
                                  {b.demographic?.barangay?.replace(/_/g, ' ') || b.barangay?.replace(/_/g, ' ') || ''}
                                  {b.assignment && (
                                    <span className="ml-2 text-emerald-600">
                                      • {b.assignment.project_name} - Block {b.assignment.block_no}, Lot {b.assignment.lot_no}
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                    {formErrors.survey_id && <p className="mt-1 text-sm text-red-600">{formErrors.survey_id[0]}</p>}
                  </div>

                  {/* Lot Info - Auto-populated from assignment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Lot Information</label>
                    <input
                      type="text"
                      value={formData.lot_info}
                      readOnly
                      placeholder="Select a beneficiary to auto-populate"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 px-4 text-sm text-gray-900 placeholder-gray-400 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Auto-populated from beneficiary's assignment</p>
                    {formErrors.lot_info && <p className="mt-1 text-sm text-red-600">{formErrors.lot_info[0]}</p>}
                  </div>

                  {/* Violation Reasons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Violation Reasons * (Select at least one)</label>
                    <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-xl p-3">
                      {Object.entries(violationReasons).map(([code, description]) => (
                        <label
                          key={code}
                          className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                            formData.violation_reasons.includes(code) ? 'bg-red-50 border border-red-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.violation_reasons.includes(code)}
                            onChange={() => handleViolationReasonToggle(code)}
                            className="mt-1 h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                          />
                          <div>
                            <span className="font-medium text-gray-900">{code}:</span>
                            <span className="ml-1 text-gray-600">{description}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                    {formErrors.violation_reasons && <p className="mt-1 text-sm text-red-600">{formErrors.violation_reasons[0]}</p>}
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                      rows={3}
                      placeholder="Additional notes or details about the revocation..."
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 px-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                    {formErrors.remarks && <p className="mt-1 text-sm text-red-600">{formErrors.remarks[0]}</p>}
                  </div>

                  {/* Documentation Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documentation</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setFormData(prev => ({ ...prev, documentation: e.target.files[0] || null }))}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                    />
                    <p className="mt-1 text-xs text-gray-500">Accepted formats: PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                    {formErrors.documentation && <p className="mt-1 text-sm text-red-600">{formErrors.documentation[0]}</p>}
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving || !formData.survey_id || formData.violation_reasons.length === 0}
                      className="px-4 py-2 rounded-xl bg-red-600 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Recording...' : 'Record Revocation'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}


        {/* Revocation Detail Modal */}
        {showDetail && selectedRevocation && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-black/30" onClick={() => { setShowDetail(false); setSelectedRevocation(null); }}></div>
              <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Revocation Details</h3>
                    <button onClick={() => { setShowDetail(false); setSelectedRevocation(null); }} className="text-gray-400 hover:text-gray-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {detailLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : (
                    <>
                      {/* Beneficiary Info */}
                      <div className="bg-gray-50 rounded-xl p-4">
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Beneficiary Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-500">Name</div>
                            <div className="font-medium text-gray-900">{getBeneficiaryName(selectedRevocation.survey)}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Barangay</div>
                            <div className="font-medium text-gray-900">
                              {selectedRevocation.survey?.demographic?.barangay?.replace(/_/g, ' ') || '—'}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Lot Information</div>
                            <div className="font-medium text-gray-900">{selectedRevocation.lot_info || '—'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Project Site</div>
                            <div className="font-medium text-gray-900">{selectedRevocation.project?.project_name || '—'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Violation Reasons */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Violation Reasons</h4>
                        <div className="space-y-2">
                          {selectedRevocation.violation_reasons?.map((code) => (
                            <div key={code} className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-200 text-red-800">
                                {code}
                              </span>
                              <span className="text-sm text-gray-700">{getViolationReasonLabel(code)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Remarks */}
                      {selectedRevocation.remarks && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Remarks</h4>
                          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-700">
                            {selectedRevocation.remarks}
                          </div>
                        </div>
                      )}

                      {/* Documentation */}
                      {selectedRevocation.documentation_path && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-2">Documentation</h4>
                          <a
                            href={`/admin/api/revocations/${selectedRevocation.revocation_id}/documentation`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm text-gray-700 hover:bg-gray-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download Documentation
                          </a>
                        </div>
                      )}

                      {/* Audit Info */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <div className="text-xs text-gray-500">Revoked By</div>
                            <div className="text-gray-900">{selectedRevocation.revoked_by_user?.name || 'Admin'}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Revocation Date</div>
                            <div className="text-gray-900">{formatDateTime(selectedRevocation.revoked_at)}</div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
                  <button
                    onClick={() => { setShowDetail(false); setSelectedRevocation(null); }}
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
