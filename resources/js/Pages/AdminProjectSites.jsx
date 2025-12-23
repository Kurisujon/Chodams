import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function AdminProjectSites() {
  const [projects, setProjects] = useState([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const [showMap, setShowMap] = useState(false)
  const mapRef = useRef(null)
  const mapElRef = useRef(null)
  const overlayRef = useRef(null)
  const [boundaryOpen, setBoundaryOpen] = useState(false)
  const [geojsonInput, setGeojsonInput] = useState('')
  const [savingBoundary, setSavingBoundary] = useState(false)
  const [parseError, setParseError] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editForm, setEditForm] = useState({ project_name: '', land_area: '', total_blocks: '', total_lots: '', barangay: '', year_started: '', description: '', proj_image: null })
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingProject, setDeletingProject] = useState(false)

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => { load() }, [])

  async function load(q = '') {
    try {
      const res = await axios.get('/admin/api/project-sites', { params: { search: q } })
      setProjects(res.data.data || [])
      setError('')
    } catch (e) {
      setError(e?.response?.data?.message || e.message || 'Failed to load projects')
    }
  }

  useEffect(() => {
    if (!showMap || !selected) return
    if (!mapElRef.current) return
    if (mapRef.current && typeof mapRef.current.getContainer === 'function' && mapRef.current.getContainer() !== mapElRef.current) {
      try { mapRef.current.remove() } catch {}
      mapRef.current = null
      overlayRef.current = null
    }
    if (!mapRef.current) {
      mapRef.current = L.map(mapElRef.current).setView([6.749, 125.356], 16)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }).addTo(mapRef.current)
      setTimeout(() => { try { mapRef.current.invalidateSize() } catch {} }, 100)
    }
    const map = mapRef.current
    if (overlayRef.current) { try { map.removeLayer(overlayRef.current) } catch {} }
    if (selected?.geojson) {
      try {
        const gj = typeof selected.geojson === 'string' ? JSON.parse(selected.geojson) : selected.geojson
        const layer = L.geoJSON(gj, { style: { color: '#10b981', weight: 2, fillColor: '#10b981', fillOpacity: 0.18 } })
        layer.addTo(map)
        overlayRef.current = layer
        setTimeout(() => { try { map.invalidateSize() } catch {} }, 0)
        try { map.fitBounds(layer.getBounds(), { padding: [12,12] }) } catch {}
      } catch {}
    }
  }, [showMap, selected])

  useEffect(() => {
    if (!showMap && mapRef.current) {
      try { mapRef.current.remove() } catch {}
      mapRef.current = null
      overlayRef.current = null
    }
  }, [showMap])

  async function saveBoundary() {
    if (!selected) return
    try {
      setSavingBoundary(true)
      const geojsonStr = toGeoJSONString(geojsonInput)
      const res = await axios.post(
        `/admin/api/project-sites/${selected.project_id}/boundary`,
        { geojson: geojsonStr },
        { headers: { 'X-CSRF-TOKEN': csrf() } }
      )
      if (res.data?.ok) {
        setSelected(prev => ({ ...prev, geojson: geojsonStr }))
        setProjects(prev => prev.map(pr => pr.project_id === selected.project_id ? { ...pr, geojson: geojsonStr } : pr))
        setBoundaryOpen(false)
        setGeojsonInput('')
        setParseError('')
      }
    } catch (e) {
      alert(e?.response?.data?.message || parseError || 'Failed to save boundary')
    } finally {
      setSavingBoundary(false)
    }
  }

  function toGeoJSONString(input) {
    const s = (input || '').trim()
    if (!s) throw new Error('Empty input')
    if (s.startsWith('<')) {
      const parser = new DOMParser()
      const doc = parser.parseFromString(s, 'text/xml')
      const coordsNode = doc.getElementsByTagName('coordinates')[0]
      if (!coordsNode || !coordsNode.textContent) throw new Error('KML coordinates not found')
      const raw = coordsNode.textContent.trim()
      const pairs = raw.split(/\s+/).map(p => p.split(',').slice(0,2).map(Number))
      if (!pairs.length) throw new Error('No coordinates parsed')
      const first = pairs[0]
      const last = pairs[pairs.length - 1]
      if (first && last && (first[0] !== last[0] || first[1] !== last[1])) {
        pairs.push([first[0], first[1]])
      }
      const gj = { type: 'Polygon', coordinates: [pairs] }
      return JSON.stringify(gj)
    }
    try {
      const obj = JSON.parse(s)
      let gj = null
      if (obj.type === 'Feature' && obj.geometry) gj = obj.geometry
      else if (obj.type === 'Polygon' || obj.type === 'MultiPolygon') gj = obj
      else throw new Error('Unsupported GeoJSON type')
      return JSON.stringify(gj)
    } catch (err) {
      setParseError(err.message)
      throw err
    }
  }

  function previewBoundary() {
    try {
      const geojsonStr = toGeoJSONString(geojsonInput)
      setSelected(prev => ({ ...prev, geojson: geojsonStr }))
      setParseError('')
      if (!showMap) setShowMap(true)
    } catch (e) {
      setParseError(e.message)
    }
  }

  function openEdit() {
    if (!selected) return
    setEditForm({
      project_name: selected.project_name || '',
      land_area: selected.land_area ?? '',
      total_blocks: selected.total_blocks ?? '',
      total_lots: selected.total_lots ?? '',
      barangay: selected.barangay || '',
      year_started: selected.year_started || '',
      description: selected.description || '',
      proj_image: null,
    })
    setEditOpen(true)
  }

  function updateEditField(k, v) {
    setEditForm(prev => ({ ...prev, [k]: v }))
  }

  async function saveEdit() {
    if (!selected) return
    try {
      setSavingEdit(true)
      const fd = new FormData()
      fd.append('_method', 'PUT')
      Object.entries(editForm).forEach(([k,v]) => {
        if (k === 'proj_image') {
          if (v) fd.append('proj_image', v)
        } else if (v !== '' && v !== null && v !== undefined) {
          fd.append(k, v)
        }
      })
      const res = await axios.post(`/admin/api/project-sites/${selected.project_id}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-CSRF-TOKEN': csrf() },
      })
      if (res.data?.ok) {
        setProjects(prev => prev.map(pr => pr.project_id === selected.project_id ? {
          ...pr,
          project_name: editForm.project_name || pr.project_name,
          land_area: editForm.land_area !== '' ? Number(editForm.land_area) : pr.land_area,
          total_blocks: editForm.total_blocks !== '' ? Number(editForm.total_blocks) : pr.total_blocks,
          total_lots: editForm.total_lots !== '' ? Number(editForm.total_lots) : pr.total_lots,
          barangay: editForm.barangay || pr.barangay,
          year_started: editForm.year_started || pr.year_started,
          description: editForm.description || pr.description,
        } : pr))
        setSelected(prev => prev ? {
          ...prev,
          project_name: editForm.project_name || prev.project_name,
          land_area: editForm.land_area !== '' ? Number(editForm.land_area) : prev.land_area,
          total_blocks: editForm.total_blocks !== '' ? Number(editForm.total_blocks) : prev.total_blocks,
          total_lots: editForm.total_lots !== '' ? Number(editForm.total_lots) : prev.total_lots,
          barangay: editForm.barangay || prev.barangay,
          year_started: editForm.year_started || prev.year_started,
          description: editForm.description || prev.description,
        } : prev)
        setEditOpen(false)
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to save changes')
    } finally {
      setSavingEdit(false)
    }
  }

  async function deleteProject() {
    if (!selected) return
    if (!window.confirm('Delete this project site? This cannot be undone.')) return
    try {
      setDeletingProject(true)
      const res = await axios.delete(`/admin/api/project-sites/${selected.project_id}`, { headers: { 'X-CSRF-TOKEN': csrf() } })
      if (res.data?.ok) {
        setProjects(prev => prev.filter(pr => pr.project_id !== selected.project_id))
        setShowMap(false)
        setSelected(null)
      }
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete project')
    } finally {
      setDeletingProject(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:block w-64 flex flex-col flex-shrink-0 bg-white text-gray-700 p-6 border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
          <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200"/>
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
              <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200"/>
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
              <h2 className="text-2xl text-emerald-800 font-semibold">Project Sites</h2>
              <div className="text-xs text-gray-500">Existing projects and site details</div>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/admin/project-sites/add" className="px-3 py-2 bg-emerald-600 text-white rounded-xl">Add Project</Link>
            </div>
          </header>
        </DashboardFade>

        <DashboardFade delay={300}>
        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
          <form className="flex items-center gap-2 mb-4" onSubmit={e => { e.preventDefault(); load(search) }}>
            <input className="border border-gray-300 rounded-xl p-2.5 w-full md:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-300" placeholder="Search projects" value={search} onChange={e=>setSearch(e.target.value)}/>
            <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit">Search</button>
          </form>

          {projects.length === 0 ? (
            <div className="text-center text-gray-600">
              <div>No projects found.</div>
              <Link href="/admin/project-sites/add" className="inline-block mt-4 px-3 py-2 bg-emerald-600 text-white rounded-xl">Add Project</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {projects.map(p => (
                <div key={p.project_id} className="rounded-2xl border border-gray-200 bg-white overflow-hidden cursor-pointer" onClick={() => { setSelected(p); setShowMap(true) }}>
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.project_name} className="w-full h-40 object-cover"/>
                  ) : (
                    <div className="w-full h-40 bg-gray-100 grid place-items-center text-gray-500">No image</div>
                  )}
                  <div className="p-4">
                    <div className="text-lg font-semibold text-emerald-800">{p.project_name}</div>
                    <div className="text-sm text-gray-600">Barangay: {p.barangay || 'Unknown'}</div>
                    <div className="text-sm text-gray-600">Year Started: {p.year_started || '—'}</div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded bg-emerald-50 p-2">
                        <div className="text-xs text-gray-500">Land Area</div>
                        <div className="text-sm font-semibold text-emerald-800">{p.land_area ?? 0}</div>
                      </div>
                      <div className="rounded bg-emerald-50 p-2">
                        <div className="text-xs text-gray-500">Blocks</div>
                        <div className="text-sm font-semibold text-emerald-800">{p.total_blocks ?? 0}</div>
                      </div>
                      <div className="rounded bg-emerald-50 p-2">
                        <div className="text-xs text-gray-500">Available Lots</div>
                        <div className="text-sm font-semibold text-emerald-800">{(p.available_lots ?? p.total_lots) ?? 0}</div>
                      </div>
                    </div>
                    {p.description && <div className="mt-3 text-sm text-gray-700 line-clamp-3">{p.description}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
        </DashboardFade>

        {showMap && selected && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowMap(false)}></div>
            <div className="absolute inset-6 md:inset-16 bg-white rounded-2xl border shadow-xl flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold text-emerald-800">{selected.project_name}</div>
                  <div className="text-xs text-gray-500">{selected.barangay || ''} • Area {selected.land_area || 0} m² • Perimeter ~{Math.round(Math.sqrt((selected.land_area||0))*4)} m</div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1 border rounded-xl" onClick={() => setShowMap(false)}>Close</button>
                  <button className="px-3 py-1 bg-emerald-600 text-white rounded-xl" onClick={() => setBoundaryOpen(true)}>Set Boundary</button>
                  <button className="px-3 py-1 border rounded-xl" onClick={openEdit}>Edit</button>
                  <button className="px-3 py-1 border rounded-xl text-red-700" onClick={deleteProject} disabled={deletingProject}>{deletingProject ? 'Deleting…' : 'Delete'}</button>
                </div>
              </div>
              <div className="flex-1">
                <div ref={mapElRef} className="w-full h-full" />
              </div>
              {!selected?.geojson && (
                <div className="p-3 border-t text-sm text-gray-600">No boundary defined. Use Add Project to upload image and save boundary later.</div>
              )}
            </div>
          </div>
        )}

        {showMap && selected && boundaryOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setBoundaryOpen(false)}></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl border shadow-xl p-4 w-[800px] max-w-[95vw]">
              <div className="text-lg font-semibold text-emerald-800 mb-2 text-center">Paste KML or GeoJSON Polygon</div>
              <textarea className="w-full h-64 border rounded p-2 font-mono text-xs" value={geojsonInput} onChange={e=>setGeojsonInput(e.target.value)} placeholder='Paste KML (<Polygon><coordinates>...</coordinates></Polygon>) or GeoJSON {"type":"Polygon","coordinates":[[[lng,lat],...]]}' />
              {parseError && <div className="mt-2 text-sm text-red-600">{parseError}</div>}
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 border rounded-xl" onClick={() => setBoundaryOpen(false)}>Cancel</button>
                <button className="px-3 py-1 border rounded-xl" onClick={previewBoundary}>Preview</button>
                <button className="px-3 py-1 bg-emerald-600 text-white rounded-xl" onClick={saveBoundary} disabled={savingBoundary}>{savingBoundary ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </div>
        )}

        {showMap && selected && editOpen && (
          <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditOpen(false)}></div>
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl border shadow-xl p-4 w-[800px] max-w-[95vw]">
              <div className="text-lg font-semibold text-emerald-800 mb-2 text-center">Edit Project Site</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-700">Project Name</label>
                  <input className="mt-1 w-full border rounded p-2" value={editForm.project_name} onChange={e=>updateEditField('project_name', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Land Area (sqm)</label>
                  <input type="number" step="0.01" className="mt-1 w-full border rounded p-2" value={editForm.land_area} onChange={e=>updateEditField('land_area', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Total Blocks</label>
                  <input type="number" className="mt-1 w-full border rounded p-2" value={editForm.total_blocks} onChange={e=>updateEditField('total_blocks', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Total Lots</label>
                  <input type="number" className="mt-1 w-full border rounded p-2" value={editForm.total_lots} onChange={e=>updateEditField('total_lots', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Barangay</label>
                  <input className="mt-1 w-full border rounded p-2" value={editForm.barangay} onChange={e=>updateEditField('barangay', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm text-gray-700">Year Started</label>
                  <input className="mt-1 w-full border rounded p-2" value={editForm.year_started} onChange={e=>updateEditField('year_started', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700">Description</label>
                  <textarea className="mt-1 w-full border rounded p-2" rows={3} value={editForm.description} onChange={e=>updateEditField('description', e.target.value)} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm text-gray-700">Replace Image</label>
                  <input type="file" accept="image/*" className="mt-1 w-full" onChange={e=>updateEditField('proj_image', e.target.files?.[0] || null)} />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button className="px-3 py-1 border rounded-xl" onClick={() => setEditOpen(false)}>Cancel</button>
                <button className="px-3 py-1 bg-emerald-600 text-white rounded-xl" onClick={saveEdit} disabled={savingEdit}>{savingEdit ? 'Saving…' : 'Save Changes'}</button>
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
