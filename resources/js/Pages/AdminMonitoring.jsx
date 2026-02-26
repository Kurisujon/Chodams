// resources/js/Pages/AdminMonitoring.jsx
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

export default function AdminMonitoring() {
  // Tab state
  const [activeTab, setActiveTab] = useState('beneficiary') // 'beneficiary' or 'siteVisits'
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [error, setError] = useState('')

  // ==================== BENEFICIARY MONITORING STATE ====================
  const [beneficiarySearch, setBeneficiarySearch] = useState('')
  const [beneficiaryProjectFilter, setBeneficiaryProjectFilter] = useState('') // Filter for beneficiary list by project
  const [beneficiaryProjects, setBeneficiaryProjects] = useState([]) // Projects list for filter dropdown
  const [beneficiaries, setBeneficiaries] = useState({ data: [], total: 0, current_page: 1, per_page: 10 })
  const [beneficiaryLoading, setBeneficiaryLoading] = useState(false)
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null)
  const [monitoringHistory, setMonitoringHistory] = useState([])
  const [statusOptions, setStatusOptions] = useState({})
  const [showMonitoringModal, setShowMonitoringModal] = useState(false)
  const [monitoringForm, setMonitoringForm] = useState({ visit_date: '', status: '', remarks: '' })
  const [monitoringErrors, setMonitoringErrors] = useState({})
  const [savingMonitoring, setSavingMonitoring] = useState(false)
  const [supportingDocuments, setSupportingDocuments] = useState([])
  const [viewDetailsRecord, setViewDetailsRecord] = useState(null)

  // ==================== SITE VISITS STATE ====================
  const [siteVisits, setSiteVisits] = useState({ data: [], total: 0, current_page: 1, per_page: 10 })
  const [siteVisitsLoading, setSiteVisitsLoading] = useState(false)
  const [projects, setProjects] = useState([])
  const [hoas, setHoas] = useState([])
  const [projectFilter, setProjectFilter] = useState('')
  const [hoaFilter, setHoaFilter] = useState('')
  const [visitStatusFilter, setVisitStatusFilter] = useState('')
  const [dueVisits, setDueVisits] = useState({ projects_due: [], hoas_due: [], total_due: 0 })
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({ project_id: '', hoa_id: '', scheduled_date: '', assigned_staff: '', visit_notes: '' })
  const [scheduleErrors, setScheduleErrors] = useState({})
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [selectedVisit, setSelectedVisit] = useState(null)
  const [completeForm, setCompleteForm] = useState({ visit_notes: '', findings: '' })
  const [savingComplete, setSavingComplete] = useState(false)
  const [adminName, setAdminName] = useState('')

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  // ==================== BENEFICIARY MONITORING FUNCTIONS ====================

  useEffect(() => {
    if (activeTab === 'beneficiary') {
      fetchBeneficiaries()
      fetchBeneficiaryProjects()
    }
  }, [activeTab])

  useEffect(() => {
    const handle = setTimeout(() => {
      if (activeTab === 'beneficiary') {
        fetchBeneficiaries(1, beneficiaryProjectFilter)
      }
    }, 350)
    return () => clearTimeout(handle)
  }, [beneficiarySearch])

  // Re-fetch when project filter changes
  useEffect(() => {
    if (activeTab === 'beneficiary') {
      fetchBeneficiaries(1, beneficiaryProjectFilter)
    }
  }, [beneficiaryProjectFilter])

  async function fetchBeneficiaryProjects() {
    try {
      const res = await axios.get('/admin/api/project-sites')
      setBeneficiaryProjects(res.data.data || [])
    } catch (err) {
      console.error('Projects fetch failed', err)
    }
  }

  async function fetchBeneficiaries(page = 1, projectId = '') {
    try {
      setBeneficiaryLoading(true)
      const res = await axios.get('/admin/api/beneficiaries/assigned', {
        params: {
          page,
          per_page: beneficiaries.per_page,
          search: beneficiarySearch || '',
          project_id: projectId || '',
        },
      })
      setBeneficiaries(res.data)
      setError('')
    } catch (err) {
      console.error('Beneficiaries fetch failed', err)
      setError(err?.response?.data?.message || 'Failed to load beneficiaries')
    } finally {
      setBeneficiaryLoading(false)
    }
  }

  async function fetchBeneficiaryMonitoring(surveyId) {
    try {
      const res = await axios.get(`/admin/api/beneficiaries/${surveyId}/monitoring`)
      setMonitoringHistory(res.data.monitoring_history || [])
      setStatusOptions(res.data.status_options || {})
    } catch (err) {
      console.error('Monitoring fetch failed', err)
      setError(err?.response?.data?.message || 'Failed to load monitoring history')
    }
  }

  function selectBeneficiary(beneficiary) {
    setSelectedBeneficiary(beneficiary)
    fetchBeneficiaryMonitoring(beneficiary.survey_id)
  }

  function openMonitoringModal() {
    const today = new Date().toISOString().split('T')[0]
    setMonitoringForm({ visit_date: today, status: '', remarks: '' })
    setMonitoringErrors({})
    setSupportingDocuments([])
    setShowMonitoringModal(true)
  }

  async function handleSaveMonitoring(e) {
    e.preventDefault()
    setSavingMonitoring(true)
    setMonitoringErrors({})

    try {
      const formData = new FormData()
      formData.append('visit_date', monitoringForm.visit_date)
      formData.append('status', monitoringForm.status)
      formData.append('remarks', monitoringForm.remarks || '')
      
      // Append supporting document (single file only)
      if (supportingDocuments.length > 0) {
        formData.append('supporting_documents', supportingDocuments[0])
      }

      const res = await axios.post(`/admin/api/beneficiaries/${selectedBeneficiary.survey_id}/monitoring`, formData, {
        headers: { 
          'X-CSRF-TOKEN': csrf(),
          'Content-Type': 'multipart/form-data',
        },
      })

      if (res.data.success) {
        setShowMonitoringModal(false)
        setSupportingDocuments([])
        fetchBeneficiaryMonitoring(selectedBeneficiary.survey_id)
      }
    } catch (err) {
      console.error('Monitoring save failed', err)
      if (err.response?.data?.errors) {
        setMonitoringErrors(err.response.data.errors)
      } else {
        setMonitoringErrors({ general: err.response?.data?.message || 'Failed to save monitoring record' })
      }
    } finally {
      setSavingMonitoring(false)
    }
  }

  // ==================== SITE VISITS FUNCTIONS ====================

  useEffect(() => {
    if (activeTab === 'siteVisits') {
      fetchSiteVisits()
      fetchDueVisits()
      fetchProjectsAndHoas()
      fetchAdminProfile()
    }
  }, [activeTab])

  async function fetchAdminProfile() {
    try {
      const res = await axios.get('/admin/api/profile')
      if (res.data.profile?.username) {
        setAdminName(res.data.profile.username)
      }
    } catch (err) {
      console.error('Failed to fetch admin profile', err)
    }
  }

  useEffect(() => {
    if (activeTab === 'siteVisits') {
      fetchSiteVisits()
    }
  }, [projectFilter, hoaFilter, visitStatusFilter])

  async function fetchSiteVisits(page = 1) {
    try {
      setSiteVisitsLoading(true)
      const res = await axios.get('/admin/api/site-visits', {
        params: {
          page,
          per_page: siteVisits.per_page,
          project_id: projectFilter || '',
          hoa_id: hoaFilter || '',
          status: visitStatusFilter || '',
        },
      })
      setSiteVisits(res.data.site_visits || { data: [], total: 0, current_page: 1, per_page: 10 })
      setError('')
    } catch (err) {
      console.error('Site visits fetch failed', err)
      setError(err?.response?.data?.message || 'Failed to load site visits')
    } finally {
      setSiteVisitsLoading(false)
    }
  }

  async function fetchDueVisits() {
    try {
      const res = await axios.get('/admin/api/site-visits/due')
      setDueVisits(res.data)
    } catch (err) {
      console.error('Due visits fetch failed', err)
    }
  }

  async function fetchProjectsAndHoas() {
    try {
      const [projectsRes, hoasRes] = await Promise.all([
        axios.get('/admin/api/project-sites'),
        axios.get('/admin/api/hoas', { params: { per_page: 100 } }),
      ])
      setProjects(projectsRes.data.data || [])
      setHoas(hoasRes.data.hoas?.data || [])
    } catch (err) {
      console.error('Projects/HOAs fetch failed', err)
    }
  }

  function openScheduleModal() {
    const today = new Date().toISOString().split('T')[0]
    setScheduleForm({ project_id: '', hoa_id: '', scheduled_date: today, assigned_staff: adminName || '', visit_notes: '' })
    setScheduleErrors({})
    setShowScheduleModal(true)
  }

  async function handleScheduleVisit(e) {
    e.preventDefault()
    setSavingSchedule(true)
    setScheduleErrors({})

    try {
      const payload = {
        scheduled_date: scheduleForm.scheduled_date,
        assigned_staff: scheduleForm.assigned_staff,
        visit_notes: scheduleForm.visit_notes || null,
      }
      if (scheduleForm.project_id) payload.project_id = scheduleForm.project_id
      if (scheduleForm.hoa_id) payload.hoa_id = scheduleForm.hoa_id

      const res = await axios.post('/admin/api/site-visits', payload, {
        headers: { 'X-CSRF-TOKEN': csrf() },
      })

      if (res.data.success) {
        setShowScheduleModal(false)
        fetchSiteVisits()
        fetchDueVisits()
      }
    } catch (err) {
      console.error('Schedule visit failed', err)
      if (err.response?.data?.errors) {
        setScheduleErrors(err.response.data.errors)
      } else {
        setScheduleErrors({ general: err.response?.data?.message || 'Failed to schedule visit' })
      }
    } finally {
      setSavingSchedule(false)
    }
  }

  function openCompleteModal(visit) {
    setSelectedVisit(visit)
    setCompleteForm({ visit_notes: visit.visit_notes || '', findings: '' })
    setShowCompleteModal(true)
  }

  async function handleCompleteVisit(e) {
    e.preventDefault()
    setSavingComplete(true)

    try {
      const res = await axios.put(`/admin/api/site-visits/${selectedVisit.visit_id}/complete`, completeForm, {
        headers: { 'X-CSRF-TOKEN': csrf() },
      })

      if (res.data.success) {
        setShowCompleteModal(false)
        setSelectedVisit(null)
        fetchSiteVisits()
        fetchDueVisits()
      }
    } catch (err) {
      console.error('Complete visit failed', err)
      setError(err.response?.data?.message || 'Failed to complete visit')
    } finally {
      setSavingComplete(false)
    }
  }

  async function handleCancelVisit(visitId) {
    if (!window.confirm('Are you sure you want to cancel this visit?')) return

    try {
      const res = await axios.put(`/admin/api/site-visits/${visitId}/cancel`, {}, {
        headers: { 'X-CSRF-TOKEN': csrf() },
      })
      if (res.data.success) {
        fetchSiteVisits()
        fetchDueVisits()
      }
    } catch (err) {
      console.error('Cancel visit failed', err)
      setError(err.response?.data?.message || 'Failed to cancel visit')
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

  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map(p => ({ value: String(p.project_id), label: p.project_name }))
  ]

  const hoaOptions = [
    { value: '', label: 'All HOAs' },
    ...hoas.map(h => ({ value: String(h.hoa_id), label: h.hoa_name }))
  ]

  const visitStatusOptions = [
    { value: '', label: 'All Status' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ]

  // Pagination
  const beneficiaryTotalPages = Math.ceil((beneficiaries.total || 0) / (beneficiaries.per_page || 10))
  const siteVisitsTotalPages = Math.ceil((siteVisits.total || 0) / (siteVisits.per_page || 10))


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
              <h2 className="text-2xl text-emerald-800 font-semibold">Monitoring</h2>
              <div className="text-xs text-gray-500">Track beneficiary status and site visits</div>
            </div>
          </header>
        </DashboardFade>

        {/* Tabs */}
        <DashboardFade delay={300}>
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => setActiveTab('beneficiary')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'beneficiary'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Beneficiary Monitoring
            </button>
            <button
              onClick={() => setActiveTab('siteVisits')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === 'siteVisits'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              Site Visits
              {dueVisits.total_due > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {dueVisits.total_due} due
                </span>
              )}
            </button>
          </div>
        </DashboardFade>


        {/* ==================== BENEFICIARY MONITORING TAB ==================== */}
        {activeTab === 'beneficiary' && (
          <DashboardFade delay={400}>
            <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Beneficiary List */}
              <div className="lg:col-span-1 bg-white rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Beneficiaries</h3>
                  <select
                    value={beneficiaryProjectFilter}
                    onChange={(e) => setBeneficiaryProjectFilter(e.target.value)}
                    className="rounded-lg border border-gray-200 bg-white py-1.5 px-3 text-xs text-gray-900 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  >
                    <option value="">All Project Sites</option>
                    {beneficiaryProjects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>
                        {p.project_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Search */}
                <div className="mb-4">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                      </svg>
                    </span>
                    <input
                      type="text"
                      placeholder="Search by name, barangay, project, block, or lot..."
                      value={beneficiarySearch}
                      onChange={(e) => setBeneficiarySearch(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </div>
                </div>

                {/* Beneficiary List */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {beneficiaryLoading ? (
                    <div className="text-center py-8 text-gray-500">Loading...</div>
                  ) : beneficiaries.data?.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">No assigned beneficiaries found</div>
                  ) : (
                    beneficiaries.data?.map((b) => (
                      <button
                        key={b.survey_id}
                        onClick={() => selectBeneficiary(b)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors ${
                          selectedBeneficiary?.survey_id === b.survey_id
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-gray-100 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium text-gray-900 text-sm">{b.demographic?.first_name} {b.demographic?.last_name}</div>
                        <div className="text-xs text-gray-500">{b.demographic?.barangay?.replace(/_/g, ' ')}</div>
                        {b.assignment && (
                          <div className="text-xs text-emerald-600 mt-1">
                            {b.assignment.project_name} • Block {b.assignment.block_no}, Lot {b.assignment.lot_no}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>

                {/* Pagination */}
                {beneficiaryTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={() => fetchBeneficiaries(beneficiaries.current_page - 1, beneficiaryProjectFilter)}
                      disabled={beneficiaries.current_page <= 1}
                      className="px-3 py-1 rounded-lg text-xs border border-gray-200 disabled:opacity-50"
                    >
                      Prev
                    </button>
                    <span className="text-xs text-gray-500">
                      {beneficiaries.current_page} / {beneficiaryTotalPages}
                    </span>
                    <button
                      onClick={() => fetchBeneficiaries(beneficiaries.current_page + 1, beneficiaryProjectFilter)}
                      disabled={beneficiaries.current_page >= beneficiaryTotalPages}
                      className="px-3 py-1 rounded-lg text-xs border border-gray-200 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              {/* Monitoring History */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-4">
                {selectedBeneficiary ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {selectedBeneficiary.demographic?.first_name} {selectedBeneficiary.demographic?.last_name}
                        </h3>
                        <p className="text-sm text-gray-500">Monitoring History</p>
                        {selectedBeneficiary.assignment && (
                          <p className="text-xs text-emerald-600 mt-1">
                            {selectedBeneficiary.assignment.project_name} • Block {selectedBeneficiary.assignment.block_no}, Lot {selectedBeneficiary.assignment.lot_no}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={openMonitoringModal}
                        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Record
                      </button>
                    </div>

                    {/* History Timeline */}
                    <div className="space-y-4 max-h-[500px] overflow-y-auto">
                      {monitoringHistory.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No monitoring records yet</div>
                      ) : (
                        monitoringHistory.map((record, idx) => (
                          <div key={record.record_id} className="relative pl-8 pb-6 border-l-2 border-emerald-300 last:border-l-transparent last:pb-0 ml-2">
                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white shadow-sm"></div>
                            <div className="bg-gray-50 rounded-xl p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  record.status === 'house_constructed' ? 'bg-green-100 text-green-800' :
                                  record.status === 'under_construction' ? 'bg-blue-100 text-blue-800' :
                                  record.status === 'not_occupied' ? 'bg-amber-100 text-amber-800' :
                                  record.status === 'vacant' ? 'bg-yellow-100 text-yellow-800' :
                                  record.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {statusOptions[record.status] || record.status}
                                </span>
                                <span className="text-xs text-gray-500">{formatDate(record.visit_date)}</span>
                              </div>
                              {record.remarks && (
                                <p className="text-sm text-gray-700 mt-2">{record.remarks}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2">
                                Recorded by {record.creator?.name || 'Unknown'} on {formatDateTime(record.created_at)}
                              </p>
                              
                              {/* View Details Button and Document Management */}
                              <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                                <button
                                  onClick={() => setViewDetailsRecord(record)}
                                  className="inline-flex items-center gap-2 text-xs text-emerald-600 hover:text-emerald-800 font-medium"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View Details
                                </button>
                                {record.documents_path && (
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                    Has document
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    Select a beneficiary to view monitoring history
                  </div>
                )}
              </div>
            </div>
          </DashboardFade>
        )}


        {/* ==================== SITE VISITS TAB ==================== */}
        {activeTab === 'siteVisits' && (
          <DashboardFade delay={400}>
            {/* Due Visits Alert */}
            {dueVisits.total_due > 0 && (
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <h4 className="font-medium text-amber-800">Monthly Visits Due - {dueVisits.current_month}</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      {dueVisits.projects_due_count} project site(s) and {dueVisits.hoas_due_count} HOA(s) need attention this month.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {dueVisits.projects_due?.slice(0, 5).map(p => (
                        <span key={p.project_id} className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-amber-100 text-amber-800">
                          {p.project_name}
                        </span>
                      ))}
                      {dueVisits.hoas_due?.slice(0, 5).map(h => (
                        <span key={h.hoa_id} className="inline-flex items-center px-2 py-1 rounded-lg text-xs bg-amber-100 text-amber-800">
                          {h.hoa_name}
                        </span>
                      ))}
                      {(dueVisits.projects_due?.length > 5 || dueVisits.hoas_due?.length > 5) && (
                        <span className="text-xs text-amber-700">and more...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Site Visits Section */}
            <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Site Visits</h3>
                <button
                  onClick={openScheduleModal}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Schedule Visit
                </button>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3 mb-4">
                <FilterDropdown
                  label="Project:"
                  value={projectFilter}
                  onChange={setProjectFilter}
                  options={projectOptions}
                  widthClass="w-48"
                />
                <FilterDropdown
                  label="HOA:"
                  value={hoaFilter}
                  onChange={setHoaFilter}
                  options={hoaOptions}
                  widthClass="w-48"
                />
                <FilterDropdown
                  label="Status:"
                  value={visitStatusFilter}
                  onChange={setVisitStatusFilter}
                  options={visitStatusOptions}
                  widthClass="w-40"
                />
              </div>

              {/* Visits Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Location</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Assigned Staff</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siteVisitsLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">Loading...</td>
                      </tr>
                    ) : siteVisits.data?.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-gray-500">No site visits found</td>
                      </tr>
                    ) : (
                      siteVisits.data?.map((visit) => (
                        <tr key={visit.visit_id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">{formatDate(visit.scheduled_date)}</td>
                          <td className="py-3 px-4">
                            {visit.project?.project_name || visit.hoa?.hoa_name || '—'}
                            {visit.project && visit.hoa && (
                              <span className="text-gray-400"> / {visit.hoa.hoa_name}</span>
                            )}
                          </td>
                          <td className="py-3 px-4">{visit.assigned_staff}</td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              visit.status === 'completed' ? 'bg-green-100 text-green-800' :
                              visit.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {visit.status === 'scheduled' && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openCompleteModal(visit)}
                                  className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                                >
                                  Complete
                                </button>
                                <button
                                  onClick={() => handleCancelVisit(visit.visit_id)}
                                  className="text-red-600 hover:text-red-800 text-xs font-medium"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                            {visit.status === 'completed' && visit.findings && (
                              <button
                                onClick={() => {
                                  setSelectedVisit(visit)
                                  setShowCompleteModal(true)
                                }}
                                className="text-gray-600 hover:text-gray-800 text-xs font-medium"
                              >
                                View Details
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {siteVisitsTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <button
                    onClick={() => fetchSiteVisits(siteVisits.current_page - 1)}
                    disabled={siteVisits.current_page <= 1}
                    className="px-3 py-1 rounded-lg text-xs border border-gray-200 disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-xs text-gray-500">
                    {siteVisits.current_page} / {siteVisitsTotalPages}
                  </span>
                  <button
                    onClick={() => fetchSiteVisits(siteVisits.current_page + 1)}
                    disabled={siteVisits.current_page >= siteVisitsTotalPages}
                    className="px-3 py-1 rounded-lg text-xs border border-gray-200 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </DashboardFade>
        )}


        {/* ==================== MODALS ==================== */}

        {/* Add Monitoring Record Modal */}
        {showMonitoringModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowMonitoringModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Monitoring Record</h3>
              
              {monitoringErrors.general && (
                <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                  {monitoringErrors.general}
                </div>
              )}

              <form onSubmit={handleSaveMonitoring}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                    <input
                      type="date"
                      value={monitoringForm.visit_date}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, visit_date: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                    {monitoringErrors.visit_date && (
                      <p className="mt-1 text-xs text-red-600">{monitoringErrors.visit_date[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={monitoringForm.status}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, status: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      required
                    >
                      <option value="">Select status...</option>
                      {Object.entries(statusOptions).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                    {monitoringErrors.status && (
                      <p className="mt-1 text-xs text-red-600">{monitoringErrors.status[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      value={monitoringForm.remarks}
                      onChange={(e) => setMonitoringForm({ ...monitoringForm, remarks: e.target.value })}
                      rows={3}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Optional remarks..."
                    />
                    {monitoringErrors.remarks && (
                      <p className="mt-1 text-xs text-red-600">{monitoringErrors.remarks[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Supporting Documents (Optional)</label>
                    <div className="text-xs text-gray-400 mb-2">Upload proof documents (PDF, JPG, PNG, DOC, DOCX - Max 10MB each)</div>
                    <input 
                      type="file" 
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" 
                      multiple
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100" 
                      onChange={e => {
                        const files = Array.from(e.target.files || [])
                        // Client-side validation
                        const validFiles = files.filter(file => {
                          const maxSize = 10 * 1024 * 1024 // 10MB
                          const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
                          
                          if (file.size > maxSize) {
                            setMonitoringErrors({ general: `File ${file.name} exceeds 10MB limit` })
                            return false
                          }
                          if (!allowedTypes.includes(file.type)) {
                            setMonitoringErrors({ general: `File ${file.name} has invalid type` })
                            return false
                          }
                          return true
                        })
                        setSupportingDocuments(validFiles)
                        if (validFiles.length > 0) setMonitoringErrors({})
                      }} 
                      disabled={savingMonitoring}
                    />
                    {supportingDocuments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {supportingDocuments.map((file, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-200">
                            <span className="truncate flex-1">{file.name}</span>
                            <span className="text-gray-400 ml-2">{(file.size / 1024).toFixed(1)} KB</span>
                            <button
                              type="button"
                              onClick={() => setSupportingDocuments(docs => docs.filter((_, i) => i !== idx))}
                              className="ml-2 text-red-500 hover:text-red-700"
                              disabled={savingMonitoring}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowMonitoringModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMonitoring}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingMonitoring ? 'Saving...' : 'Save Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Schedule Site Visit Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowScheduleModal(false)}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule Site Visit</h3>
              
              {scheduleErrors.general && (
                <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                  {scheduleErrors.general}
                </div>
              )}

              <form onSubmit={handleScheduleVisit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Site</label>
                    <select
                      value={scheduleForm.project_id}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, project_id: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select project site...</option>
                      {projects.map(p => (
                        <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                      ))}
                    </select>
                    {scheduleErrors.project_id && (
                      <p className="mt-1 text-xs text-red-600">{scheduleErrors.project_id[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HOA (Optional)</label>
                    <select
                      value={scheduleForm.hoa_id}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, hoa_id: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    >
                      <option value="">Select HOA...</option>
                      {hoas.map(h => (
                        <option key={h.hoa_id} value={h.hoa_id}>{h.hoa_name}</option>
                      ))}
                    </select>
                    {scheduleErrors.hoa_id && (
                      <p className="mt-1 text-xs text-red-600">{scheduleErrors.hoa_id[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                    <input
                      type="date"
                      value={scheduleForm.scheduled_date}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, scheduled_date: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      required
                    />
                    {scheduleErrors.scheduled_date && (
                      <p className="mt-1 text-xs text-red-600">{scheduleErrors.scheduled_date[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Staff</label>
                    <input
                      type="text"
                      value={scheduleForm.assigned_staff}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, assigned_staff: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Enter staff name..."
                      required
                    />
                    {scheduleErrors.assigned_staff && (
                      <p className="mt-1 text-xs text-red-600">{scheduleErrors.assigned_staff[0]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                    <textarea
                      value={scheduleForm.visit_notes}
                      onChange={(e) => setScheduleForm({ ...scheduleForm, visit_notes: e.target.value })}
                      rows={2}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSchedule}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingSchedule ? 'Scheduling...' : 'Schedule Visit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Monitoring Details Modal */}
        {viewDetailsRecord && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => setViewDetailsRecord(null)}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 p-6 max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Monitoring Record Details</h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{formatDate(viewDetailsRecord.visit_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      viewDetailsRecord.status === 'house_constructed' ? 'bg-green-100 text-green-800' :
                      viewDetailsRecord.status === 'under_construction' ? 'bg-blue-100 text-blue-800' :
                      viewDetailsRecord.status === 'not_occupied' ? 'bg-amber-100 text-amber-800' :
                      viewDetailsRecord.status === 'vacant' ? 'bg-yellow-100 text-yellow-800' :
                      viewDetailsRecord.status === 'abandoned' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {statusOptions[viewDetailsRecord.status] || viewDetailsRecord.status}
                    </span>
                  </div>
                </div>

                {viewDetailsRecord.remarks && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{viewDetailsRecord.remarks}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recorded By</label>
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">
                    {viewDetailsRecord.creator?.name || 'Unknown'} on {formatDateTime(viewDetailsRecord.created_at)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents</label>
                  {viewDetailsRecord.documents_path ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                          {viewDetailsRecord.is_documents_image ? (
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                          <div>
                            <p className="text-sm text-gray-900">Supporting Document</p>
                            <p className="text-xs text-gray-500">
                              {viewDetailsRecord.is_documents_image ? 'Image file' : 'Document file'}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/admin/api/monitoring/${viewDetailsRecord.record_id}/documents/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-3">No supporting documents uploaded</p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setViewDetailsRecord(null)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Complete Site Visit Modal */}
        {showCompleteModal && selectedVisit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={() => { setShowCompleteModal(false); setSelectedVisit(null); }}></div>
            <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                {selectedVisit.status === 'completed' ? 'Visit Details' : 'Complete Site Visit'}
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Location:</span> {selectedVisit.project?.project_name || selectedVisit.hoa?.hoa_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Date:</span> {formatDate(selectedVisit.scheduled_date)}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Staff:</span> {selectedVisit.assigned_staff}
                </p>
              </div>

              {selectedVisit.status === 'completed' ? (
                <div className="space-y-4">
                  {selectedVisit.visit_notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selectedVisit.visit_notes}</p>
                    </div>
                  )}
                  {selectedVisit.findings && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
                      <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{selectedVisit.findings}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Completed on {formatDateTime(selectedVisit.completed_at)}
                  </p>
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => { setShowCompleteModal(false); setSelectedVisit(null); }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCompleteVisit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Visit Notes</label>
                      <textarea
                        value={completeForm.visit_notes}
                        onChange={(e) => setCompleteForm({ ...completeForm, visit_notes: e.target.value })}
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Notes about the visit..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
                      <textarea
                        value={completeForm.findings}
                        onChange={(e) => setCompleteForm({ ...completeForm, findings: e.target.value })}
                        rows={3}
                        className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Document your findings..."
                      />
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowCompleteModal(false); setSelectedVisit(null); }}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingComplete}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {savingComplete ? 'Completing...' : 'Mark Complete'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
