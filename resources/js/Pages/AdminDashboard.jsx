// resources/js/Pages/AdminDashboard.jsx
import React, { Fragment, useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link } from '@inertiajs/react'
import Modal from '../Components/Modal'
import { Listbox, Transition } from '@headlessui/react'

const barangays = [
  'Aplaya','Balabag','Binaton','Cogon','Colorado','Dawis','Dulangan','Goma','Igpit','Kapatagan','Kiagot','Lungag','Mahayahay','Matti','Ruparan','San_Agustin','San_Jose','San_Miguel','San_Roque','Sinawilan','Soong','Tiguman','Tres_De_Mayo','Zone_1','Zone_2','Zone_3'
]

const classOrder = ['Displaced', 'Double-up', 'Homeless', 'Upgrading of Land Tenure']

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
  const [mapScope, setMapScope] = useState('all')
  const [indicators, setIndicators] = useState(null)
  const [timeSeries, setTimeSeries] = useState(null)
  const [crosstabIncomeClassification, setCrosstabIncomeClassification] = useState([])
  const [crosstabClassificationBarangay, setCrosstabClassificationBarangay] = useState([])
  const [filterBarangay, setFilterBarangay] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterIncome, setFilterIncome] = useState('')
  const [filterWater, setFilterWater] = useState('')
  const [filterElectricity, setFilterElectricity] = useState('')

  const [profile, setProfile] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [showAllNotifs, setShowAllNotifs] = useState(false)
  const [notifModal, setNotifModal] = useState({ open: false, item: null })
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [activeNotifId, setActiveNotifId] = useState(null)

  const [showClassification, setShowClassification] = useState(true)
  const [showClassificationDesc, setShowClassificationDesc] = useState(false)
  const [showDisplacedDesc, setShowDisplacedDesc] = useState(false)
  const [showDoubleUpDesc, setShowDoubleUpDesc] = useState(false)
  const [showHomelessDesc, setShowHomelessDesc] = useState(false)
  const [classificationPeriod, setClassificationPeriod] = useState({ start: 2023, end: 2024 })
  const [rangeMode, setRangeMode] = useState('past')
  const [rangeYears, setRangeYears] = useState(3)
  const [periodBarangayData, setPeriodBarangayData] = useState([])
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const filterSelectClass = 'rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 text-left shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100 min-w-[150px]'
  const barangayFilterOptions = [{ value: '', label: 'All' }, ...barangays.map(b => ({ value: b, label: b.replace(/_/g, ' ') }))]
  const classFilterOptions = [{ value: '', label: 'All' }, ...classOrder.map(c => ({ value: c, label: c }))]
  const incomeFilterOptions = [
    { value: '', label: 'All income bands' },
    { value: '0_2999', label: '0–2,999' },
    { value: '3000_5999', label: '3,000–5,999' },
    { value: '6000_8999', label: '6,000–8,999' },
    { value: '9000_12999', label: '9,000–12,999' },
    { value: '13000_plus', label: '13,000+' },
  ]
  const waterFilterOptions = [
    { value: '', label: 'Water: All' },
    { value: 'has', label: 'With water' },
    { value: 'none', label: 'No water' },
  ]
  const electricityFilterOptions = [
    { value: '', label: 'Electricity: All' },
    { value: 'has', label: 'With electricity' },
    { value: 'none', label: 'No electricity' },
  ]

  const barangayRef = useRef(null)
  const classificationRef = useRef(null)
  const displacedRef = useRef(null)
  const doubleUpRef = useRef(null)
  const homelessRef = useRef(null)
  const isfClassificationRef = useRef(null)
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

  const barangayChart = useRef(null)
  const classificationChart = useRef(null)
  const displacedChart = useRef(null)
  const doubleUpChart = useRef(null)
  const homelessChart = useRef(null)
  const incomeChart = useRef(null)
  const educationChart = useRef(null)
  const isfClassificationChart = useRef(null)
  const incomeRef = useRef(null)
  const educationRef = useRef(null)
  const surveysMonthChart = useRef(null)
  const surveysMonthRef = useRef(null)
  const followupMonthChart = useRef(null)
  const followupMonthRef = useRef(null)

  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let cancelled = false
    async function loadInitial() {
      setInitialLoading(true)
      try {
        await Promise.all([
          fetchTotals(),
          fetchBarangay(),
          fetchSubclassDisplaced(),
          fetchSubclassDoubleUp(),
          fetchSubclassHomeless(),
          fetchAssignedCount(),
          fetchNotifications(),
          fetchProfile(),
        ])
      } finally {
        if (!cancelled) setInitialLoading(false)
      }
    }
    loadInitial()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    fetchIndicators()
    fetchTimeSeries()
    fetchCrosstabIncomeClassification()
    fetchCrosstabClassificationBarangay()
  }, [filterBarangay, filterClass, filterIncome, filterWater, filterElectricity])

  useEffect(() => {
    const refresh = () => { fetchTotals(); fetchAssignedCount() }
    const id = setInterval(refresh, 30000)
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
  }, [])

  useEffect(() => {
    fetchMapPoints(mapScope)
  }, [mapScope])

  async function fetchTotals() {
    const res = await axios.get('/admin/api/totals')
    setTotals(res.data)
  }
  async function fetchBarangay() {
    const res = await axios.get('/admin/api/barangay')
    setBarangayData(res.data.data || [])
  }
  async function fetchClassification(period = classificationPeriod) {
    const params = rangeMode === 'past' ? { years: rangeYears } : { start_year: period.start, end_year: period.end }
    const res = await axios.get('/admin/api/barangay', { params })
    setPeriodBarangayData(res.data.data || [])
  }

  async function fetchClassificationOverall() {}

  useEffect(() => {
    fetchClassification(classificationPeriod)
  }, [classificationPeriod, rangeMode, rangeYears])
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
  async function fetchMapPoints(scope = mapScope) {
    const res = await axios.get('/admin/api/map-points', { params: { scope, mode: 'survey' } })
    setMapPoints(res.data.points || [])
  }
  async function fetchAssignedCount() {
    const res = await axios.get('/admin/api/assignments')
    setAssignedCount((res.data.data || []).length)
  }

  async function fetchIndicators() {
    const params = {
      barangay: filterBarangay,
      classification: filterClass ? filterClass.toLowerCase() : '',
      income_band: filterIncome,
      water: filterWater,
      electricity: filterElectricity
    }
    const res = await axios.get('/admin/api/indicators', { params })
    setIndicators(res.data)
    if (!filterBarangay && !filterClass && !filterIncome && !filterWater && !filterElectricity) {
      const baseCounts = res.data?.vulnerability?.classification_count || {}
      setOverallClassificationData(baseCounts)
    }
  }

  async function fetchTimeSeries() {
    const params = {
      barangay: filterBarangay,
      classification: filterClass ? filterClass.toLowerCase() : '',
      income_band: filterIncome,
      water: filterWater,
      electricity: filterElectricity
    }
    const res = await axios.get('/admin/api/timeseries', { params })
    setTimeSeries(res.data)
  }

  async function fetchCrosstabIncomeClassification() {
    const params = {
      barangay: filterBarangay,
      classification: filterClass ? filterClass.toLowerCase() : '',
      water: filterWater,
      electricity: filterElectricity
    }
    const res = await axios.get('/admin/api/crosstab/income-classification', { params })
    setCrosstabIncomeClassification(res.data.data || [])
  }

  async function fetchCrosstabClassificationBarangay() {
    const params = {
      barangay: filterBarangay,
      classification: filterClass ? filterClass.toLowerCase() : ''
    }
    const res = await axios.get('/admin/api/crosstab/classification-barangay', { params })
    setCrosstabClassificationBarangay(res.data.data || [])
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

  function toggleNotifPanel() {
    setShowNotifPanel(v => !v)
  }

  function handleNotificationClick(item) {
    setActiveNotifId(item.id)
    setNotifModal({ open: true, item })
    markNotificationRead(item.id)
    setTimeout(() => {
      setActiveNotifId(null)
    }, 150)
  }

  useEffect(() => {
    if (!window.Chart) return
    if (barangayChart.current) barangayChart.current.destroy()
    if (!barangayRef.current) return
    const top = [...barangayData].sort((a, b) => (Number(b.count || 0) - Number(a.count || 0))).slice(0, 10)
    const labels = top.map(i => String(i.barangay || 'Unknown').replace(/_/g,' '))
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
    const sorted = [...periodBarangayData].sort((a, b) => (Number(b.count || 0) - Number(a.count || 0)))
    const labels = sorted.map(i => String(i.barangay || 'Unknown').replace(/_/g,' '))
    const values = sorted.map(i => Number(i.count) || 0)
    const colors = byYearColors(labels.length)
    classificationChart.current = new window.Chart(classificationRef.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2, hoverOffset: 4 }] },
      options: {
        responsive: true,
        cutout: '66%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              generateLabels: (chart) => {
                const data = chart.data || {}
                const ds = (data.datasets && data.datasets[0]) || {}
                const vals = ds.data || []
                const total = vals.reduce((sum, v) => sum + Number(v || 0), 0)
                const bg = ds.backgroundColor || []
                return (data.labels || []).map((label, index) => {
                  const raw = Number(vals[index] || 0)
                  const pct = total ? Math.round((raw / total) * 100) : 0
                  return {
                    text: `${label} (${pct}%)`,
                    fillStyle: bg[index] || '#10B981',
                    strokeStyle: '#ffffff',
                    lineWidth: 2,
                    hidden: raw === 0 || Number.isNaN(raw),
                    index
                  }
                })
              }
            }
          }
        },
        animation: { duration: 800 }
      }
    })
  }, [periodBarangayData])

  useEffect(() => {
    if (!window.Chart) return
    if (displacedChart.current) displacedChart.current.destroy()
    if (!displacedRef.current) return
    const subclasses = Array.from(new Set(subclassDisplacedData.map(i => i.subclass_displaced || 'Unknown')))
    const barangaysRaw = Array.from(new Set(subclassDisplacedData.map(i => i.barangay || 'Unknown')))
    const labels = barangaysRaw.map(b => String(b).replace(/_/g,' '))
    const colors = emeraldColors(subclasses.length)
    const datasets = subclasses.map((sub, idx) => ({
      label: String(sub).replace(/_/g,' '),
      data: barangaysRaw.map(b => {
        const row = subclassDisplacedData.find(r => (r.barangay || 'Unknown') === b && (r.subclass_displaced || 'Unknown') === sub)
        return Number(row?.count) || 0
      }),
      backgroundColor: colors[idx],
      borderRadius: 8,
      maxBarThickness: 28,
      barPercentage: 0.9,
      categoryPercentage: 0.7
    }))
    displacedChart.current = new window.Chart(displacedRef.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: 'rgba(16,185,129,0.06)' }, ticks: { display: false, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: '#374151', autoSkip: false, padding: 4 } }
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
    const barangaysRaw = Array.from(new Set(subclassDoubleUpData.map(i => i.barangay || 'Unknown')))
    const labels = barangaysRaw.map(b => String(b).replace(/_/g,' '))
    const colors = emeraldColors(subclasses.length)
    const datasets = subclasses.map((sub, idx) => ({
      label: String(sub).replace(/_/g,' '),
      data: barangaysRaw.map(b => {
        const row = subclassDoubleUpData.find(r => (r.barangay || 'Unknown') === b && (r.subclass_doubleup || 'Unknown') === sub)
        return Number(row?.count) || 0
      }),
      backgroundColor: colors[idx],
      borderRadius: 8,
      maxBarThickness: 28,
      barPercentage: 0.9,
      categoryPercentage: 0.7
    }))
    doubleUpChart.current = new window.Chart(doubleUpRef.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: 'rgba(16,185,129,0.06)' }, ticks: { display: false, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: '#374151', autoSkip: false, padding: 4 } }
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
    const barangaysRaw = Array.from(new Set(subclassHomelessData.map(i => i.barangay || 'Unknown')))
    const labels = barangaysRaw.map(b => String(b).replace(/_/g,' '))
    const colors = emeraldColors(subclasses.length)
    const datasets = subclasses.map((sub, idx) => ({
      label: String(sub).replace(/_/g,' '),
      data: barangaysRaw.map(b => {
        const row = subclassHomelessData.find(r => (r.barangay || 'Unknown') === b && (r.subclass_homeless || 'Unknown') === sub)
        return Number(row?.count) || 0
      }),
      backgroundColor: colors[idx],
      borderRadius: 8,
      maxBarThickness: 28,
      barPercentage: 0.9,
      categoryPercentage: 0.7
    }))
    homelessChart.current = new window.Chart(homelessRef.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        indexAxis: 'y',
        scales: {
          x: { grid: { color: 'rgba(16,185,129,0.06)' }, ticks: { display: false, stepSize: 1 } },
          y: { grid: { display: false }, ticks: { color: '#374151', autoSkip: false, padding: 4 } }
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
    if (!window.Chart || !indicators) return
    if (incomeChart.current) incomeChart.current.destroy()
    if (!incomeRef.current) return
    const b = indicators.economic?.bands || { '0_2999': 0, '3000_5999': 0, '6000_8999': 0, '9000_12999': 0, '13000_plus': 0 }
    const labels = ['0–2,999','3,000–5,999','6,000–8,999','9,000–12,999','13,000+']
    const values = [Number(b['0_2999']||0), Number(b['3000_5999']||0), Number(b['6000_8999']||0), Number(b['9000_12999']||0), Number(b['13000_plus']||0)]
    const colors = emeraldColors(labels.length)
    incomeChart.current = new window.Chart(incomeRef.current, {
      type: 'bar',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderRadius: 8, maxBarThickness: 22 }] },
      options: { responsive: true, scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(16,185,129,0.1)' }, ticks: { stepSize: 1 } } }, plugins: { legend: { display: false } }, animation: { duration: 800 } }
    })
  }, [indicators])

  useEffect(() => {
    if (!window.Chart || !indicators) return
    if (educationChart.current) educationChart.current.destroy()
    if (!educationRef.current) return
    const ed = indicators.education_skills?.education_breakdown || {}
    const aggregated = {}
    Object.entries(ed).forEach(([rawKey, v]) => {
      const label = String(rawKey).replace(/_/g,' ').trim()
      const key = label.toLowerCase()
      if (!aggregated[key]) aggregated[key] = { label, value: 0 }
      aggregated[key].value += Number(v || 0)
    })
    const entries = Object.values(aggregated)
    const labels = entries.map(e => e.label)
    const values = entries.map(e => e.value)
    const colors = emeraldColors(labels.length)
    educationChart.current = new window.Chart(educationRef.current, {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderColor: '#fff', borderWidth: 2, hoverOffset: 4 }] },
      options: { responsive: true, cutout: '70%', plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } }, animation: { duration: 800 } }
    })
  }, [indicators])

  useEffect(() => {
    if (!window.Chart || !indicators) return
    if (isfClassificationChart.current) isfClassificationChart.current.destroy()
    if (!isfClassificationRef.current) return
    const counts = indicators.vulnerability?.classification_count || {}
    const order = ['Displaced', 'Double-up', 'Homeless', 'Upgrading of Land Tenure']
    const labels = order.filter(name => counts[name] !== undefined && counts[name] !== null)
    if (labels.length === 0) return
    const values = labels.map(name => Number(counts[name] || 0))
    const colors = emeraldColors(labels.length)
    isfClassificationChart.current = new window.Chart(isfClassificationRef.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 2,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle' }
          }
        },
        animation: { duration: 800 }
      }
    })
  }, [indicators])

  useEffect(() => {
    if (!window.Chart || !timeSeries) return
    if (surveysMonthChart.current) surveysMonthChart.current.destroy()
    if (!surveysMonthRef.current) return
    const rows = timeSeries.surveys_per_month || []
    const labels = rows.map(r => String(r.ym || ''))
    const values = rows.map(r => Number(r.count || 0))
    surveysMonthChart.current = new window.Chart(surveysMonthRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Surveys',
          data: values,
          borderColor: '#10B981',
          backgroundColor: 'rgba(16,185,129,0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false }, ticks: { color: '#374151' } },
          y: { grid: { color: 'rgba(16,185,129,0.08)' }, ticks: { stepSize: 1, color: '#374151' } }
        },
        plugins: { legend: { display: false } },
        animation: { duration: 800 }
      }
    })
  }, [timeSeries])

  useEffect(() => {
    if (!window.Chart || !timeSeries) return
    if (followupMonthChart.current) followupMonthChart.current.destroy()
    if (!followupMonthRef.current) return
    const totals = timeSeries.surveys_per_month || []
    const followups = timeSeries.followups_per_month || []
    const fuMap = new Map(followups.map(r => [String(r.ym || ''), Number(r.count || 0)]))
    const labels = totals.map(r => String(r.ym || ''))
    const followupVals = labels.map(l => fuMap.get(l) || 0)
    const newVals = totals.map(r => Math.max(0, Number(r.count || 0) - (fuMap.get(String(r.ym || '')) || 0)))
    const stackColors = emeraldColors(2)
    followupMonthChart.current = new window.Chart(followupMonthRef.current, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'New', data: newVals, backgroundColor: stackColors[0], borderRadius: 8, maxBarThickness: 22 },
          { label: 'Follow-up', data: followupVals, backgroundColor: stackColors[1], borderRadius: 8, maxBarThickness: 22 }
        ]
      },
      options: {
        responsive: true,
        scales: {
          x: { stacked: true, grid: { display: false }, ticks: { color: '#374151' } },
          y: { stacked: true, grid: { color: 'rgba(16,185,129,0.08)' }, ticks: { stepSize: 1, color: '#374151' } }
        },
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } },
        animation: { duration: 800 }
      }
    })
  }, [timeSeries])

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

  const barangayCrosstabTop = (() => {
    const map = new Map()
    for (const row of (crosstabClassificationBarangay || [])) {
      const barangay = row.barangay || 'Unknown'
      const classification = row.classification || 'Unknown'
      const count = Number(row.count || 0)
      if (!map.has(barangay)) {
        const counts = {}
        classOrder.forEach(c => { counts[c] = 0 })
        map.set(barangay, { barangay, total: 0, counts })
      }
      const entry = map.get(barangay)
      entry.total += count
      entry.counts[classification] = (entry.counts[classification] || 0) + count
    }
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 10)
  })()

  const globalIsfSummary = (() => {
    const counts = overallClassificationData || {}
    const items = classOrder.map(name => ({
      name,
      value: Number(counts[name] || 0),
    })).filter(item => item.value > 0)
    const total = items.reduce((sum, item) => sum + item.value, 0)
    return { items, total }
  })()

  const displacedSubclassTable = (() => {
    const barangayMap = new Map()
    const subclassSet = new Set()
    for (const row of (subclassDisplacedData || [])) {
      const barangay = row.barangay || 'Unknown'
      const subclass = row.subclass_displaced || 'Unknown'
      const count = Number(row.count || 0)
      subclassSet.add(subclass)
      if (!barangayMap.has(barangay)) {
        barangayMap.set(barangay, { barangay, total: 0, counts: {} })
      }
      const entry = barangayMap.get(barangay)
      entry.total += count
      entry.counts[subclass] = (entry.counts[subclass] || 0) + count
    }
    const subclasses = [...subclassSet].sort((a, b) => String(a).localeCompare(String(b)))
    const rows = [...barangayMap.values()].sort((a, b) => String(a.barangay).localeCompare(String(b.barangay)))
    return { subclasses, rows }
  })()

  const doubleUpSubclassTable = (() => {
    const barangayMap = new Map()
    const subclassSet = new Set()
    for (const row of (subclassDoubleUpData || [])) {
      const barangay = row.barangay || 'Unknown'
      const subclass = row.subclass_doubleup || 'Unknown'
      const count = Number(row.count || 0)
      subclassSet.add(subclass)
      if (!barangayMap.has(barangay)) {
        barangayMap.set(barangay, { barangay, total: 0, counts: {} })
      }
      const entry = barangayMap.get(barangay)
      entry.total += count
      entry.counts[subclass] = (entry.counts[subclass] || 0) + count
    }
    const subclasses = [...subclassSet].sort((a, b) => String(a).localeCompare(String(b)))
    const rows = [...barangayMap.values()].sort((a, b) => String(a.barangay).localeCompare(String(b.barangay)))
    return { subclasses, rows }
  })()

  const homelessSubclassTable = (() => {
    const barangayMap = new Map()
    const subclassSet = new Set()
    for (const row of (subclassHomelessData || [])) {
      const barangay = row.barangay || 'Unknown'
      const count = Number(row.count || 0)
      const subclass = row.subclass_homeless || 'Unknown'
      subclassSet.add(subclass)
      if (!barangayMap.has(barangay)) {
        barangayMap.set(barangay, { barangay, total: 0, counts: {} })
      }
      const entry = barangayMap.get(barangay)
      entry.total += count
      entry.counts[subclass] = (entry.counts[subclass] || 0) + count
    }
    const subclasses = [...subclassSet].sort((a, b) => String(a).localeCompare(String(b)))
    const rows = [...barangayMap.values()].sort((a, b) => String(a.barangay).localeCompare(String(b.barangay)))
    return { subclasses, rows }
  })()

  return (
    <div className={`admin-dashboard-root flex h-screen overflow-hidden transition-opacity duration-500 ease-in-out ${mounted ? 'opacity-100' : 'opacity-0'}`}>
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

      <main className="admin-dashboard-main flex-1 h-screen overflow-y-auto p-6 bg-gray-50">
        <DashboardFade delay={0}>
          <div className="md:hidden mb-4 flex items-center justify-between no-print">
            <button onClick={() => setMobileNavOpen(true)} className="px-3 py-2 rounded-2xl bg-white ring-2 ring-emerald-300 text-emerald-700" aria-label="Open Menu">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
            <span className="text-sm font-semibold text-emerald-800">Menu</span>
          </div>
        </DashboardFade>

        <DashboardFade delay={200} className={`relative z-[50] ${mobileNavOpen ? 'hidden md:block' : ''}`}>
          <div className="mt-4 relative rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 p-6 text-white no-print">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90">Welcome back, Admin!</div>
                <div className="mt-2 text-xs opacity-85">Today is {new Date().toLocaleDateString()}. You have <span className="font-semibold">{totals.total_validated}</span> new validated forms awaiting your review.</div>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="relative">
                  <button
                    onClick={toggleNotifPanel}
                    className="px-3 py-3 rounded-2xl bg-white/10 ring-2 ring-emerald-100 text-white hover:bg-white/20 hover:ring-emerald-50 flex items-center gap-2 shadow-sm relative transition-colors"
                    aria-label="Notifications"
                    aria-haspopup="true"
                    aria-expanded={showNotifPanel}
                    aria-controls="admin-notifications-panel"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
                    {notifications.some(n => !n.read) && (<span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>)}
                  </button>
                  <div
                    id="admin-notifications-panel"
                    className={`absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg p-3 z-[9999] transform origin-top transition-all duration-300 ease-in-out ${
                      showNotifPanel ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'
                    }`}
                    role="region"
                    aria-label="Notifications"
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-emerald-800">Notifications</div>
                      <button
                        className="p-2 rounded-full hover:bg-emerald-50 text-emerald-700 transition-colors"
                        onClick={toggleNotifPanel}
                        aria-label="Close notifications"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 18L18 6M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <div
                      id="admin-notification-list"
                      className="space-y-2 mt-2 overflow-y-auto transition-[max-height] duration-300 ease-in-out"
                      style={{ maxHeight: showAllNotifs ? '420px' : '220px' }}
                      role="list"
                      aria-live="polite"
                    >
                      {(showAllNotifs ? notifications : notifications.slice(0,5)).map(item => (
                        <button
                          key={item.id}
                          onClick={() => handleNotificationClick(item)}
                          className={`w-full flex items-center gap-3 text-left rounded-xl p-2 transition-transform duration-150 ${item.read ? 'bg-white' : 'bg-gray-100'}`}
                          style={{ transform: activeNotifId === item.id ? 'scale(1.02)' : 'scale(1)' }}
                          role="listitem"
                        >
                          <img src={'/icons/appicon1.png'} alt="alert" className="w-9 h-9 rounded-xl object-cover"/>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                            <div className="text-xs text-gray-500">{new Date(item.created_at).toLocaleString()}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex justify-end">
                      <button
                        onClick={() => {
                          const next = !showAllNotifs
                          setShowAllNotifs(next)
                          if (next) fetchNotifications(50)
                        }}
                        className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors"
                        aria-label={showAllNotifs ? 'Show fewer notifications' : 'Show more notifications'}
                        aria-expanded={showAllNotifs}
                        aria-controls="admin-notification-list"
                      >
                        <svg
                          className={`w-4 h-4 transform transition-transform duration-200 ${showAllNotifs ? 'rotate-180' : 'rotate-0'}`}
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardFade>

        <DashboardFade delay={300}>
          <section className="mt-6 no-print">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-6 min-h-[160px] w-full">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="3"/><path d="M7 8h10M7 12h6"/></svg>
                </div>
                <div className="mt-4 text-3xl font-semibold text-gray-900">{totals.total_overall || 0}</div>
                <div className="mt-1 text-sm text-gray-600">Overall Data</div>
              </div>

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

        </DashboardFade>

        <DashboardFade delay={500}>
          <section className="mt-6 admin-analytics-print">
            {initialLoading ? (
              <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-4 w-40 bg-emerald-100 rounded mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                    <div className="h-3 w-32 bg-gray-200 rounded mb-4" />
                    <div className="h-32 w-full bg-gray-100 rounded" />
                    <div className="mt-4 h-3 w-3/4 bg-gray-100 rounded" />
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
                    <div className="h-3 w-44 bg-gray-200 rounded mb-4" />
                    <div className="space-y-3">
                      <div className="h-2.5 w-full bg-gray-100 rounded" />
                      <div className="h-2.5 w-5/6 bg-gray-100 rounded" />
                      <div className="h-2.5 w-3/4 bg-gray-100 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`bg-gray-50 rounded-2xl border border-gray-100 p-4 ${!showClassification && 'hidden'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-emerald-800">By Year Summary ({rangeMode === 'past' ? `Past ${rangeYears} years` : `${classificationPeriod.start} - ${classificationPeriod.end}`})</h3>
                      <div className="flex items-center gap-2">
                        <select
                          value={rangeMode}
                          onChange={(e) => setRangeMode(e.target.value)}
                          className="text-[10px] rounded-lg bg-white ring-1 ring-emerald-100 px-2 py-1 text-emerald-700 hover:ring-emerald-200"
                        >
                          <option value="past">Past years</option>
                          <option value="custom">Custom range</option>
                        </select>
                        {rangeMode === 'past' ? (
                          <select
                            value={String(rangeYears)}
                            onChange={(e) => setRangeYears(Number(e.target.value))}
                            className="text-[10px] rounded-lg bg-white ring-1 ring-emerald-100 px-2 py-1 text-emerald-700 hover:ring-emerald-200"
                          >
                            <option value="1">Past 1 year</option>
                            <option value="2">Past 2 years</option>
                            <option value="3">Past 3 years</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-1">
                            <select
                              value={String(classificationPeriod.start)}
                              onChange={(e) => setClassificationPeriod(p => ({ ...p, start: Number(e.target.value) }))}
                              className="text-[10px] rounded-lg bg-white ring-1 ring-emerald-100 px-2 py-1 text-emerald-700 hover:ring-emerald-200"
                            >
                              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={`s-${y}`} value={y}>{y}</option>
                              ))}
                            </select>
                            <span className="text-[10px] text-gray-400">to</span>
                            <select
                              value={String(classificationPeriod.end)}
                              onChange={(e) => setClassificationPeriod(p => ({ ...p, end: Number(e.target.value) }))}
                              className="text-[10px] rounded-lg bg-white ring-1 ring-emerald-100 px-2 py-1 text-emerald-700 hover:ring-emerald-200"
                            >
                              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={`e-${y}`} value={y}>{y}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    <canvas ref={classificationRef} style={{ height: 140 }} />
                    <div className="mt-3 text-[11px] text-gray-600 line-clamp-2">{describeBarangayCounts(periodBarangayData)}</div>
                  </div>

                  <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 print-include">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-medium text-emerald-800">Global ISF classification</h3>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold text-emerald-900">{globalIsfSummary.total || 0}</span>
                      <span className="text-sm text-gray-500">Total ISF households</span>
                    </div>
                    <div className="mt-6 space-y-4">
                      {globalIsfSummary.items.length === 0 && (
                        <div className="text-xs text-gray-400 italic">No data available yet.</div>
                      )}
                      {globalIsfSummary.items.map((item, index) => {
                        const pct = globalIsfSummary.total
                          ? Math.round((item.value / globalIsfSummary.total) * 100)
                          : 0
                        const barColors = emeraldColors(globalIsfSummary.items.length)
                        const barColor = barColors[index] || '#10B981'
                        return (
                          <div key={item.name} className="flex items-center gap-4">
                            <div className="flex-1">
                              <div className="flex justify-between text-sm text-gray-500">
                                <span>{item.name}</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="mt-2 h-2.5 rounded-full bg-gray-200/50 overflow-hidden">
                                <div
                                  className="h-2.5 rounded-full global-isf-bar"
                                  style={{ width: `${pct}%`, backgroundColor: barColor }}
                                />
                              </div>
                            </div>
                            <div className="w-14 text-right text-sm font-medium text-gray-700">
                              {item.value}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="mb-3 font-medium text-emerald-800">Subclass Displaced per barangay</div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-3">Barangay</th>
                          {displacedSubclassTable.subclasses.map(sub => (
                            <th key={sub} className="py-2 pr-3 text-right">{String(sub).replace(/_/g, ' ')}</th>
                          ))}
                          <th className="py-2 pr-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displacedSubclassTable.rows.map(row => (
                          <tr key={row.barangay} className="border-b last:border-0">
                            <td className="py-1.5 pr-3 text-gray-900">{String(row.barangay).replace(/_/g, ' ')}</td>
                            {displacedSubclassTable.subclasses.map(sub => (
                              <td
                                key={`${row.barangay}-${sub}`}
                                className="py-1.5 pr-3 text-right text-gray-800"
                              >
                                {row.counts?.[sub] || 0}
                              </td>
                            ))}
                            <td className="py-1.5 pr-3 text-right text-gray-900 font-medium">{row.total}</td>
                          </tr>
                        ))}
                        {displacedSubclassTable.rows.length === 0 && (
                          <tr>
                            <td className="py-3 text-gray-500" colSpan={displacedSubclassTable.subclasses.length + 2}>No data</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setShowDisplacedDesc(v => !v)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                      aria-expanded={showDisplacedDesc}
                      aria-controls="subclass-displaced-summary"
                    >
                      {showDisplacedDesc ? 'Hide summary' : 'Show summary'}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {showDisplacedDesc && (
                      <p id="subclass-displaced-summary" className="mt-2 text-sm text-gray-700">{describeDisplaced(subclassDisplacedData)}</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="mb-3 font-medium text-emerald-800">Subclass Double-Up per barangay</div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-3">Barangay</th>
                          {doubleUpSubclassTable.subclasses.map(sub => (
                            <th key={sub} className="py-2 pr-3 text-right">{String(sub).replace(/_/g, ' ')}</th>
                          ))}
                          <th className="py-2 pr-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {doubleUpSubclassTable.rows.map(row => (
                          <tr key={row.barangay} className="border-b last:border-0">
                            <td className="py-1.5 pr-3 text-gray-900">{String(row.barangay).replace(/_/g, ' ')}</td>
                            {doubleUpSubclassTable.subclasses.map(sub => (
                              <td
                                key={`${row.barangay}-${sub}`}
                                className="py-1.5 pr-3 text-right text-gray-800"
                              >
                                {row.counts?.[sub] || 0}
                              </td>
                            ))}
                            <td className="py-1.5 pr-3 text-right text-gray-900 font-medium">{row.total}</td>
                          </tr>
                        ))}
                        {doubleUpSubclassTable.rows.length === 0 && (
                          <tr>
                            <td className="py-3 text-gray-500" colSpan={doubleUpSubclassTable.subclasses.length + 2}>No data</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setShowDoubleUpDesc(v => !v)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                      aria-expanded={showDoubleUpDesc}
                      aria-controls="subclass-doubleup-summary"
                    >
                      {showDoubleUpDesc ? 'Hide summary' : 'Show summary'}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {showDoubleUpDesc && (
                      <p id="subclass-doubleup-summary" className="mt-2 text-sm text-gray-700">{describeDoubleUp(subclassDoubleUpData)}</p>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                  <div className="mb-3 font-medium text-emerald-800">Subclass Homeless per barangay</div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-600 border-b">
                          <th className="py-2 pr-3">Barangay</th>
                          {homelessSubclassTable.subclasses.map(sub => (
                            <th key={sub} className="py-2 pr-3 text-right">{String(sub).replace(/_/g, ' ')}</th>
                          ))}
                          <th className="py-2 pr-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {homelessSubclassTable.rows.map(row => (
                          <tr key={row.barangay} className="border-b last:border-0">
                            <td className="py-1.5 pr-3 text-gray-900">{String(row.barangay).replace(/_/g, ' ')}</td>
                            {homelessSubclassTable.subclasses.map(sub => (
                              <td
                                key={`${row.barangay}-${sub}`}
                                className="py-1.5 pr-3 text-right text-gray-800"
                              >
                                {row.counts?.[sub] || 0}
                              </td>
                            ))}
                            <td className="py-1.5 pr-3 text-right text-gray-900 font-medium">{row.total}</td>
                          </tr>
                        ))}
                        {homelessSubclassTable.rows.length === 0 && (
                          <tr>
                            <td className="py-3 text-gray-500" colSpan={homelessSubclassTable.subclasses.length + 2}>No data</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="mt-3">
                    <button
                      onClick={() => setShowHomelessDesc(v => !v)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1"
                      aria-expanded={showHomelessDesc}
                      aria-controls="subclass-homeless-summary"
                    >
                      {showHomelessDesc ? 'Hide summary' : 'Show summary'}
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
                    </button>
                    {showHomelessDesc && (
                      <p id="subclass-homeless-summary" className="mt-2 text-sm text-gray-700">{describeHomeless(subclassHomelessData)}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-10 pt-6 border-t border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    <SmoothSelect
                      value={filterBarangay}
                      onChange={setFilterBarangay}
                      options={barangayFilterOptions}
                      buttonClassName={filterSelectClass}
                    />
                    <SmoothSelect
                      value={filterClass}
                      onChange={setFilterClass}
                      options={classFilterOptions}
                      buttonClassName={filterSelectClass}
                    />
                    <SmoothSelect
                      value={filterIncome}
                      onChange={setFilterIncome}
                      options={incomeFilterOptions}
                      buttonClassName={filterSelectClass}
                    />
                    <SmoothSelect
                      value={filterWater}
                      onChange={setFilterWater}
                      options={waterFilterOptions}
                      buttonClassName={filterSelectClass}
                    />
                    <SmoothSelect
                      value={filterElectricity}
                      onChange={setFilterElectricity}
                      options={electricityFilterOptions}
                      buttonClassName={filterSelectClass}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFilterBarangay('')
                        setFilterClass('')
                        setFilterIncome('')
                        setFilterWater('')
                        setFilterElectricity('')
                      }}
                      className="text-xs px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100 hover:bg-emerald-100 no-print"
                    >
                      Reset filters
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="text-xs px-3 py-2 rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-50 no-print"
                    >
                      Print analytics
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-emerald-50 ring-1 ring-emerald-100 p-4">
                    <div className="text-xs text-emerald-700">Filtered total</div>
                    <div className="mt-1 text-2xl font-semibold text-emerald-900">{indicators?.base_total ?? timeSeries?.base_total ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-4">
                    <div className="text-xs text-gray-600">No lot ownership</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{indicators?.vulnerability?.no_lot?.pct ?? 0}%</div>
                    <div className="mt-1 text-xs text-gray-500">{indicators?.vulnerability?.no_lot?.count ?? 0}/{indicators?.vulnerability?.no_lot?.total ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-4">
                    <div className="text-xs text-gray-600">No house ownership</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{indicators?.vulnerability?.no_house?.pct ?? 0}%</div>
                    <div className="mt-1 text-xs text-gray-500">{indicators?.vulnerability?.no_house?.count ?? 0}/{indicators?.vulnerability?.no_house?.total ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-4">
                    <div className="text-xs text-gray-600">Temporary living area</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{indicators?.vulnerability?.temporary_living?.pct ?? 0}%</div>
                    <div className="mt-1 text-xs text-gray-500">{indicators?.vulnerability?.temporary_living?.count ?? 0}/{indicators?.vulnerability?.temporary_living?.total ?? 0}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-4">
                    <div className="text-xs text-gray-600">Has water</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{indicators?.service?.has_water?.pct ?? 0}%</div>
                    <div className="mt-1 text-xs text-gray-500">{indicators?.service?.has_water?.count ?? 0}/{indicators?.service?.has_water?.total ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-4">
                    <div className="text-xs text-gray-600">Has electricity</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{indicators?.service?.has_electricity?.pct ?? 0}%</div>
                    <div className="mt-1 text-xs text-gray-500">{indicators?.service?.has_electricity?.count ?? 0}/{indicators?.service?.has_electricity?.total ?? 0}</div>
                  </div>
                  <div className="rounded-2xl bg-white ring-1 ring-gray-200 p-4">
                    <div className="text-xs text-gray-600">Has livelihood skills</div>
                    <div className="mt-1 text-2xl font-semibold text-gray-900">{indicators?.education_skills?.skills_for_living?.pct ?? 0}%</div>
                    <div className="mt-1 text-xs text-gray-500">{indicators?.education_skills?.skills_for_living?.yes_count ?? 0}/{indicators?.education_skills?.skills_for_living?.total ?? 0}</div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                    <div className="text-sm font-medium text-emerald-800">Income distribution</div>
                    <div className="mt-3">
                      <canvas ref={incomeRef} style={{ height: 170 }} />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                    <div className="text-sm font-medium text-emerald-800">Highest education</div>
                    <div className="mt-3">
                      <canvas ref={educationRef} style={{ height: 170 }} />
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
                    <div className="text-sm font-medium text-emerald-800">ISF classification (filtered)</div>
                    <div className="mt-3">
                      <canvas ref={isfClassificationRef} style={{ height: 170 }} />
                    </div>
                  </div>
                </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="bg-gray-50 rounded-2xl border border-gray-200 p-10">
                  <div className="text-sm font-medium text-emerald-800">Surveys per month</div>
                  <div className="mt-4">
                    <canvas ref={surveysMonthRef} style={{ height: 200 }} />
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 overflow-hidden">
                  <div className="text-sm font-medium text-emerald-800">Income band × Classification</div>
                  <div className="mt-3 overflow-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="py-2 pr-3">Classification</th>
                          <th className="py-2 pr-3">0–2,999</th>
                          <th className="py-2 pr-3">3,000–5,999</th>
                          <th className="py-2 pr-3">6,000–8,999</th>
                          <th className="py-2 pr-3">9,000–12,999</th>
                          <th className="py-2 pr-3">13,000+</th>
                          <th className="py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(crosstabIncomeClassification || []).map((r, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="py-2 pr-3 text-gray-900">{r.classification}</td>
                            <td className="py-2 pr-3 text-gray-700">{Number(r['0_2999'] || 0)}</td>
                            <td className="py-2 pr-3 text-gray-700">{Number(r['3000_5999'] || 0)}</td>
                            <td className="py-2 pr-3 text-gray-700">{Number(r['6000_8999'] || 0)}</td>
                            <td className="py-2 pr-3 text-gray-700">{Number(r['9000_12999'] || 0)}</td>
                            <td className="py-2 pr-3 text-gray-700">{Number(r['13000_plus'] || 0)}</td>
                            <td className="py-2 text-gray-900 font-medium">{Number(r.total || 0)}</td>
                          </tr>
                        ))}
                        {(crosstabIncomeClassification || []).length === 0 && (
                          <tr className="border-t">
                            <td className="py-3 text-gray-500" colSpan={7}>No data</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 overflow-hidden">
                  <div className="text-sm font-medium text-emerald-800">Classification × Barangay (top 10)</div>
                  <div className="mt-3 overflow-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="text-left text-gray-600">
                          <th className="py-2 pr-3">Barangay</th>
                          {classOrder.map(c => (<th key={c} className="py-2 pr-3">{c}</th>))}
                          <th className="py-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {barangayCrosstabTop.map(row => (
                          <tr key={row.barangay} className="border-t">
                            <td className="py-2 pr-3 text-gray-900">{String(row.barangay).replace(/_/g, ' ')}</td>
                            {classOrder.map(c => (
                              <td key={`${row.barangay}-${c}`} className="py-2 pr-3 text-gray-700">{Number(row.counts?.[c] || 0)}</td>
                            ))}
                            <td className="py-2 text-gray-900 font-medium">{Number(row.total || 0)}</td>
                          </tr>
                        ))}
                        {barangayCrosstabTop.length === 0 && (
                          <tr className="border-t">
                            <td className="py-3 text-gray-500" colSpan={6}>No data</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
          </div>
        </section>
      </DashboardFade>

      </main>

      {false && (
        <aside className="w-80 flex-shrink-0 bg-white text-gray-700 p-6 border-l border-gray-200 h-screen sticky top-0 overflow-hidden"></aside>
      )}

      
      <Modal show={notifModal.open} onClose={() => setNotifModal({ open: false, item: null })} maxWidth="sm" closeable={true}>
        <div className="p-6 bg-white no-print">
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

function SmoothSelect({ value, onChange, options, buttonClassName, disabled = false }) {
  const selected = options.find(o => o.value === value)
  const showPlaceholder = value === '' || value == null
  const label = showPlaceholder ? (options[0]?.label ?? '') : (selected?.label ?? '')

  return (
    <Listbox value={value} onChange={onChange} disabled={disabled}>
      {({ open }) => (
        <div className="relative">
          <Listbox.Button
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
            <Listbox.Options className="absolute left-0 z-50 mt-2 max-h-64 w-full overflow-auto rounded-2xl bg-white p-1 shadow-lg ring-1 ring-black/5 focus:outline-none">
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
          </Transition>
        </div>
      )}
    </Listbox>
  )
}

function DashboardFade({ children, delay = 0, className = "" }) {
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
      className={`transition-all duration-500 ease-in-out transform motion-reduce:transition-none motion-reduce:transform-none ${className} ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

  function emeraldColors(n) {
    const palette = [
      '#0EA5E9','#22C55E','#F97316','#6366F1','#EC4899','#F59E0B','#14B8A6',
      '#8B5CF6','#EF4444','#10B981','#3B82F6','#A855F7','#EAB308','#FB7185',
      '#22D3EE','#2DD4BF','#4ADE80','#FACC15','#FBBF24','#FDBA74','#C4B5FD',
      '#F9A8D4','#FED7AA','#6EE7B7','#1D4ED8','#7C3AED'
    ]
    if (!n || n <= 0) return []
    return Array.from({ length: n }, (_, i) => palette[i % palette.length])
  }
  function byYearColors(n) {
    const palette = [
      '#1F77B4','#FF7F0E','#2CA02C','#D62728','#9467BD','#8C564B',
      '#E377C2','#7F7F7F','#BCBD22','#17BECF',
      '#AEC7E8','#FFBB78','#98DF8A','#FF9896','#C5B0D5','#C49C94',
      '#F7B6D2','#C7C7C7','#DBDB8D','#9EDAE5',
      '#003F5C','#58508D','#BC5090','#FF6361','#FFA600','#2F4B7C'
    ]
    if (!n || n <= 0) return []
    return Array.from({ length: n }, (_, i) => palette[i % palette.length])
  }
  function withAlpha(c, a) {
    return c.startsWith('hsl(') ? c.replace('hsl(', 'hsla(').replace(')', `, ${a})`) : c
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
    const tbName = topBarangay? String(topBarangay[0]).replace(/_/g,' ') : 'Unknown'
    const tbCount = topBarangay? Number(topBarangay[1]||0) : 0
    return `${top.k} is most prevalent with ${top.t} (${pct(top.t)}%). Highest concentration is in ${tbName} (${tbCount}). Combined total is ${grand}, with ${sorted.slice(1).map(i=>i.k+' '+i.t+' ('+pct(i.t)+'%)').join(', ')}.`
  }
  function describeGlobalIsf(summary) {
    const items = summary?.items || []
    if (!items.length || !summary.total) return 'Global ISF classification will appear here once data is available.'
    const sorted = [...items].sort((a, b) => b.value - a.value)
    const top = sorted[0]
    const second = sorted[1]
    const pct = (n) => Math.round((n / summary.total) * 100)
    if (!second) {
      return `${top.name} households are the only recorded ISF group with ${top.value} (${pct(top.value)}%) out of ${summary.total} households.`
    }
    return `${top.name} households are the largest ISF group with ${top.value} (${pct(top.value)}%) of ${summary.total} total households, followed by ${second.name} with ${second.value} (${pct(second.value)}%).`
  }
  function describeBarangayCounts(rows) {
    if (!rows || rows.length===0) return 'Report will appear here once data is available.'
    const normalized = rows
      .map(r => ({ barangay: String(r.barangay || 'Unknown').replace(/_/g, ' '), count: Number(r.count || 0) }))
      .filter(r => r.count > 0)
    if (normalized.length===0) return 'Report will appear here once data is available.'
    const total = normalized.reduce((s, i) => s + i.count, 0)
    if (!total) return 'Report will appear here once data is available.'
    const sorted = [...normalized].sort((a, b) => b.count - a.count)
    const pct = (n) => total ? Math.round((n / total) * 100) : 0
    const topCount = sorted[0].count
    const leaders = sorted.filter(r => r.count === topCount)
    const others = sorted.filter(r => r.count < topCount)
    const parts = []

    if (leaders.length === 1) {
      const l = leaders[0]
      parts.push(`${l.barangay} has the highest share with ${l.count} (${pct(l.count)}%).`)
    } else {
      const names = leaders.slice(0, 3).map(r => r.barangay)
      const namesText = names.length === 2
        ? `${names[0]} and ${names[1]}`
        : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
      parts.push(`${namesText} are tied for the highest share, each with ${topCount} (${pct(topCount)}%).`)
      if (leaders.length > 3) {
        const extra = leaders.length - 3
        parts.push(`${extra} other barangay${extra > 1 ? 's' : ''} share the same count.`)
      }
    }

    if (others.length) {
      const secondCount = others[0].count
      const seconds = others.filter(r => r.count === secondCount)
      const names = seconds.slice(0, 3).map(r => r.barangay)
      const namesText = names.length === 1
        ? names[0]
        : names.length === 2
          ? `${names[0]} and ${names[1]}`
          : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
      parts.push(`${namesText} follow with ${secondCount} (${pct(secondCount)}%).`)
    }

    parts.push(`Total within this range: ${total} across ${normalized.length} barangays.`)
    return parts.join(' ')
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
    const tbName = topBarangay? String(topBarangay.barangay||'Unknown').replace(/_/g,' ') : 'Unknown'
    const tbCount = topBarangay? Number(topBarangay.count||0) : 0
    const second = sorted[1]
    const secondBarangay = rows.filter(r=>(r.subclass_displaced||'Unknown')===second?.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const sbName = secondBarangay? String(secondBarangay.barangay||'Unknown').replace(/_/g,' ') : 'Unknown'
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
    const tbName = topBarangay? String(topBarangay.barangay||'Unknown').replace(/_/g,' ') : 'Unknown'
    const tbCount = topBarangay? Number(topBarangay.count||0) : 0
    const second = sorted[1]
    const secondBarangay = rows.filter(r=>(r.subclass_doubleup||'Unknown')===second?.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const sbName = secondBarangay? String(secondBarangay.barangay||'Unknown').replace(/_/g,' ') : 'Unknown'
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
    const tbName = topBarangay? String(topBarangay.barangay||'Unknown').replace(/_/g,' ') : 'Unknown'
    const tbCount = topBarangay? Number(topBarangay.count||0) : 0
    const second = sorted[1]
    const secondBarangay = rows.filter(r=>(r.subclass_homeless||'Unknown')===second?.k).sort((a,b)=>Number(b.count||0)-Number(a.count||0))[0]
    const sbName = secondBarangay? String(secondBarangay.barangay||'Unknown').replace(/_/g,' ') : 'Unknown'
    const sbCount = secondBarangay? Number(secondBarangay.count||0) : 0
    return `Most Homeless cases are due to ${top.k} (${pct(top.v)}%), concentrated in ${tbName} (${tbCount}). ${second ? `${second.k} ranks second, concentrated in ${sbName} (${sbCount}). ` : ''}Total Homeless subclasses recorded: ${sum}.`
  }
