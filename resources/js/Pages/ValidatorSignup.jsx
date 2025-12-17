// resources/js/Pages/ValidatorSignup.jsx
import React, { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import { Link, router } from '@inertiajs/react'

export default function ValidatorSignup() {
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signatureFile, setSignatureFile] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  async function submit(e) {
    e.preventDefault()
    try {
      setError('')
      setSaving(true)
      if (!signatureFile) {
        setError('Signature image is required')
        return
      }
      const allowed = ['image/png','image/jpeg']
      if (!allowed.includes(signatureFile.type)) {
        setError('Signature must be PNG or JPG')
        return
      }
      if (signatureFile.size > 2 * 1024 * 1024) {
        setError('Signature must be at most 2MB')
        return
      }
      const fd = new FormData()
      fd.append('name', name)
      fd.append('username', username)
      fd.append('email', email)
      fd.append('password', password)
      fd.append('signature', signatureFile)
      await axios.post('/admin/api/validators', fd, { headers: { 'X-CSRF-TOKEN': csrf() } })
      router.visit('/admin/profile')
    } catch (err) {
      const data = err?.response?.data
      setError(data?.errors?.username?.[0] || data?.message || 'Failed to create account')
    } finally {
      setSaving(false)
    }
  }

  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
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

      <main className="flex-1 p-6 bg-gray-50">
        <DashboardFade delay={0}>
          {error && <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        </DashboardFade>
        <DashboardFade delay={100}>
          <section className="mt-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-emerald-800">Create Validator Account</h3>
                <Link href="/admin/profile" className="px-3 py-1.5 border rounded text-emerald-800 text-sm">Back</Link>
              </div>
              <form onSubmit={submit} className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" value={name} onChange={e=>setName(e.target.value)} required/>
              </div>
              <div>
                <div className="text-sm text-gray-500">Username</div>
                <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" value={username} onChange={e=>setUsername(e.target.value)} required/>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" type="email" value={email} onChange={e=>setEmail(e.target.value)} required/>
              </div>
              <div>
                <div className="text-sm text-gray-500">Password</div>
                <input className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300" type="password" value={password} onChange={e=>setPassword(e.target.value)} required/>
              </div>
              <div>
                <div className="text-sm text-gray-500">Signature</div>
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  onChange={e=>setSignatureFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="flex justify-end">
                <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl" type="submit" disabled={saving}>Create Account</button>
              </div>
              </form>
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
