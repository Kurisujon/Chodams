// resources/js/Pages/AdminDashboard.jsx
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'

export default function AdminDashboard() {
  const [totals, setTotals] = useState({ total_validated: 0, total_approved: 0 })
  const [barangayData, setBarangayData] = useState([])
  const [classificationData, setClassificationData] = useState({})
  const [subclassDisplacedData, setSubclassDisplacedData] = useState([])
  const [subclassDoubleUpData, setSubclassDoubleUpData] = useState([])

  const [showBarangay, setShowBarangay] = useState(false)
  const [showClassification, setShowClassification] = useState(true)
  const [showDisplaced, setShowDisplaced] = useState(false)
  const [showDoubleUp, setShowDoubleUp] = useState(false)

  const barangayRef = useRef(null)
  const classificationRef = useRef(null)
  const displacedRef = useRef(null)
  const doubleUpRef = useRef(null)

  const barangayChart = useRef(null)
  const classificationChart = useRef(null)
  const displacedChart = useRef(null)
  const doubleUpChart = useRef(null)

  useEffect(() => {
    fetchTotals()
    fetchBarangay()
    fetchClassification()
    fetchSubclassDisplaced()
    fetchSubclassDoubleUp()
  }, [])

  async function fetchTotals() {
    const res = await axios.get('/admin/api/totals')
    setTotals(res.data)
  }
  async function fetchBarangay() {
    const res = await axios.get('/admin/api/barangay')
    setBarangayData(res.data.data || [])
  }
  async function fetchClassification() {
    const res = await axios.get('/admin/api/classification')
    setClassificationData(res.data.classificationData || {})
  }
  async function fetchSubclassDisplaced() {
    const res = await axios.get('/admin/api/subclass-displaced')
    setSubclassDisplacedData(res.data.data || [])
  }
  async function fetchSubclassDoubleUp() {
    const res = await axios.get('/admin/api/subclass-doubleup')
    setSubclassDoubleUpData(res.data.data || [])
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
      options: { responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom' } }, animation: { duration: 800 } }
    })
  }, [barangayData])

  useEffect(() => {
    if (!window.Chart) return
    if (classificationChart.current) classificationChart.current.destroy()
    if (!classificationRef.current) return
    const barangays = Array.from(new Set(Object.values(classificationData).flatMap(m => Object.keys(m || {}))))
    const classKeys = Object.keys(classificationData)
    const colors = emeraldColors(classKeys.length)
    const datasets = classKeys.map((k, idx) => ({
      label: k,
      data: barangays.map(b => Number((classificationData[k] || {})[b]) || 0),
      backgroundColor: colors[idx],
      borderRadius: 8,
      maxBarThickness: 30
    }))
    classificationChart.current = new window.Chart(classificationRef.current, {
      type: 'bar',
      data: { labels: barangays, datasets },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { stacked: true, grid: { color: 'rgba(16,185,129,0.1)' }, ticks: { color: '#374151' } },
          y: { stacked: true, grid: { display: false }, ticks: { color: '#374151' } }
        },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } },
        animation: { duration: 800 }
      }
    })
  }, [classificationData])

  useEffect(() => {
    if (!window.Chart) return
    if (displacedChart.current) displacedChart.current.destroy()
    if (!displacedRef.current) return
    const subclasses = Array.from(new Set(subclassDisplacedData.map(i => i.subclass_displaced || 'Unknown')))
    const barangays = Array.from(new Set(subclassDisplacedData.map(i => i.barangay || 'Unknown')))
    const datasets = subclasses.map((sub, idx) => ({
      label: sub,
      data: barangays.map(b => {
        const row = subclassDisplacedData.find(r => (r.barangay || 'Unknown') === b && (r.subclass_displaced || 'Unknown') === sub)
        return Number(row?.count) || 0
      }),
      backgroundColor: `hsl(${(idx * 360) / (subclasses.length || 1)},70%,50%)`
    }))
    displacedChart.current = new window.Chart(displacedRef.current, {
      type: 'bar',
      data: { labels: barangays, datasets },
      options: { responsive: true, scales: { x: { stacked: true }, y: { beginAtZero: true, stacked: true } }, plugins: { legend: { display: true } } }
    })
  }, [subclassDisplacedData])

  useEffect(() => {
    if (!window.Chart) return
    if (doubleUpChart.current) doubleUpChart.current.destroy()
    if (!doubleUpRef.current) return
    const subclasses = Array.from(new Set(subclassDoubleUpData.map(i => i.subclass_doubleup || 'Unknown')))
    const barangays = Array.from(new Set(subclassDoubleUpData.map(i => i.barangay || 'Unknown')))
    const datasets = subclasses.map((sub, idx) => ({
      label: sub,
      data: barangays.map(b => {
        const row = subclassDoubleUpData.find(r => (r.barangay || 'Unknown') === b && (r.subclass_doubleup || 'Unknown') === sub)
        return Number(row?.count) || 0
      }),
      backgroundColor: `hsl(${(idx * 360) / (subclasses.length || 1)},70%,50%)`
    }))
    doubleUpChart.current = new window.Chart(doubleUpRef.current, {
      type: 'bar',
      data: { labels: barangays, datasets },
      options: { responsive: true, scales: { x: { stacked: true }, y: { beginAtZero: true, stacked: true } }, plugins: { legend: { display: true } } }
    })
  }, [subclassDoubleUpData])

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 bg-white text-gray-700 p-4 border-r border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">C</div>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <ul className="space-y-1">
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800 cursor-pointer"><Link href="/admin/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/beneficiaries" className="block">Beneficiaries</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><Link href="/admin/profile" className="block">Profile</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700 cursor-pointer"><a href="#">About</a></li>
          <li className="px-2 py-3 rounded hover:bg-red-50 text-red-700 cursor-pointer mt-20"><Link href="/admin/logout" method="post" as="button" className="w-full text-left">Log out</Link></li>
        </ul>
      </aside>

      <main className="flex-1 p-6 bg-gray-100">
        <header className="flex justify-between items-center bg-white p-4 rounded shadow">
          <div>
            <div className="text-sm text-gray-500">Hello Admin!</div>
            <h2 className="text-2xl text-emerald-800 font-semibold">Welcome back to dashboard.</h2>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-full border text-emerald-700"><i className="far fa-bell"></i><span className="absolute -top-1 -right-1 text-xs bg-red-500 text-white rounded-full px-1">4</span></button>
            <button className="p-2 rounded-full border text-emerald-700"><i className="far fa-envelope"></i></button>
            <img src="/image/greenlogo1.jpg" alt="logo" className="h-10 w-10 rounded-full object-cover"/>
          </div>
        </header>

        <section className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button onClick={() => setShowBarangay(v => !v)} className="text-left bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21v-6a4 4 0 014-4h10a4 4 0 014 4v6"/><path d="M7 7a4 4 0 118 0"/></svg>
              </div>
              <div className="mt-4 text-3xl font-mono text-gray-900">{barangayData.length}</div>
              <div className="mt-1 text-sm text-gray-600">Barangay</div>
              <div className="mt-1 text-xs text-gray-500">Tap to view chart</div>
            </button>

            <div className="text-left bg-white rounded-2xl border border-gray-200 p-6 min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12a3 3 0 100-6 3 3 0 000 6z"/><path d="M3 21a9 9 0 0118 0"/></svg>
              </div>
              <div className="mt-4 text-3xl font-mono text-gray-900">{Object.keys(classificationData || {}).length}</div>
              <div className="mt-1 text-sm text-gray-600">Classification of ISF</div>
              <div className="mt-1 text-xs text-gray-500">Always visible</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div className="mt-4 text-3xl font-mono text-gray-900">{totals.total_validated}</div>
              <div className="mt-1 text-sm text-gray-600">Total Validated</div>
              <div className="mt-1 text-xs text-gray-500">Updated recently</div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 min-h-[160px]">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div className="mt-4 text-3xl font-mono text-gray-900">{totals.total_approved}</div>
              <div className="mt-1 text-sm text-gray-600">Total Approved</div>
              <div className="mt-1 text-xs text-gray-500">Updated recently</div>
            </div>
          </div>
        </section>

        <section className={`mt-6 bg-white rounded-2xl border border-gray-200 p-6 ${!showBarangay && 'hidden'}`}>
          <div className="max-w-4xl mx-auto">
            <h3 className="text-lg font-semibold text-emerald-800 mb-4">Barangay Overview</h3>
            <canvas ref={barangayRef} style={{ height: 340 }} />
            <p className="mt-3 text-center text-sm text-gray-700">
              {barangayData.length > 0 ? `Barangay ${[...barangayData].sort((a,b)=>b.count-a.count)[0].barangay} has the highest number.` : 'Report will appear here...'}
            </p>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`bg-white rounded-2xl border border-gray-200 p-6 ${!showClassification && 'hidden'} md:col-span-2`}>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-emerald-800">Classification of ISF</h3>
              <span className="text-xs text-gray-500">Stacked overview</span>
            </div>
            <canvas ref={classificationRef} style={{ height: 240 }} />
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900">Distribution Map</h3>
            <p className="text-xs text-gray-500">Last updated: 7 days ago</p>
            <div className="relative mt-4 h-56">
              <img src="https://upload.wikimedia.org/wikipedia/commons/8/83/World_map_blank_without_borders.svg" alt="World map" className="absolute inset-0 w-full h-full object-contain opacity-80" />
              <span className="absolute w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" style={{ top: '35%', left: '30%' }}></span>
              <span className="absolute w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" style={{ top: '50%', left: '55%' }}></span>
              <span className="absolute w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" style={{ top: '60%', left: '45%' }}></span>
              <span className="absolute w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" style={{ top: '30%', left: '70%' }}></span>
              <span className="absolute w-3 h-3 rounded-full bg-emerald-600 border-2 border-white" style={{ top: '70%', left: '20%' }}></span>
            </div>
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`bg-white rounded shadow p-6 ${!showDisplaced && 'hidden'}`}>
            <div className="mb-2 font-medium text-emerald-800">Subclass Displaced</div>
            <canvas ref={displacedRef} />
          </div>
          <div className={`bg-white rounded shadow p-6 ${!showDoubleUp && 'hidden'}`}>
            <div className="mb-2 font-medium text-emerald-800">Subclass Double-Up</div>
            <canvas ref={doubleUpRef} />
          </div>
          <div className="flex gap-3">
            <button className="px-3 py-2 border rounded text-emerald-800" onClick={() => setShowDisplaced(v=>!v)}>Toggle Displaced</button>
            <button className="px-3 py-2 border rounded text-emerald-800" onClick={() => setShowDoubleUp(v=>!v)}>Toggle Double-Up</button>
          </div>
        </section>
      </main>
    </div>
  )
}
  function emeraldColors(n) {
    const baseHue = 158
    return Array.from({ length: n }, (_, i) => `hsl(${baseHue},70%,${60 - i * (30 / Math.max(n, 1))}%)`)
  }