// resources/js/Pages/EditAdminProfile.jsx
import React, { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Link, router } from '@inertiajs/react'

export default function EditAdminProfile() {
  const [email, setEmail] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('account')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''

  useEffect(() => {
    axios.get('/admin/api/profile').then(res => {
      setEmail(res.data?.profile?.email || '')
    }).catch(() => setError('Failed to load profile'))
  }, [])

  async function submitEmail(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await axios.post('/admin/api/profile', { email }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      router.visit('/admin/profile')
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function submitPassword(e) {
    e.preventDefault()
    setError('')
    if (!currentPassword || !newPassword) {
      setError('Current and new password are required')
      return
    }
    setSaving(true)
    try {
      await axios.post('/admin/api/profile', { password: newPassword, current_password: currentPassword }, { headers: { 'X-CSRF-TOKEN': csrf() } })
      router.visit('/admin/profile')
    } catch (err) {
      setError(err?.response?.data?.message || 'Update failed')
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
          <Link href="/admin/mapping" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && window.location.pathname.startsWith('/admin/mapping') ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
            <img src="/icons/projectsiteicon.png" alt="Mapping" className="w-5 h-5"/>
            <span className="tracking-wider uppercase text-xs">Mapping</span>
          </Link>
          <Link href="/admin/profile" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin/profile') || window.location.pathname.startsWith('/admin/profile/edit')) ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
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
              <Link href="/admin/profile" className={`flex items-center gap-3 px-3 py-3 rounded-xl ${typeof window !== 'undefined' && (window.location.pathname.startsWith('/admin/profile') || window.location.pathname.startsWith('/admin/profile/edit')) ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'}`}>
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
          {error && <div className="mt-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{error}</div>}
        </DashboardFade>

        <DashboardFade delay={200}>
          <section className="mt-6 max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl border border-gray-200 p-2 mb-6">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={()=>setActiveTab('account')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${activeTab==='account' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Account Details
                </button>
                <button
                  type="button"
                  onClick={()=>setActiveTab('password')}
                  className={`px-3 py-2 rounded-xl text-sm font-medium ${activeTab==='password' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'}`}
                >
                  Change Password
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-800">Account settings</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage your login email and password in one place.</p>
                </div>
                <Link href="/admin/profile" className="px-3 py-1.5 border rounded-xl border-emerald-200 text-emerald-800 text-sm hover:bg-emerald-50">
                  Back
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={submitEmail} className={`space-y-4 rounded-2xl border p-4 bg-emerald-50/40 border-emerald-100 ${activeTab==='account' ? 'ring-2 ring-emerald-200' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-semibold text-emerald-800">Account details</h4>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Email</div>
                    <input
                      className="mt-1 border border-gray-300 rounded-xl p-2.5 w-full focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      type="email"
                      value={email}
                      onChange={e=>setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex justify-end">
                    <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm" type="submit" disabled={saving}>
                      Save Changes
                    </button>
                  </div>
                </form>

                <form onSubmit={submitPassword} className={`space-y-4 rounded-2xl border p-4 bg-gray-50 border-gray-200 ${activeTab==='password' ? 'ring-2 ring-emerald-200' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-md font-semibold text-emerald-800">Change password</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-500">Current Password</div>
                      <div className="relative mt-1">
                        <input
                          className="border border-gray-300 rounded-xl p-2.5 w-full pr-20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={e=>setCurrentPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(v => !v)}
                          className="absolute inset-y-0 right-4 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          {showCurrentPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">New Password</div>
                      <div className="relative mt-1">
                        <input
                          className="border border-gray-300 rounded-xl p-2.5 w-full pr-20 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e=>setNewPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(v => !v)}
                          className="absolute inset-y-0 right-4 flex items-center text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                          {showNewPassword ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-sm" type="submit" disabled={saving}>
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
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
