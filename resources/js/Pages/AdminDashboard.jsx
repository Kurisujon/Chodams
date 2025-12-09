// resources/js/Pages/AdminDashboard.jsx
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import Modal from '../Components/Modal'

export default function AdminDashboard() {
  const [totals, setTotals] = useState({ total_validated: 0, total_approved: 0 })
  const [barangayData, setBarangayData] = useState([])
  const [classificationData, setClassificationData] = useState({})
  const [overallClassificationData, setOverallClassificationData] = useState({})
  const [subclassDisplacedData, setSubclassDisplacedData] = useState([])
  const [subclassDoubleUpData, setSubclassDoubleUpData] = useState([])
  const [subclassHomelessData, setSubclassHomelessData] = useState([])
  const [mapPoints, setMapPoints] = useState([])
  const [assignedCount, setAssignedCount] = useState(0)

  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showAllNotifs, setShowAllNotifs] = useState(false)
  const [notifModal, setNotifModal] = useState({ open: false, item: null })
  const [showNotifPanel, setShowNotifPanel] = useState(false)

  const [showBarangay, setShowBarangay] = useState(false)
  const [showClassification, setShowClassification] = useState(true)
  const [showBarangayDesc, setShowBarangayDesc] = useState(false)
  const [showClassificationDesc, setShowClassificationDesc] = useState(false)
  const [showDisplacedDesc, setShowDisplacedDesc] = useState(false)
  const [showDoubleUpDesc, setShowDoubleUpDesc] = useState(false)
  const [showHomelessDesc, setShowHomelessDesc] = useState(false)
  const [classificationPeriod, setClassificationPeriod] = useState({ start: 2023, end: 2024 })
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const barangayRef = useRef(null)
  const classificationRef = useRef(null)
  const overallClassificationRef = useRef(null)
  const displacedRef = useRef(null)
  const doubleUpRef = useRef(null)
  const homelessRef = useRef(null)
  const mapRef = useRef(null)
  const leafletMap = useRef(null)
  const ensureLeaflet = () => new Promise((resolve) => {
    if (window.L) { resolve(); return }
    const onReady = () => resolve()
    const existing = document.querySelector('script[data-leaflet]')
    if (existing) { existing.addEventListener('load', onReady); return }
    let link = document.querySelector('link[data-leaflet-css]')
    if (!link) {
      link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      link.setAttribute('data-leaflet-css','1')
      document.head.appendChild(link)
    }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.setAttribute('data-leaflet','1')
    script.onload = onReady
    document.head.appendChild(script)
  })

  const barangayChart = useRef(null)
  const classificationChart = useRef(null)
  const overallClassificationChart = useRef(null)
  const displacedChart = useRef(null)
  const doubleUpChart = useRef(null)
  const homelessChart = useRef(null)

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    fetchTotals()
    fetchBarangay()
    fetchClassification(classificationPeriod)
    fetchClassificationOverall()
    fetchSubclassDisplaced()
    fetchSubclassDoubleUp()
    fetchSubclassHomeless()
    fetchMapPoints()
    fetchAssignedCount()
    fetchNotifications()
  }, [])

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    const refresh = () => { fetchTotals(); fetchAssignedCount() }
    const id = setInterval(refresh, 30000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [])

  async function fetchTotals() {
    const res = await axios.get('/admin/api/totals')
    setTotals(res.data)
  }
  async function fetchBarangay() {
    const res = await axios.get('/admin/api/barangay')
    setBarangayData(res.data.data || [])
  }
  async function fetchClassification(period = classificationPeriod) {
    const res = await axios.get('/admin/api/classification', { params: { start_year: period.start, end_year: period.end } })
    setClassificationData(res.data.classificationData || {})
  }

  async function fetchClassificationOverall() {
    const res = await axios.get('/admin/api/classification')
    setOverallClassificationData(res.data.classificationData || {})
  }

  useEffect(() => {
    fetchClassification(classificationPeriod)
  }, [classificationPeriod])
  async function fetchSubclassDisplaced() {
    const res = await axios.get('/admin/api/subclass-displaced')
    setSubclassDisplacedData(res.data.data || [])
  }
  async function fetchSubclassDoubleUp() {
    const res = await axios.get('/admin/api/subclass-doubleup')
    setSubclassDoubleUpData(res.data.data || [])
  }
  async function fetchSubclassHomeless() {
    const res = await axios.get('/admin/api/subclass-homeless')
    setSubclassHomelessData(res.data.data || [])
  }
  async function fetchMapPoints() {
    const res = await axios.get('/admin/api/map-points', { params: { scope: 'all', mode: 'survey' } })
    setMapPoints(res.data.points || [])
  }
  async function fetchAssignedCount() {
    const res = await axios.get('/admin/api/assignments')
    setAssignedCount((res.data.data || []).length)
  }


  async function fetchNotifications(limit = 10) {
    const res = await axios.get('/admin/api/notifications', { params: { limit } })
    setNotifications(res.data.data || [])
  }

  async function markNotificationRead(id) {
    try { await axios.post('/admin/api/notifications/read', { id }) } catch (e) {}
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  async function fetchProfile() {
    try {
      const res = await axios.get('/admin/api/profile')
      setProfile(res.data.profile)
    } catch (e) {}
  }

  useEffect(() => {
    if (!window.Chart) return
    if (barangayChart.current) barangayChart.current.destroy()
    if (!barangayRef.current) return
    const top = [...barangayData].sort((a, b) => (Number(b.count || 0) - Number(a.count || 0))).slice(0, 10)
    const labels = top.map(i => i.barangay || 'Unknown')
    const values = top.map(i => Number(i.count) || 0)
    const colors = emeraldColors(labels.length)
    barangayChart.current = new window.Chart(barangayRef.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2, hoverOffset: 6 }] },
      options: { responsive: true, cutout: '78%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } }, animation: { duration: 800 } }
    })
  }, [barangayData])

  useEffect(() => {
    if (!window.Chart) return
    if (classificationChart.current) classificationChart.current.destroy()
    if (!classificationRef.current) return
    const classKeys = Object.keys(classificationData)
    const values = classKeys.map(k => Object.values(classificationData[k] || {}).reduce((s,v) => s + Number(v||0), 0))
    const colors = emeraldColors(classKeys.length)
    classificationChart.current = new window.Chart(classificationRef.current, {
      type: 'doughnut',
      data: { labels: classKeys, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2, hoverOffset: 6 }] },
      options: { responsive: true, cutout: '68%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } }, animation: { duration: 800 } }
    })
  }, [classificationData])

  useEffect(() => {
    if (!window.Chart) return
    if (overallClassificationChart.current) overallClassificationChart.current.destroy()
    if (!overallClassificationRef.current) return
    const classKeys = Object.keys(overallClassificationData)
    const values = classKeys.map(k => Object.values(overallClassificationData[k] || {}).reduce((s,v) => s + Number(v||0), 0))
    const colors = emeraldColors(classKeys.length)
    overallClassificationChart.current = new window.Chart(overallClassificationRef.current, {
      type: 'doughnut',
      data: { labels: classKeys, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2, hoverOffset: 6 }] },
      options: { responsive: true, cutout: '78%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } }, animation: { duration: 800 } }
    })
  }, [overallClassificationData])

  useEffect(() => {
    if (!window.Chart) return
    if (displacedChart.current) displacedChart.current.destroy()
    if (!displacedRef.current) return
    const subclasses = Array.from(new Set(subclassDisplacedData.map(i => i.subclass_displaced || 'Unknown')))
    const barangays = Array.from(new Set(subclassDisplacedData.map(i => i.barangay || 'Unknown')))
    const colors = emeraldColors(subclasses.length)
    const datasets = subclasses.map((sub, idx) => ({
      label: sub,
      data: barangays.map(b => {
        const row = subclassDisplacedData.find(r => (r.barangay || 'Unknown') === b && (r.subclass_displaced || 'Unknown') === sub)
        return Number(row?.count) || 0
      }),
      backgroundColor: colors[idx],
      borderRadius: 8,
      maxBarThickness: 22
    }))
    displacedChart.current = new window.Chart(displacedRef.current, {
      type: 'bar',
      data: { labels: barangays, datasets },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: 'rgba(16,185,129,0.1)' }, ticks: { display: false, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: '#374151' } }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            callbacks: {
              title: (items) => items[0].label,
              label: (item) => `${item.dataset.label}: ${item.raw}`
            }
          }
        },
        animation: { duration: 800 }
      }
    })
  }, [subclassDisplacedData])

  useEffect(() => {
    if (!window.Chart) return
    if (doubleUpChart.current) doubleUpChart.current.destroy()
    if (!doubleUpRef.current) return
    const subclasses = Array.from(new Set(subclassDoubleUpData.map(i => i.subclass_doubleup || 'Unknown')))
    const barangays = Array.from(new Set(subclassDoubleUpData.map(i => i.barangay || 'Unknown')))
    const colors = emeraldColors(subclasses.length)
    const datasets = subclasses.map((sub, idx) => ({
      label: sub,
      data: barangays.map(b => {
        const row = subclassDoubleUpData.find(r => (r.barangay || 'Unknown') === b && (r.subclass_doubleup || 'Unknown') === sub)
        return Number(row?.count) || 0
      }),
      backgroundColor: colors[idx],
      borderRadius: 8,
      maxBarThickness: 22
    }))
    doubleUpChart.current = new window.Chart(doubleUpRef.current, {
      type: 'bar',
      data: { labels: barangays, datasets },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: 'rgba(16,185,129,0.1)' }, ticks: { display: false, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: '#374151' } }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            callbacks: {
              title: (items) => items[0].label,
              label: (item) => `${item.dataset.label}: ${item.raw}`
            }
          }
        },
        animation: { duration: 800 }
      }
    })
  }, [subclassDoubleUpData])

  useEffect(() => {
    if (!window.Chart) return
    if (homelessChart.current) homelessChart.current.destroy()
    if (!homelessRef.current) return
    const subclasses = Array.from(new Set(subclassHomelessData.map(i => i.subclass_homeless || 'Unknown')))
    const barangays = Array.from(new Set(subclassHomelessData.map(i => i.barangay || 'Unknown')))
    const colors = emeraldColors(subclasses.length)
    const datasets = subclasses.map((sub, idx) => ({
      label: sub,
      data: barangays.map(b => {
        const row = subclassHomelessData.find(r => (r.barangay || 'Unknown') === b && (r.subclass_homeless || 'Unknown') === sub)
        return Number(row?.count) || 0
      }),
      backgroundColor: colors[idx],
      borderRadius: 8,
      maxBarThickness: 22
    }))
    homelessChart.current = new window.Chart(homelessRef.current, {
      type: 'bar',
      data: { labels: barangays, datasets },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: 'rgba(16,185,129,0.1)' }, ticks: { display: false, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: '#374151' } }
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle' }
          },
          tooltip: {
            callbacks: {
              title: (items) => items[0].label,
              label: (item) => `${item.dataset.label}: ${item.raw}`
            }
          }
        },
        animation: { duration: 800 }
      }
    })
  }, [subclassHomelessData])

  useEffect(() => {
    if (!mapRef.current) return
    if (!mapPoints || mapPoints.length === 0) return
    ensureLeaflet().then(() => {
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }
      const valid = mapPoints.filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
      const digosBounds = [[6.75, 125.35], [6.85, 125.45]]
      const map = window.L.map(mapRef.current, { preferCanvas: true })
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
      if (valid.length > 0) {
        const bounds = window.L.latLngBounds(valid.map(p => [p.lat, p.lng]))
        const pad = 0.05
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        const paddedBounds = window.L.latLngBounds([sw.lat - pad, sw.lng - pad],[ne.lat + pad, ne.lng + pad])
        map.fitBounds(paddedBounds)
      } else {
        map.fitBounds(window.L.latLngBounds(digosBounds))
      }
      valid.forEach(p => {
        const marker = window.L.circleMarker([p.lat, p.lng], { radius: 8, color: '#10B981', fillColor: '#10B981', fillOpacity: 0.6 })
        marker.on('click', () => {
          const name = p.name || 'Unknown'
          const cls = p.classification || 'Unknown'
          const img = p.photo_url 
            ? `<img src="${p.photo_url}" alt="House Photo" loading="lazy" style="width:100%;max-width:220px;border-radius:8px;margin-top:8px;border:1px solid #e5e7eb"/>`
            : `<div style="font-size:12px;color:#9ca3af;margin-top:8px;padding:12px;background:#f3f4f6;border-radius:8px;text-align:center;">No house photo</div>`
          const html = `
            <div style="min-width:220px">
              <div style="font-weight:700;color:#065f46;font-size:14px">${name}</div>
              <div style="margin-top:4px;background:#ecfdf5;color:#065f46;padding:4px 8px;border-radius:6px;font-size:12px;display:inline-block">${cls}</div>
              ${img}
            </div>
          `
          marker.bindPopup(html, { maxWidth: 280, className: 'custom-popup' }).openPopup()
        })
        marker.addTo(map)
      })
      setTimeout(() => { map.invalidateSize() }, 100)
      setTimeout(() => { map.invalidateSize() }, 400)
      leafletMap.current = map
    })
  }, [mapPoints])

  

  

  return (
    <div className="flex h-screen overflow-hidden">
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
          <a href="#" className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-gray-100 hover:text-emerald-700">
            <img src="/icons/abouticon.png" alt="About" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">About</span>
          </a>
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

      <main className="flex-1 h-screen overflow-y-auto p-6 bg-gray-50">
        <div className="md:hidden mb-4 flex items-center justify-between">
          <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <span className="text-sm font-semibold text-emerald-800">Menu</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          <div className="md:col-span-9 relative">
            <input type="text" placeholder="Search" className="w-full rounded-2xl bg-white text-gray-900 px-4 py-3 pl-12 ring-2 ring-emerald-300 focus:ring-2 focus:ring-emerald-400 outline-none shadow-sm" />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>
          </div>
          <div className="md:col-span-3 flex md:justify-end">
            <div className="relative">
              <button onClick={() => setShowNotifPanel(v => !v)} className="px-3 py-3 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700 hover:ring-emerald-400 flex items-center gap-2 shadow-sm relative" aria-label="Notifications">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                {notifications.some(n => !n.read) && (<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>)}
              </button>
              {showNotifPanel && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-2xl shadow-lg p-3 z-10">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-semibold text-emerald-800">Notifications</div>
                    <button className="p-2 rounded-full hover:bg-emerald-50 text-emerald-700" onClick={() => setShowNotifPanel(false)} aria-label="Close">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
                    </button>
                  </div>
                  <div className="space-y-2 mt-2">
                    {(showAllNotifs ? notifications : notifications.slice(0,5)).map(item => (
                      <button
                        key={item.id}
                        onClick={() => { setNotifModal({ open: true, item }); markNotificationRead(item.id) }}
                        className={`w-full flex items-center gap-3 text-left rounded-xl p-2 ${item.read ? 'bg-white' : 'bg-gray-100'}`}
                      >
                        <img src={'/icons/appicon1.png'} alt="alert" className="w-9 h-9 rounded-xl object-cover"/>
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                          <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => { const next = !showAllNotifs; setShowAllNotifs(next); if (next) fetchNotifications(50); }}
                    className="w-full mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-normal"
                  >
                    {showAllNotifs ? 'Show fewer' : 'Show more'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-4 relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm opacity-90">Welcome back, Admin!</div>
              <div className="mt-2 text-xs opacity-85">Today is {new Date().toLocaleDateString()}. You have <span className="font-semibold">{totals.total_validated}</span> new validated forms awaiting your review.</div>
            </div>
            <div className="hidden md:flex items-center gap-3 text-white/90">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="3"/><path d="M7 8h10M7 12h6"/></svg>
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20l9-16H3l9 16z"/></svg>
            </div>
          </div>
        </div>


        <section className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button type="button" onClick={() => setShowBarangay(v => !v)} className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[160px] w-full">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="3"/><path d="M7 8h10M7 12h6"/></svg>
              </div>
              <div className="mt-4 text-3xl font-semibold text-gray-900">{totals.total_overall || 0}</div>
              <div className="mt-1 text-sm text-gray-600">Overall Data</div>
              <div className="mt-1 text-xs text-emerald-600">Tap to view chart</div>
            </button>

            <div className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div className="mt-4 text-3xl font-semibold text-gray-900">{totals.total_validated}</div>
              <div className="mt-1 text-sm text-gray-600">Total Validated</div>
              <div className="mt-1 text-xs text-gray-500">Awaiting review</div>
            </div>


            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6H9l-2 4H4v8h16V6z"/><path d="M6 14h4M10 10v4"/></svg>
              </div>
              <div className="mt-4 text-3xl font-semibold text-gray-900">{assignedCount}</div>
              <div className="mt-1 text-sm text-gray-600">Total Assigned</div>
              <div className="mt-1 text-xs text-gray-500">Across all projects</div>
            </div>
          </div>
        </section>

        <section className={`mt-6 bg-white rounded-2xl border border-gray-200 p-6 ${!showBarangay && 'hidden'}`}>
          <div className="max-w-3xl mx-auto">
            <h3 className="text-lg font-semibold text-emerald-800 mb-4">Overall Overview</h3>
            <canvas ref={overallClassificationRef} style={{ height: 160 }} />
            <div className="mt-3 text-center">
              <button
                onClick={() => setShowBarangayDesc(v => !v)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
              >
                {showBarangayDesc ? 'Hide summary' : 'Show summary'}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {showBarangayDesc && (
                <p className="mt-2 text-sm text-gray-700">
                  {describeClassification(overallClassificationData)}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`bg-white rounded-2xl border border-gray-200 p-6 min-h-[340px] ${!showClassification && 'hidden'}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-emerald-800">By Year Summary ({classificationPeriod.start} - {classificationPeriod.end})</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">By classification</span>
                  <select
                    value={`${classificationPeriod.start}-${classificationPeriod.end}`}
                    onChange={(e) => {
                      const [s,e2] = e.target.value.split('-').map(v => Number(v.trim()))
                      setClassificationPeriod({ start: s, end: e2 })
                    }}
                    className="text-xs rounded-xl bg-white ring-1 ring-emerald-200 px-2 py-1 text-emerald-700 hover:ring-emerald-300"
                  >
                    <option value="2023-2024">2023 - 2024</option>
                    <option value="2025-2026">2025 - 2026</option>
                    <option value="2027-2028">2027 - 2028</option>
                  </select>
                </div>
              </div>
              <canvas ref={classificationRef} style={{ height: 200 }} />
              <div className="mt-3">
                <button
                  onClick={() => setShowClassificationDesc(v => !v)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                >
                  {showClassificationDesc ? 'Hide summary' : 'Show summary'}
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                </button>
                {showClassificationDesc && (
                  <p className="mt-2 text-sm text-gray-700">{describeClassification(classificationData)}</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[340px]">
              <h3 className="text-lg font-semibold text-gray-900">Overall Distribution Map</h3>
              <p className="text-xs text-gray-500">All surveys</p>
              <div
                ref={mapRef}
                className="mt-4 aspect-square w-full rounded-xl overflow-hidden border"
              />
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="mb-2 font-medium text-emerald-800">Subclass Displaced</div>
            <canvas ref={displacedRef} />
            <div className="mt-3">
              <button
                onClick={() => setShowDisplacedDesc(v => !v)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
              >
                {showDisplacedDesc ? 'Hide summary' : 'Show summary'}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {showDisplacedDesc && (
                <p className="mt-2 text-sm text-gray-700">{describeDisplaced(subclassDisplacedData)}</p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="mb-2 font-medium text-emerald-800">Subclass Double-Up</div>
            <canvas ref={doubleUpRef} />
            <div className="mt-3">
              <button
                onClick={() => setShowDoubleUpDesc(v => !v)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
              >
                {showDoubleUpDesc ? 'Hide summary' : 'Show summary'}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {showDoubleUpDesc && (
                <p className="mt-2 text-sm text-gray-700">{describeDoubleUp(subclassDoubleUpData)}</p>
              )}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <div className="mb-2 font-medium text-emerald-800">Subclass Homeless</div>
            <canvas ref={homelessRef} />
            <div className="mt-3">
              <button
                onClick={() => setShowHomelessDesc(v => !v)}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
              >
                {showHomelessDesc ? 'Hide summary' : 'Show summary'}
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
              </button>
              {showHomelessDesc && (
                <p className="mt-2 text-sm text-gray-700">{describeHomeless(subclassHomelessData)}</p>
              )}
            </div>
          </div>
          
        </section>
      </main>

      {false && (
        <aside className="w-80 flex-shrink-0 bg-white text-gray-700 p-6 border-l border-gray-200 h-screen sticky top-0 overflow-hidden"></aside>
      )}

      
      <Modal show={notifModal.open} onClose={() => setNotifModal({ open: false, item: null })} maxWidth="sm" closeable={true}>
        <div className="p-6 bg-white">
          <div className="text-lg font-semibold text-emerald-800">Notification</div>
          <div className="mt-2 text-sm text-gray-700">
            {notifModal.item ? `${notifModal.item.name || 'Validator'} changed password on ${new Date(notifModal.item.created_at).toLocaleString()}.` : ''}
          </div>
          <div className="mt-4 flex justify-end">
            <button onClick={() => setNotifModal({ open: false, item: null })} className="px-4 py-2 bg-emerald-600 text-white rounded-lg">Close</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
  function emeraldColors(n) {
    const baseHue = 158
    return Array.from({ length: n }, (_, i) => `hsl(${baseHue},70%,${60 - i * (30 / Math.max(n, 1))}%)`)
  }
  function withAlpha(c, a) {
    return c.startsWith('hsl(') ? c.replace('hsl(', 'hsla(').replace(')', `, ${a})`) : c
  }
  function describeBarangay(data) {
    if (!data || data.length === 0) return 'Report will appear here once data is available.'
    const sorted = [...data].sort((a,b)=>Number(b.count||0)-Number(a.count||0))
    const total = sorted.reduce((s,i)=>s+Number(i.count||0),0)
    const top = sorted.slice(0,3)
    const low = sorted[sorted.length-1]
    const pct = (n)=> total? Math.round((n/total)*100):0
    return `${top[0].barangay} leads with ${top[0].count} (${pct(top[0].count)}%). ${top[1] ? top[1].barangay+' and '+top[2]?.barangay+' follow with '+(top[1].count)+' and '+(top[2]?.count||0)+'. ' : ''}${low ? 'Lowest is '+low.barangay+' ('+low.count+'). ' : ''}Total across barangays is ${total}.`
  }
  function describeClassification(map) {
    const keys = Object.keys(map||{})
    if (keys.length===0) return 'Report will appear here once data is available.'
    const totals = keys.map(k=>({k, t: Object.values(map[k]||{}).reduce((s,v)=>s+Number(v||0),0)}))
    const grand = totals.reduce((s,i)=>s+i.t,0)
    const sorted = totals.sort((a,b)=>b.t-a.t)
    const pct = (n)=> grand? Math.round((n/grand)*100):0
    const top = sorted[0]
    const topBarangay = Object.entries(map[top.k]||{}).sort((a,b)=>Number(b[1]||0)-Number(a[1]||0))[0]
    const tbName = topBarangay? topBarangay[0] : 'Unknown'
    const tbCount = topBarangay? Number(topBarangay[1]||0) : 0
    return `${top.k} is most prevalent with ${top.t} (${pct(top.t)}%). Highest concentration is in ${tbName} (${tbCount}). Combined total is ${grand}, with ${sorted.slice(1).map(i=>i.k+' '+i.t+' ('+pct(i.t)+'%)').join(', ')}.`
  }
  function describeDisplaced(rows) {
    if (!rows || rows.length===0) return 'Report will appear here once data is available.'
    const totals = {}
    rows.forEach(r=>{ const k = r.subclass_displaced||'Unknown'; totals[k]=(totals[k]||0)+Number(r.count||0) })
    const arr = Object.entries(totals).map(([k,v])=>({k, v}))
    const sum = arr.reduce((s,i)=>s+i.v,0)
    const sorted = arr.sort((a,b)=>b.v-a.v)
    const pct = (n)=> sum? Math.round((n/sum)*100):0
    const top = sorted[0]
    const topBarangay = rows.filter(r=>(r.subclass_displaced||'Unknown')===top.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const tbName = topBarangay? (topBarangay.barangay||'Unknown') : 'Unknown'
    const tbCount = topBarangay? Number(topBarangay.count||0) : 0
    const second = sorted[1]
    const secondBarangay = rows.filter(r=>(r.subclass_displaced||'Unknown')===second?.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const sbName = secondBarangay? (secondBarangay.barangay||'Unknown') : 'Unknown'
    const sbCount = secondBarangay? Number(secondBarangay.count||0) : 0
    return `Most displaced beneficiaries applied due to ${top.k} (${pct(top.v)}%), with highest concentration in ${tbName} (${tbCount}). ${second ? `${second.k} is the second highest cause, concentrated in ${sbName} (${sbCount}). ` : ''}Total Displaced subclasses recorded: ${sum}.`
  }
  function describeDoubleUp(rows) {
    if (!rows || rows.length===0) return 'Report will appear here once data is available.'
    const totals = {}
    rows.forEach(r=>{ const k = r.subclass_doubleup||'Unknown'; totals[k]=(totals[k]||0)+Number(r.count||0) })
    const arr = Object.entries(totals).map(([k,v])=>({k, v}))
    const sum = arr.reduce((s,i)=>s+i.v,0)
    const sorted = arr.sort((a,b)=>b.v-a.v)
    const pct = (n)=> sum? Math.round((n/sum)*100):0
    const top = sorted[0]
    const topBarangay = rows.filter(r=>(r.subclass_doubleup||'Unknown')===top.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const tbName = topBarangay? (topBarangay.barangay||'Unknown') : 'Unknown'
    const tbCount = topBarangay? Number(topBarangay.count||0) : 0
    const second = sorted[1]
    const secondBarangay = rows.filter(r=>(r.subclass_doubleup||'Unknown')===second?.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const sbName = secondBarangay? (secondBarangay.barangay||'Unknown') : 'Unknown'
    const sbCount = secondBarangay? Number(secondBarangay.count||0) : 0
    return `Most Double‑up households are due to ${top.k} (${pct(top.v)}%), concentrated in ${tbName} (${tbCount}). ${second ? `${second.k} ranks second, concentrated in ${sbName} (${sbCount}). ` : ''}Total Double‑up subclasses recorded: ${sum}.`
  }
  function describeHomeless(rows) {
    if (!rows || rows.length===0) return 'Report will appear here once data is available.'
    const totals = {}
    rows.forEach(r=>{ const k = r.subclass_homeless||'Unknown'; totals[k]=(totals[k]||0)+Number(r.count||0) })
    const arr = Object.entries(totals).map(([k,v])=>({k, v}))
    const sum = arr.reduce((s,i)=>s+i.v,0)
    const sorted = arr.sort((a,b)=>b.v-a.v)
    const pct = (n)=> sum? Math.round((n/sum)*100):0
    const top = sorted[0]
    const topBarangay = rows.filter(r=>(r.subclass_homeless||'Unknown')===top.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const tbName = topBarangay? (topBarangay.barangay||'Unknown') : 'Unknown'
    const tbCount = topBarangay? Number(topBarangay.count||0) : 0
    const second = sorted[1]
    const secondBarangay = rows.filter(r=>(r.subclass_homeless||'Unknown')===second?.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const sbName = secondBarangay? (secondBarangay.barangay||'Unknown') : 'Unknown'
    const sbCount = secondBarangay? Number(secondBarangay.count||0) : 0
    return `Most Homeless cases are due to ${top.k} (${pct(top.v)}%), concentrated in ${tbName} (${tbCount}). ${second ? `${second.k} ranks second, concentrated in ${sbName} (${sbCount}). ` : ''}Total Homeless subclasses recorded: ${sum}.`
  }
