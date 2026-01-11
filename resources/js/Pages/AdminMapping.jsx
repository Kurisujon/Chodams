import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

export default function AdminMapping() {
  const [mapPoints, setMapPoints] = useState([])
  const [mapScope, setMapScope] = useState('all')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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

  const ensureLeafletCluster = () => new Promise((resolve) => {
    if (window.L && window.L.markerClusterGroup) { resolve(); return }
    const onReady = () => resolve()
    let link1 = document.querySelector('link[data-leaflet-cluster-css]')
    if (!link1) {
      link1 = document.createElement('link')
      link1.rel = 'stylesheet'
      link1.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css'
      link1.setAttribute('data-leaflet-cluster-css','1')
      document.head.appendChild(link1)
    }
    let link2 = document.querySelector('link[data-leaflet-cluster-default-css]')
    if (!link2) {
      link2 = document.createElement('link')
      link2.rel = 'stylesheet'
      link2.href = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css'
      link2.setAttribute('data-leaflet-cluster-default-css','1')
      document.head.appendChild(link2)
    }
    const existing = document.querySelector('script[data-leaflet-cluster]')
    if (existing) { existing.addEventListener('load', onReady); return }
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js'
    script.async = true
    script.setAttribute('data-leaflet-cluster','1')
    script.onload = onReady
    document.head.appendChild(script)
  })

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    fetchMapPoints(mapScope)
  }, [mapScope])

  async function fetchMapPoints(scope = mapScope) {
    const res = await axios.get('/admin/api/map-points', { params: { scope, mode: 'survey' } })
    setMapPoints(res.data.points || [])
  }

  useEffect(() => {
    if (!mapRef.current) return
    if (!mapPoints || mapPoints.length === 0) return
    ensureLeaflet().then(() => ensureLeafletCluster().then(() => {
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
      const cluster = window.L.markerClusterGroup({
        showCoverageOnHover: false,
        maxClusterRadius: 40,
        iconCreateFunction: (grp) => {
          const count = grp.getChildCount()
          let size = 28
          if (count >= 50) size = 40
          else if (count >= 10) size = 32
          const html = `<div style="background:#10B981;color:#fff;border-radius:9999px;border:2px solid #ECFDF5;width:${size}px;height:${size}px;display:flex;align-items:center;justify-content:center;font-weight:700;letter-spacing:0.2px">${count}</div>`
          return window.L.divIcon({ html, className: 'cluster-icon', iconSize: [size, size] })
        }
      })
      valid.forEach(p => {
        const dotHtml = `<span style="display:block;width:14px;height:14px;background:#10B981;border:2px solid #ECFDF5;border-radius:9999px"></span>`
        const marker = window.L.marker([p.lat, p.lng], {
          icon: window.L.divIcon({ className: 'dot-icon', html: dotHtml, iconSize: [16,16], iconAnchor: [8,8] })
        })
        marker.on('click', () => {
          const name = p.name || 'Unknown'
          const cls = p.classification || 'Unknown'
          const status = p.is_submitted === 1 ? 'Validated' : (p.is_submitted === 2 ? 'Assigned' : '')
          const tag = p.tag_number ? `<div style="margin-top:4px;background:#f0fdf4;color:#047857;padding:3px 8px;border-radius:6px;font-size:12px;display:inline-block">Tag: ${p.tag_number}</div>` : ''
          const house = p.photo_url 
            ? `<img src="${p.photo_url}" alt="House Photo" loading="lazy" style="width:100%;border-radius:8px;border:1px solid #e5e7eb"/>`
            : `<div style="font-size:12px;color:#9ca3af;padding:12px;background:#f3f4f6;border-radius:8px;text-align:center;border:1px dashed #e5e7eb">No house photo</div>`
          const person = p.person_photo_url 
            ? `<img src="${p.person_photo_url}" alt="Person Photo" loading="lazy" style="width:100%;border-radius:8px;border:1px solid #e5e7eb"/>`
            : `<div style="font-size:12px;color:#9ca3af;padding:12px;background:#f3f4f6;border-radius:8px;text-align:center;border:1px dashed #e5e7eb">No person photo</div>`
          const html = `
            <div style="min-width:280px">
              <div style="display:flex;align-items:center;justify-content:space-between">
                <div style="font-weight:700;color:#065f46;font-size:14px">${name}</div>
                <div style="display:flex;gap:6px;align-items:center">${status ? `<span style="background:${p.is_submitted===2?'#eff6ff':'#ecfdf5'};color:${p.is_submitted===2?'#1d4ed8':'#065f46'};padding:4px 8px;border-radius:9999px;font-size:11px">${status}</span>` : ''}</div>
              </div>
              <div style="margin-top:6px;display:flex;gap:6px;align-items:center;flex-wrap:wrap">
                <span style="background:#ecfdf5;color:#065f46;padding:4px 8px;border-radius:9999px;font-size:11px">${cls}</span>
                ${tag}
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:10px">
                <div>
                  <div style="font-size:11px;color:#374151;margin-bottom:4px">House</div>
                  ${house}
                </div>
                <div>
                  <div style="font-size:11px;color:#374151;margin-bottom:4px">Person</div>
                  ${person}
                </div>
              </div>
            </div>
          `
          if (marker.getPopup()) marker.unbindPopup()
          marker.bindPopup(html, { maxWidth: 360, className: 'custom-popup' }).openPopup()
        })
        cluster.addLayer(marker)
      })
      map.addLayer(cluster)
      setTimeout(() => { map.invalidateSize() }, 100)
      setTimeout(() => { map.invalidateSize() }, 400)
      leafletMap.current = map
    }))
  }, [mapPoints])

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
          <Link href="/admin/mapping" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/mapping') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/projectsiteicon.png" alt="Mapping" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Mapping</span>
          </Link>
          <Link href="/admin/profile" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/profile') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/profileicon.png" alt="Profile" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">My Profile</span>
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
              <Link href="/admin/mapping" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/mapping') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
                <img src="/icons/projectsiteicon.png" alt="Mapping" className="w-5 h-5"/>
                <span className="tracking-wider uppercase text-xs">Mapping</span>
              </Link>
              <Link href="/admin/profile" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/profile') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
                <img src="/icons/profileicon.png" alt="Profile" className="w-5 h-5"/>
                <span className="tracking-wider uppercase text-xs">My Profile</span>
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
          <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
            <div>
              <div className="text-sm text-gray-500">Hello Admin!</div>
              <h2 className="text-2xl text-emerald-800 font-semibold">Mapping</h2>
              <div className="text-xs text-gray-500">View beneficiary locations on the map</div>
            </div>
          </header>
        </DashboardFade>

        <DashboardFade delay={200}>
          <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 min-h-[340px]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-emerald-800">Map</h3>
              <div className="flex items-center gap-1 bg-emerald-50 p-1 rounded-xl ring-1 ring-emerald-100">
                <button onClick={() => setMapScope('all')} className={`px-3 py-1 rounded-lg text-xs ${mapScope==='all' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-emerald-700 hover:bg-emerald-100'}`}>All</button>
                <button onClick={() => setMapScope('validated')} className={`px-3 py-1 rounded-lg text-xs ${mapScope==='validated' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-emerald-700 hover:bg-emerald-100'}`}>Validated</button>
                <button onClick={() => setMapScope('assigned')} className={`px-3 py-1 rounded-lg text-xs ${mapScope==='assigned' ? 'bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-200' : 'text-emerald-700 hover:bg-emerald-100'}`}>Assigned</button>
              </div>
            </div>
            <div
              ref={mapRef}
              className="mt-4 aspect-square w-full rounded-xl overflow-hidden border"
            />
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

