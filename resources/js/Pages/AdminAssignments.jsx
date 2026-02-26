import React, { useEffect, useState, useRef, Fragment } from 'react'
import ReactDOM from 'react-dom'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import { Listbox, Transition } from '@headlessui/react'
import AdminTable from '../Components/AdminTable'
import { AdminSidebarWrapper } from '../Components/AdminSidebar'

export default function AdminAssignments() {
  const [pending, setPending] = useState([])
  const [assigned, setAssigned] = useState([])
  const [projects, setProjects] = useState([])
  const [blocksMap, setBlocksMap] = useState({})
  const [lotsMap, setLotsMap] = useState({})
  const [searchPending, setSearchPending] = useState('')
  const [searchAssigned, setSearchAssigned] = useState('')
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [assignForms, setAssignForms] = useState({})
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [searchingPending, setSearchingPending] = useState(false)
  const [searchingAssigned, setSearchingAssigned] = useState(false)

  const [pendingPage, setPendingPage] = useState(1)
  const [assignedPage, setAssignedPage] = useState(1)
  const [pendingSortKey, setPendingSortKey] = useState('surname')
  const [pendingSortDirection, setPendingSortDirection] = useState('asc')
  const [assignedSortKey, setAssignedSortKey] = useState('surname')
  const [assignedSortDirection, setAssignedSortDirection] = useState('asc')

  const assignmentsPageSize = 10
  const searchPendingTimeoutRef = useRef(null)
  const searchAssignedTimeoutRef = useRef(null)

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    try {
      const [p1, p2, p3] = await Promise.all([
        axios.get('/admin/api/assignments/pending'),
        axios.get('/admin/api/assignments'),
        axios.get('/admin/api/project-sites'),
      ])
      setPending(p1.data.data || [])
      setAssigned(p2.data.data || [])
      setProjects(p3.data.data || [])
      setError('')
      setPendingPage(1)
      setAssignedPage(1)
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    }
  }

  async function searchPendingList(query = searchPending) {
    setSearchingPending(true)
    try {
      const p1 = await axios.get('/admin/api/assignments/pending', { params: { search: query } })
      setPending(p1.data.data || [])
      setError('')
      setPendingPage(1)
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setSearchingPending(false)
    }
  }

  async function searchAssignedList(query = searchAssigned) {
    setSearchingAssigned(true)
    try {
      const p2 = await axios.get('/admin/api/assignments', { params: { search: query } })
      setAssigned(p2.data.data || [])
      setError('')
      setAssignedPage(1)
    } catch (e) {
      setError(e?.response?.data?.message || e.message)
    } finally {
      setSearchingAssigned(false)
    }
  }

  // Debounced search for pending list
  useEffect(() => {
    if (searchPendingTimeoutRef.current) {
      clearTimeout(searchPendingTimeoutRef.current)
    }
    
    searchPendingTimeoutRef.current = setTimeout(() => {
      if (searchPending.trim()) {
        searchPendingList(searchPending)
      } else {
        // Reload all data when search is cleared
        loadAll()
      }
    }, 400)
    
    return () => {
      if (searchPendingTimeoutRef.current) {
        clearTimeout(searchPendingTimeoutRef.current)
      }
    }
  }, [searchPending])

  // Debounced search for assigned list
  useEffect(() => {
    if (searchAssignedTimeoutRef.current) {
      clearTimeout(searchAssignedTimeoutRef.current)
    }
    
    searchAssignedTimeoutRef.current = setTimeout(() => {
      if (searchAssigned.trim()) {
        searchAssignedList(searchAssigned)
      } else {
        // Reload all data when search is cleared
        loadAll()
      }
    }, 400)
    
    return () => {
      if (searchAssignedTimeoutRef.current) {
        clearTimeout(searchAssignedTimeoutRef.current)
      }
    }
  }, [searchAssigned])

  function SmoothSelect({ value, onChange, options, buttonClassName, disabled = false }) {
    const selected = options.find(o => o.value === value)
    const showPlaceholder = value === '' || value == null
    const label = showPlaceholder ? (options[0]?.label ?? '') : (selected?.label ?? '')
    const buttonRef = useRef(null)
    const [dropdownStyle, setDropdownStyle] = useState({})

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect()
        setDropdownStyle({
          position: 'fixed',
          top: rect.bottom + 4,
          left: rect.left,
          minWidth: rect.width,
          zIndex: 1000,
        })
      }
    }

    return (
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        {({ open }) => {
          if (open) {
            setTimeout(updatePosition, 0)
          }
          return (
            <div className={`relative ${open ? 'z-[1001]' : 'z-[1]'}`}>
              <Listbox.Button
                ref={buttonRef}
                type="button"
                className={`${buttonClassName} ${disabled ? 'cursor-not-allowed opacity-60' : ''} flex items-center justify-between gap-2`}
              >
                <span className={`block min-w-0 flex-1 truncate ${showPlaceholder ? 'text-gray-400' : 'text-gray-900'}`}>{label}</span>
                <svg className="h-4 w-4 flex-shrink-0 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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

              {open && !disabled && ReactDOM.createPortal(
                <Transition
                  as={Fragment}
                  show={open && !disabled}
                  enter="transition ease-out duration-100"
                  enterFrom="opacity-0 translate-y-1"
                  enterTo="opacity-100 translate-y-0"
                  leave="transition ease-in duration-75"
                  leaveFrom="opacity-100 translate-y-0"
                  leaveTo="opacity-0 translate-y-1"
                >
                  <Listbox.Options 
                    className="max-h-64 overflow-auto rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none" 
                    style={{ ...dropdownStyle, width: 'max-content', minWidth: dropdownStyle.minWidth || 200 }}
                    static
                  >
                    {options.map((opt, idx) => (
                      <Listbox.Option
                        key={`${opt.value ?? 'opt'}-${idx}`}
                        value={opt.value}
                        className={({ active }) =>
                          `cursor-pointer select-none rounded-xl px-3 py-2 text-sm ${active ? 'bg-emerald-50 text-emerald-900' : 'text-gray-900'}`
                        }
                      >
                        {({ selected: isSelected }) => (
                          <div className="flex items-center justify-between gap-3">
                            <span className={`min-w-0 flex-1 truncate ${isSelected ? 'font-medium text-emerald-700' : ''}`}>{opt.label}</span>
                            {isSelected && (
                              <svg className="h-4 w-4 flex-shrink-0 text-emerald-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
                </Transition>,
                document.body
              )}
            </div>
          )
        }}
      </Listbox>
    )
  }

  async function loadBlocks(project_id) {
    if (!project_id) return
    try {
      const res = await axios.get(`/admin/api/project-sites/${project_id}/blocks`)
      setBlocksMap(prev => ({ ...prev, [project_id]: res.data.data || [] }))
    } catch (e) {
      setBlocksMap(prev => ({ ...prev, [project_id]: [] }))
    }
  }
  async function loadAvailableLots(project_id, block_no) {
    if (!project_id || !block_no) return
    try {
      const res = await axios.get(`/admin/api/project-sites/${project_id}/blocks/${block_no}/available-lots`)
      setLotsMap(prev => ({ ...prev, [`${project_id}#${block_no}`]: res.data.data || [] }))
    } catch (e) {
      setLotsMap(prev => ({ ...prev, [`${project_id}#${block_no}`]: [] }))
    }
  }

  async function assignRow(survey_id, project_id, block_no, lot_no) {
    if (!project_id) { alert('Select a project'); return }
    if (!block_no) { alert('Select a block'); return }
    if (!lot_no) { alert('Select a lot'); return }
    setBusyId(survey_id)
    try {
      await axios.post('/admin/api/assignments', { survey_id, project_id, block_no, lot_no }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      await loadAll()
      await loadBlocks(project_id)
      await loadAvailableLots(project_id, block_no)
    } catch (e) {
      alert(e?.response?.data?.message || e.message)
    } finally {
      setBusyId(null)
    }
  }

  function handlePendingSort(id) {
    if (pendingSortKey === id) {
      setPendingSortDirection(pendingSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setPendingSortKey(id)
      setPendingSortDirection('asc')
    }
    setPendingPage(1)
  }

  function handleAssignedSort(id) {
    if (assignedSortKey === id) {
      setAssignedSortDirection(assignedSortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setAssignedSortKey(id)
      setAssignedSortDirection('asc')
    }
    setAssignedPage(1)
  }

  function getPendingSortValue(r, key) {
    if (key === 'surname') return r.last_name || ''
    if (key === 'barangay') return r.barangay || ''
    if (key === 'classification') return r.classification || ''
    return ''
  }

  function getAssignedSortValue(r, key) {
    if (key === 'surname') return r.last_name || ''
    if (key === 'barangay') return r.barangay || ''
    if (key === 'project') return r.project_name || ''
    if (key === 'assigned') return r.date_assigned || ''
    return ''
  }

  const sortedPending = [...pending].sort((a, b) => {
    const av = getPendingSortValue(a, pendingSortKey)
    const bv = getPendingSortValue(b, pendingSortKey)
    if (av < bv) return pendingSortDirection === 'asc' ? -1 : 1
    if (av > bv) return pendingSortDirection === 'asc' ? 1 : -1
    return 0
  })

  const sortedAssigned = [...assigned].sort((a, b) => {
    const av = getAssignedSortValue(a, assignedSortKey)
    const bv = getAssignedSortValue(b, assignedSortKey)
    if (av < bv) return assignedSortDirection === 'asc' ? -1 : 1
    if (av > bv) return assignedSortDirection === 'asc' ? 1 : -1
    return 0
  })

  const pendingColumns = [
    {
      id: 'surname',
      header: 'Surname',
      sortable: true,
      render: r => r.last_name,
      cellClassName: 'text-gray-900 font-medium',
    },
    {
      id: 'barangay',
      header: 'Barangay',
      sortable: true,
      render: r => r.barangay,
    },
    {
      id: 'classification',
      header: 'Classification',
      sortable: true,
      render: r => r.classification,
    },
    {
      id: 'project',
      header: 'Project',
      sortable: false,
      render: r => {
        const f = assignForms[r.survey_id] || { project_id: '', block_no: '', lot_no: '' }
        const projectOptions = [
          { value: '', label: 'Select Project' },
          ...projects.map(p => ({ value: p.project_id, label: p.project_name }))
        ]
        return (
          <SmoothSelect
            value={f.project_id}
            onChange={v => {
              setAssignForms(prev => ({
                ...prev,
                [r.survey_id]: { project_id: v, block_no: '', lot_no: '' },
              }))
              if (v) {
                loadBlocks(v)
              }
            }}
            options={projectOptions}
            buttonClassName="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 text-left focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        )
      },
    },
    {
      id: 'block',
      header: 'Block',
      sortable: false,
      render: r => {
        const f = assignForms[r.survey_id] || { project_id: '', block_no: '', lot_no: '' }
        const blocks = f.project_id ? blocksMap[f.project_id] || [] : []
        const blockOptions = [
          { value: '', label: 'Select Block' },
          ...blocks.map(b => ({ value: b.block_no, label: `Block ${b.block_no} (${b.available_lots} left)` }))
        ]
        return (
          <SmoothSelect
            value={f.block_no}
            onChange={v => {
              setAssignForms(prev => ({
                ...prev,
                [r.survey_id]: { ...(prev[r.survey_id] || {}), project_id: f.project_id, block_no: v, lot_no: '' },
              }))
              if (f.project_id && v) {
                loadAvailableLots(f.project_id, v)
              }
            }}
            options={blockOptions}
            buttonClassName="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 text-left focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            disabled={!f.project_id}
          />
        )
      },
    },
    {
      id: 'lot',
      header: 'Lot',
      sortable: false,
      render: r => {
        const f = assignForms[r.survey_id] || { project_id: '', block_no: '', lot_no: '' }
        const lotsKey = `${f.project_id}#${f.block_no}`
        const lots = f.project_id && f.block_no ? lotsMap[lotsKey] || [] : []
        const lotOptions = [
          { value: '', label: 'Select Lot' },
          ...lots.map(l => ({ value: l, label: `Lot ${l}` }))
        ]
        return (
          <SmoothSelect
            value={f.lot_no}
            onChange={v => {
              setAssignForms(prev => ({
                ...prev,
                [r.survey_id]: { ...(prev[r.survey_id] || {}), project_id: f.project_id, block_no: f.block_no, lot_no: v },
              }))
            }}
            options={lotOptions}
            buttonClassName="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 text-left focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            disabled={!f.project_id || !f.block_no}
          />
        )
      },
    },
    {
      id: 'action',
      header: 'Action',
      sortable: false,
      render: r => {
        const f = assignForms[r.survey_id] || { project_id: '', block_no: '', lot_no: '' }
        const isLoading = busyId === r.survey_id
        return (
          <button
            className="px-3 py-1 border rounded-xl text-sm text-emerald-800 hover:bg-emerald-50 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[70px]"
            disabled={isLoading}
            onClick={() => assignRow(r.survey_id, f.project_id, f.block_no, f.lot_no)}
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Assign'
            )}
          </button>
        )
      },
    },
  ]

  const assignedColumns = [
    {
      id: 'surname',
      header: 'Surname',
      sortable: true,
      render: a => a.last_name,
      cellClassName: 'text-gray-900 font-medium',
    },
    {
      id: 'barangay',
      header: 'Barangay',
      sortable: true,
      render: a => a.barangay,
    },
    {
      id: 'project',
      header: 'Project',
      sortable: true,
      render: a => a.project_name,
    },
    {
      id: 'block',
      header: 'Block',
      sortable: false,
      render: a => a.block_no,
    },
    {
      id: 'lot',
      header: 'Lot',
      sortable: false,
      render: a => a.lot_no,
    },
    {
      id: 'assigned',
      header: 'Assigned',
      sortable: true,
      render: a => a.date_assigned,
    },
  ]

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
              <h2 className="text-2xl text-emerald-800 font-semibold">Assignments</h2>
              <div className="text-xs text-gray-500">Assign approved beneficiaries to project sites</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/project-sites" className="px-3 py-2 border rounded-xl text-emerald-800">Manage Projects</Link>
            </div>
          </header>
        </DashboardFade>

        <DashboardFade delay={300}>
        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 overflow-visible relative z-20">
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">Pending Approval Assignments</h3>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <input
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all duration-200"
                  placeholder="Search pending approvals..."
                  value={searchPending}
                  onChange={e => setSearchPending(e.target.value)}
                />
                {searchingPending && (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={`transition-opacity duration-300 overflow-visible ${searchingPending ? 'opacity-50' : 'opacity-100'}`}>
            <AdminTable
              columns={pendingColumns}
              rows={sortedPending}
              getRowKey={r => r.survey_id}
              page={pendingPage}
              pageSize={assignmentsPageSize}
              onPageChange={setPendingPage}
              sortKey={pendingSortKey}
              sortDirection={pendingSortDirection}
              onSortChange={handlePendingSort}
              emptyMessage="No pending approved beneficiaries."
            />
          </div>
        </section>
        </DashboardFade>

        <DashboardFade delay={400}>
        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 overflow-visible relative z-10">
          <h3 className="text-lg font-semibold text-emerald-800 mb-3">Assigned Beneficiaries</h3>
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex-1 min-w-[220px]">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </span>
                <input
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all duration-200"
                  placeholder="Search assigned beneficiaries..."
                  value={searchAssigned}
                  onChange={e => setSearchAssigned(e.target.value)}
                />
                {searchingAssigned && (
                  <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg className="animate-spin h-4 w-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className={`transition-opacity duration-300 overflow-visible ${searchingAssigned ? 'opacity-50' : 'opacity-100'}`}>
            <AdminTable
              columns={assignedColumns}
              rows={sortedAssigned}
              getRowKey={a => a.assignment_id}
              page={assignedPage}
              pageSize={assignmentsPageSize}
              onPageChange={setAssignedPage}
              sortKey={assignedSortKey}
              sortDirection={assignedSortDirection}
              onSortChange={handleAssignedSort}
              emptyMessage="No assignments yet."
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
