// resources/js/Pages/AdminHOA.jsx
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

export default function AdminHOA() {
  // State for HOA list
  const [hoas, setHoas] = useState({ data: [], total: 0, current_page: 1, per_page: 10 })
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [projectFilter, setProjectFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // State for HOA detail view
  const [selectedHoa, setSelectedHoa] = useState(null)
  const [showDetail, setShowDetail] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)

  // State for create/edit modal
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' or 'edit'
  const [formData, setFormData] = useState({ hoa_name: '', project_id: '', hoa_image: null, status: 'active' })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // State for officer management
  const [showOfficerModal, setShowOfficerModal] = useState(false)
  const [officerForm, setOfficerForm] = useState({ name: '', position: '', phone_number: '', period_start: '', period_end: '', remarks: '' })
  const [officerErrors, setOfficerErrors] = useState({})
  const [savingOfficer, setSavingOfficer] = useState(false)
  const [editingOfficer, setEditingOfficer] = useState(null)

  // State for member management
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [memberForm, setMemberForm] = useState({ name: '', contact_info: '' })
  const [memberErrors, setMemberErrors] = useState({})
  const [savingMember, setSavingMember] = useState(false)

  // State for document management
  const [showDocModal, setShowDocModal] = useState(false)
  const [docForm, setDocForm] = useState({ document_name: '', document_type: 'elected-officers', document: null })
  const [docErrors, setDocErrors] = useState({})
  const [savingDoc, setSavingDoc] = useState(false)
  const [documentTypes, setDocumentTypes] = useState([])

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  // Fetch HOAs on mount and when filters change
  useEffect(() => {
    fetchHoas()
  }, [projectFilter, statusFilter])

  // Debounced search
  useEffect(() => {
    const handle = setTimeout(() => {
      fetchHoas(1)
    }, 350)
    return () => clearTimeout(handle)
  }, [search])

  // Fetch document types on mount
  useEffect(() => {
    fetchDocumentTypes()
  }, [])

  async function fetchHoas(page = 1) {
    try {
      setLoading(true)
      const res = await axios.get('/admin/api/hoas', {
        params: {
          page,
          per_page: hoas.per_page,
          search: search || '',
          project_id: projectFilter || '',
          status: statusFilter || '',
        },
      })
      setHoas(res.data.hoas)
      setProjects(res.data.projects || [])
      setError('')
    } catch (err) {
      console.error('HOA fetch failed', err)
      setError(err?.response?.data?.message || err.message || 'Failed to load HOAs')
    } finally {
      setLoading(false)
    }
  }

  async function fetchDocumentTypes() {
    try {
      const res = await axios.get('/admin/api/hoa-document-types')
      setDocumentTypes(res.data.document_types || {})
    } catch (err) {
      console.error('Document types fetch failed', err)
    }
  }

  async function fetchHoaDetail(hoaId) {
    try {
      setDetailLoading(true)
      const res = await axios.get(`/admin/api/hoas/${hoaId}`)
      setSelectedHoa(res.data.hoa)
      setShowDetail(true)
    } catch (err) {
      console.error('HOA detail fetch failed', err)
      setError(err?.response?.data?.message || 'Failed to load HOA details')
    } finally {
      setDetailLoading(false)
    }
  }

  // Project filter options
  const projectOptions = [
    { value: '', label: 'All Projects' },
    ...projects.map(p => ({ value: String(p.project_id), label: p.project_name }))
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  // Pagination
  const totalPages = Math.ceil((hoas.total || 0) / (hoas.per_page || 10))
  const currentPage = hoas.current_page || 1

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      fetchHoas(page)
    }
  }


  // ==================== HOA CRUD HANDLERS ====================

  function openCreateModal() {
    setModalMode('create')
    setFormData({ hoa_name: '', project_id: '', hoa_image: null, status: 'active' })
    setFormErrors({})
    setShowModal(true)
  }

  function openEditModal(hoa) {
    setModalMode('edit')
    setFormData({
      hoa_name: hoa.hoa_name || '',
      project_id: String(hoa.project_id || ''),
      hoa_image: null,
      status: hoa.status || 'active',
    })
    setFormErrors({})
    setShowModal(true)
  }

  async function handleSaveHoa(e) {
    e.preventDefault()
    setSaving(true)
    setFormErrors({})

    try {
      const fd = new FormData()
      fd.append('hoa_name', formData.hoa_name)
      fd.append('project_id', formData.project_id)
      fd.append('status', formData.status)
      if (formData.hoa_image) {
        fd.append('hoa_image', formData.hoa_image)
      }

      let res
      if (modalMode === 'create') {
        res = await axios.post('/admin/api/hoas', fd, {
          headers: { 'Content-Type': 'multipart/form-data', 'X-CSRF-TOKEN': csrf() },
        })
      } else {
        res = await axios.post(`/admin/api/hoas/${selectedHoa.hoa_id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data', 'X-CSRF-TOKEN': csrf() },
        })
      }

      if (res.data.success) {
        setShowModal(false)
        fetchHoas(currentPage)
        if (showDetail && selectedHoa) {
          fetchHoaDetail(selectedHoa.hoa_id)
        }
      }
    } catch (err) {
      console.error('HOA save failed', err)
      if (err.response?.data?.errors) {
        setFormErrors(err.response.data.errors)
      } else {
        setFormErrors({ general: err.response?.data?.message || 'Failed to save HOA' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteHoa(hoaId) {
    if (!window.confirm('Are you sure you want to delete this HOA? This action cannot be undone.')) return

    try {
      const res = await axios.delete(`/admin/api/hoas/${hoaId}`, {
        headers: { 'X-CSRF-TOKEN': csrf() },
      })
      if (res.data.success) {
        setShowDetail(false)
        setSelectedHoa(null)
        fetchHoas(currentPage)
      }
    } catch (err) {
      console.error('HOA delete failed', err)
      setError(err.response?.data?.message || 'Failed to delete HOA')
    }
  }

  // ==================== OFFICER HANDLERS ====================

  function openOfficerModal(officer = null) {
    if (officer) {
      setEditingOfficer(officer)
      setOfficerForm({
        name: officer.name || '',
        position: officer.position || '',
        phone_number: officer.phone_number || '',
        period_start: officer.period_start?.split('T')[0] || '',
        period_end: officer.period_end?.split('T')[0] || '',
        remarks: officer.remarks || '',
      })
    } else {
      setEditingOfficer(null)
      setOfficerForm({ name: '', position: '', phone_number: '', period_start: '', period_end: '', remarks: '' })
    }
    setOfficerErrors({})
    setShowOfficerModal(true)
  }

  async function handleSaveOfficer(e) {
    e.preventDefault()
    setSavingOfficer(true)
    setOfficerErrors({})

    try {
      let res
      if (editingOfficer) {
        res = await axios.put(`/admin/api/hoas/${selectedHoa.hoa_id}/officers/${editingOfficer.officer_id}`, officerForm, {
          headers: { 'X-CSRF-TOKEN': csrf() },
        })
      } else {
        res = await axios.post(`/admin/api/hoas/${selectedHoa.hoa_id}/officers`, officerForm, {
          headers: { 'X-CSRF-TOKEN': csrf() },
        })
      }

      if (res.data.success) {
        setShowOfficerModal(false)
        fetchHoaDetail(selectedHoa.hoa_id)
      }
    } catch (err) {
      console.error('Officer save failed', err)
      if (err.response?.data?.errors) {
        setOfficerErrors(err.response.data.errors)
      } else {
        setOfficerErrors({ general: err.response?.data?.message || 'Failed to save officer' })
      }
    } finally {
      setSavingOfficer(false)
    }
  }

  async function handleDeleteOfficer(officerId) {
    if (!window.confirm('Are you sure you want to remove this officer?')) return

    try {
      const res = await axios.delete(`/admin/api/hoas/${selectedHoa.hoa_id}/officers/${officerId}`, {
        headers: { 'X-CSRF-TOKEN': csrf() },
      })
      if (res.data.success) {
        fetchHoaDetail(selectedHoa.hoa_id)
      }
    } catch (err) {
      console.error('Officer delete failed', err)
      setError(err.response?.data?.message || 'Failed to remove officer')
    }
  }

  // ==================== MEMBER HANDLERS ====================

  function openMemberModal() {
    setMemberForm({ name: '', contact_info: '' })
    setMemberErrors({})
    setShowMemberModal(true)
  }

  async function handleSaveMember(e) {
    e.preventDefault()
    setSavingMember(true)
    setMemberErrors({})

    try {
      const res = await axios.post(`/admin/api/hoas/${selectedHoa.hoa_id}/members`, {
        members: [{ name: memberForm.name, contact_info: memberForm.contact_info }]
      }, {
        headers: { 'X-CSRF-TOKEN': csrf() },
      })

      if (res.data.success) {
        setShowMemberModal(false)
        fetchHoaDetail(selectedHoa.hoa_id)
      }
    } catch (err) {
      console.error('Member save failed', err)
      if (err.response?.data?.errors) {
        setMemberErrors(err.response.data.errors)
      } else {
        setMemberErrors({ general: err.response?.data?.message || 'Failed to add member' })
      }
    } finally {
      setSavingMember(false)
    }
  }

  async function handleDeleteMember(memberId) {
    if (!window.confirm('Are you sure you want to remove this member?')) return

    try {
      const res = await axios.delete(`/admin/api/hoas/${selectedHoa.hoa_id}/members/${memberId}`, {
        headers: { 'X-CSRF-TOKEN': csrf() },
      })
      if (res.data.success) {
        fetchHoaDetail(selectedHoa.hoa_id)
      }
    } catch (err) {
      console.error('Member delete failed', err)
      setError(err.response?.data?.message || 'Failed to remove member')
    }
  }

  async function handleExportMembers() {
    try {
      window.open(`/admin/api/hoas/${selectedHoa.hoa_id}/members/export`, '_blank')
    } catch (err) {
      console.error('Export failed', err)
      setError('Failed to export member list')
    }
  }

  async function handleExportOfficers() {
    try {
      window.open(`/admin/api/hoas/${selectedHoa.hoa_id}/officers/export`, '_blank')
    } catch (err) {
      console.error('Export failed', err)
      setError('Failed to export officers list')
    }
  }

  // ==================== DOCUMENT HANDLERS ====================

  function openDocModal() {
    setDocForm({ document_name: '', document_type: 'elected-officers', document: null })
    setDocErrors({})
    setShowDocModal(true)
  }

  async function handleSaveDocument(e) {
    e.preventDefault()
    setSavingDoc(true)
    setDocErrors({})

    try {
      const fd = new FormData()
      fd.append('document_name', docForm.document_name)
      fd.append('document_type', docForm.document_type)
      if (docForm.document) {
        fd.append('document', docForm.document)
      }

      const res = await axios.post(`/admin/api/hoas/${selectedHoa.hoa_id}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-CSRF-TOKEN': csrf() },
      })

      if (res.data.success) {
        setShowDocModal(false)
        fetchHoaDetail(selectedHoa.hoa_id)
      }
    } catch (err) {
      console.error('Document upload failed', err)
      if (err.response?.data?.errors) {
        setDocErrors(err.response.data.errors)
      } else {
        setDocErrors({ general: err.response?.data?.message || 'Failed to upload document' })
      }
    } finally {
      setSavingDoc(false)
    }
  }

  async function handleDeleteDocument(documentId) {
    if (!window.confirm('Are you sure you want to delete this document?')) return

    try {
      const res = await axios.delete(`/admin/api/hoas/${selectedHoa.hoa_id}/documents/${documentId}`, {
        headers: { 'X-CSRF-TOKEN': csrf() },
      })
      if (res.data.success) {
        fetchHoaDetail(selectedHoa.hoa_id)
      }
    } catch (err) {
      console.error('Document delete failed', err)
      setError(err.response?.data?.message || 'Failed to delete document')
    }
  }

  function formatFileSize(bytes) {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—'
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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
              <h2 className="text-2xl text-emerald-800 font-semibold">HOA Management</h2>
              <div className="text-xs text-gray-500">Manage Homeowners Associations</div>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add HOA
            </button>
          </header>
        </DashboardFade>


        {/* HOA List Section */}
        <DashboardFade delay={300}>
          <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6">
            {/* Filters */}
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div className="flex-1 min-w-[220px]">
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.3-4.3" />
                      </svg>
                    </span>
                    <input
                      className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Search HOA by name"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <FilterDropdown
                    label="Project:"
                    value={projectFilter}
                    onChange={setProjectFilter}
                    options={projectOptions}
                    widthClass="w-48"
                  />
                  <FilterDropdown
                    label="Status:"
                    value={statusFilter}
                    onChange={setStatusFilter}
                    options={statusOptions}
                    widthClass="w-36"
                  />
                  {loading && <span className="text-xs font-medium text-gray-500">Loading…</span>}
                </div>
              </div>
            </div>

            {/* HOA Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">HOA Name</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Project Site</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Officers</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Created</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {hoas.data && hoas.data.length > 0 ? (
                    hoas.data.map(hoa => (
                      <tr key={hoa.hoa_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {hoa.hoa_image ? (
                              <img src={`/${hoa.hoa_image}`} alt={hoa.hoa_name} className="w-10 h-10 rounded-lg object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                            )}
                            <span className="font-medium text-gray-900">{hoa.hoa_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{hoa.project?.project_name || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            hoa.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {hoa.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-emerald-600 font-medium">{hoa.active_officers_count || 0}</span>
                          <span className="text-gray-400"> / {hoa.total_officers_count || 0}</span>
                        </td>
                        <td className="py-3 px-4 text-gray-600">{formatDate(hoa.created_at)}</td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => fetchHoaDetail(hoa.hoa_id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">
                        {loading ? 'Loading HOAs...' : 'No HOAs found. Click "Add HOA" to create one.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Showing {((currentPage - 1) * hoas.per_page) + 1} to {Math.min(currentPage * hoas.per_page, hoas.total)} of {hoas.total} HOAs
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let page
                    if (totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    return (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                          page === currentPage
                            ? 'bg-emerald-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </DashboardFade>


        {/* HOA Detail Modal */}
        {showDetail && selectedHoa && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => { setShowDetail(false); setSelectedHoa(null) }}></div>
            <div className="absolute inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl border shadow-xl flex flex-col overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b flex items-center justify-between bg-gray-50">
                <div className="flex items-center gap-4">
                  {selectedHoa.hoa_image ? (
                    <img src={`/${selectedHoa.hoa_image}`} alt={selectedHoa.hoa_name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold text-emerald-800">{selectedHoa.hoa_name}</h3>
                    <p className="text-sm text-gray-500">{selectedHoa.project?.project_name || 'No project assigned'}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${
                      selectedHoa.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedHoa.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(selectedHoa)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-white border hover:bg-gray-50"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteHoa(selectedHoa.hoa_id)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-red-700 bg-white border border-red-200 hover:bg-red-50"
                  >
                    Delete
                  </button>
                  <button
                    onClick={() => { setShowDetail(false); setSelectedHoa(null) }}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 bg-white border hover:bg-gray-50"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Officers & Members */}
                  <div className="space-y-6">
                    {/* Officers Section */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Officers</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExportOfficers}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                          </button>
                          <button
                            onClick={() => openOfficerModal()}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Officer
                          </button>
                        </div>
                      </div>
                      {selectedHoa.officers && selectedHoa.officers.length > 0 ? (
                        <div className="space-y-3">
                          {selectedHoa.officers.map(officer => (
                            <div key={officer.officer_id} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-gray-900">{officer.name}</span>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                      officer.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                      {officer.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                  </div>
                                  <p className="text-sm text-emerald-600 font-medium">{officer.position}</p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {officer.phone_number}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {formatDate(officer.period_start)} - {formatDate(officer.period_end)}
                                  </p>
                                  {officer.remarks && (
                                    <p className="text-xs text-gray-600 mt-2 italic">"{officer.remarks}"</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openOfficerModal(officer)}
                                    className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                                    title="Edit"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOfficer(officer.officer_id)}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                    title="Remove"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No officers registered yet.</p>
                      )}
                    </div>

                    {/* Members Section */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Members ({selectedHoa.members?.length || 0})</h4>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={handleExportMembers}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 bg-white border hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export
                          </button>
                          <button
                            onClick={openMemberModal}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Member
                          </button>
                        </div>
                      </div>
                      {selectedHoa.members && selectedHoa.members.length > 0 ? (
                        <div className="max-h-64 overflow-y-auto space-y-2">
                          {selectedHoa.members.map(member => (
                            <div key={member.member_id} className="bg-white rounded-lg p-3 border border-gray-200 flex items-center justify-between">
                              <div>
                                <span className="font-medium text-gray-900">{member.name}</span>
                                {member.contact_info && (
                                  <p className="text-xs text-gray-500">{member.contact_info}</p>
                                )}
                              </div>
                              <button
                                onClick={() => handleDeleteMember(member.member_id)}
                                className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                title="Remove"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No members registered yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Right Column - Documents */}
                  <div className="space-y-6">
                    {/* Documents Section */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-gray-800">Documents</h4>
                        <button
                          onClick={openDocModal}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          Upload
                        </button>
                      </div>
                      {selectedHoa.documents && selectedHoa.documents.length > 0 ? (
                        <div className="space-y-2">
                          {selectedHoa.documents.map(doc => (
                            <div key={doc.document_id} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 text-sm">{doc.document_name}</p>
                                    <p className="text-xs text-gray-500">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mr-2">
                                        {doc.document_type}
                                      </span>
                                      {formatFileSize(doc.file_size)} • {formatDate(doc.created_at)}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <a
                                    href={`/admin/api/hoas/${selectedHoa.hoa_id}/documents/${doc.document_id}/download`}
                                    className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50"
                                    title="Download"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                  </a>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.document_id)}
                                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50"
                                    title="Delete"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No documents uploaded yet.</p>
                      )}
                    </div>

                    {/* HOA Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h4 className="text-lg font-semibold text-gray-800 mb-4">HOA Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Created</span>
                          <span className="text-sm font-medium text-gray-900">{formatDate(selectedHoa.created_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Last Updated</span>
                          <span className="text-sm font-medium text-gray-900">{formatDate(selectedHoa.updated_at)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total Officers</span>
                          <span className="text-sm font-medium text-gray-900">{selectedHoa.officers?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Active Officers</span>
                          <span className="text-sm font-medium text-emerald-600">
                            {selectedHoa.officers?.filter(o => o.is_active).length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Total Members</span>
                          <span className="text-sm font-medium text-gray-900">{selectedHoa.members?.length || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Documents</span>
                          <span className="text-sm font-medium text-gray-900">{selectedHoa.documents?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Create/Edit HOA Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowModal(false)}></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl border shadow-xl p-6 w-[500px] max-w-[95vw]">
              <h3 className="text-lg font-semibold text-emerald-800 mb-4">
                {modalMode === 'create' ? 'Create New HOA' : 'Edit HOA'}
              </h3>
              <form onSubmit={handleSaveHoa}>
                {formErrors.general && (
                  <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                    {formErrors.general}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">HOA Name *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        formErrors.hoa_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.hoa_name}
                      onChange={e => setFormData({ ...formData, hoa_name: e.target.value })}
                      placeholder="Enter HOA name"
                    />
                    {formErrors.hoa_name && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.hoa_name[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Site *</label>
                    <select
                      className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        formErrors.project_id ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={formData.project_id}
                      onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                    >
                      <option value="">Select a project site</option>
                      {projects.map(p => (
                        <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                      ))}
                    </select>
                    {formErrors.project_id && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.project_id[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      HOA Image {modalMode === 'create' ? '*' : '(optional)'}
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      className={`w-full border rounded-xl p-2 text-sm ${
                        formErrors.hoa_image ? 'border-red-300' : 'border-gray-300'
                      }`}
                      onChange={e => setFormData({ ...formData, hoa_image: e.target.files?.[0] || null })}
                    />
                    {formErrors.hoa_image && (
                      <p className="mt-1 text-xs text-red-600">{formErrors.hoa_image[0]}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Max 5MB. Supported: JPEG, PNG, JPG, GIF</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={formData.status}
                      onChange={e => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : (modalMode === 'create' ? 'Create HOA' : 'Save Changes')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Officer Modal */}
        {showOfficerModal && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowOfficerModal(false)}></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl border shadow-xl p-6 w-[500px] max-w-[95vw]">
              <h3 className="text-lg font-semibold text-emerald-800 mb-4">
                {editingOfficer ? 'Edit Officer' : 'Add Officer'}
              </h3>
              <form onSubmit={handleSaveOfficer}>
                {officerErrors.general && (
                  <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                    {officerErrors.general}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        officerErrors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={officerForm.name}
                      onChange={e => setOfficerForm({ ...officerForm, name: e.target.value })}
                      placeholder="Enter officer name"
                    />
                    {officerErrors.name && <p className="mt-1 text-xs text-red-600">{officerErrors.name[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        officerErrors.position ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={officerForm.position}
                      onChange={e => setOfficerForm({ ...officerForm, position: e.target.value })}
                      placeholder="e.g., President, Secretary, Treasurer"
                    />
                    {officerErrors.position && <p className="mt-1 text-xs text-red-600">{officerErrors.position[0]}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        officerErrors.phone_number ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={officerForm.phone_number}
                      onChange={e => setOfficerForm({ ...officerForm, phone_number: e.target.value })}
                      placeholder="Enter phone number"
                    />
                    {officerErrors.phone_number && <p className="mt-1 text-xs text-red-600">{officerErrors.phone_number[0]}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Period Start *</label>
                      <input
                        type="date"
                        className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                          officerErrors.period_start ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={officerForm.period_start}
                        onChange={e => setOfficerForm({ ...officerForm, period_start: e.target.value })}
                      />
                      {officerErrors.period_start && <p className="mt-1 text-xs text-red-600">{officerErrors.period_start[0]}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Period End *</label>
                      <input
                        type="date"
                        className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                          officerErrors.period_end ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={officerForm.period_end}
                        onChange={e => setOfficerForm({ ...officerForm, period_end: e.target.value })}
                      />
                      {officerErrors.period_end && <p className="mt-1 text-xs text-red-600">{officerErrors.period_end[0]}</p>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                    <textarea
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      rows={3}
                      value={officerForm.remarks}
                      onChange={e => setOfficerForm({ ...officerForm, remarks: e.target.value })}
                      placeholder="Any additional notes about this officer"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOfficerModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingOfficer}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingOfficer ? 'Saving...' : (editingOfficer ? 'Save Changes' : 'Add Officer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Member Modal */}
        {showMemberModal && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMemberModal(false)}></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl border shadow-xl p-6 w-[400px] max-w-[95vw]">
              <h3 className="text-lg font-semibold text-emerald-800 mb-4">Add Member</h3>
              <form onSubmit={handleSaveMember}>
                {memberErrors.general && (
                  <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                    {memberErrors.general}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Member Name *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        memberErrors['members.0.name'] ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={memberForm.name}
                      onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                      placeholder="Enter member name"
                    />
                    {memberErrors['members.0.name'] && (
                      <p className="mt-1 text-xs text-red-600">{memberErrors['members.0.name'][0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info (optional)</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      value={memberForm.contact_info}
                      onChange={e => setMemberForm({ ...memberForm, contact_info: e.target.value })}
                      placeholder="Phone number or email"
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMemberModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingMember}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingMember ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Document Upload Modal */}
        {showDocModal && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowDocModal(false)}></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl border shadow-xl p-6 w-[450px] max-w-[95vw]">
              <h3 className="text-lg font-semibold text-emerald-800 mb-4">Upload Document</h3>
              <form onSubmit={handleSaveDocument}>
                {docErrors.general && (
                  <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
                    {docErrors.general}
                  </div>
                )}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Name *</label>
                    <input
                      type="text"
                      className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        docErrors.document_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={docForm.document_name}
                      onChange={e => setDocForm({ ...docForm, document_name: e.target.value })}
                      placeholder="Enter document name"
                    />
                    {docErrors.document_name && (
                      <p className="mt-1 text-xs text-red-600">{docErrors.document_name[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Type *</label>
                    <select
                      className={`w-full border rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-300 ${
                        docErrors.document_type ? 'border-red-300' : 'border-gray-300'
                      }`}
                      value={docForm.document_type}
                      onChange={e => setDocForm({ ...docForm, document_type: e.target.value })}
                    >
                      <option value="elected-officers">List of Duly Elected Officers of the HOA</option>
                      <option value="constitution-bylaws">Constitution and By Laws</option>
                      <option value="articles-incorporation">Article of Incorporation</option>
                      <option value="written-undertaking">Written Undertaking</option>
                      <option value="certification">Certification</option>
                      <option value="authorization">Authorization</option>
                      <option value="general-info-sheet">General Information Sheet/Census Form</option>
                      <option value="masterlist-members">Masterlists of Members of the HOA</option>
                      <option value="subdivision-plan">Approved Subdivision Plan or Verified Survey Plan</option>
                      <option value="registration-license">Photocopy of Certificate of Registration and License to Sell</option>
                      <option value="code-of-ethics">Code of Ethics and Ethical Standards for Officer/Board Members of HOA</option>
                      <option value="board-resolution">Board Resolution</option>
                      <option value="minutes-organizational">Minutes of the Organizational Meeting</option>
                      <option value="filing-fee">Filing/Processing Fee</option>
                      <option value="other">Other</option>
                    </select>
                    {docErrors.document_type && (
                      <p className="mt-1 text-xs text-red-600">{docErrors.document_type[0]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File *</label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className={`w-full border rounded-xl p-2 text-sm ${
                        docErrors.document ? 'border-red-300' : 'border-gray-300'
                      }`}
                      onChange={e => setDocForm({ ...docForm, document: e.target.files?.[0] || null })}
                    />
                    {docErrors.document && (
                      <p className="mt-1 text-xs text-red-600">{docErrors.document[0]}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Max 10MB. Supported: PDF, DOC, DOCX, JPG, PNG</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDocModal(false)}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-gray-700 bg-white border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingDoc}
                    className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {savingDoc ? 'Uploading...' : 'Upload Document'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
