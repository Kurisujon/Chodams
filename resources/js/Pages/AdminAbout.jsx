// resources/js/Pages/AdminAbout.jsx
import React from 'react'
import { Link } from '@inertiajs/react'

export default function AdminAbout() {
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
  async function logoutAdmin() {
    try {
      await fetch('/admin/logout', { method: 'POST', headers: { 'X-CSRF-TOKEN': csrf() } })
    } finally {
      window.location.href = '/'
    }
  }
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 flex-shrink-0 bg-white text-gray-700 p-4 border-r border-gray-200">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-7 h-7 rounded-full bg-emerald-600 text-white grid place-items-center font-bold">C</div>
          <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
        </div>
        <ul className="space-y-1">
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/dashboard" className="block">Dashboard</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/beneficiaries" className="block">Beneficiaries</Link></li>
          <li className="px-2 py-3 rounded hover:bg-gray-100 hover:text-emerald-700"><Link href="/admin/profile" className="block">Profile</Link></li>
          <li className="px-2 py-3 rounded bg-emerald-50 text-emerald-800"><Link href="/admin/about" className="block">About</Link></li>
          <li className="px-2 py-3 rounded hover:bg-red-50 text-red-700 mt-20"><button onClick={logoutAdmin} className="w-full text-left">Log out</button></li>
        </ul>
      </aside>

      <main className="flex-1 p-6 bg-gray-50">
        <header className="flex justify-between items-center bg-white p-4 rounded-2xl border border-gray-200">
          <div>
            <div className="text-sm text-gray-500">Hello Admin!</div>
            <h2 className="text-2xl text-emerald-800 font-semibold">About</h2>
            <div className="text-xs text-gray-500">System overview and features</div>
          </div>
          <img src="/image/greenlogo1.jpg" alt="logo" className="h-10 w-10 rounded-full object-cover"/>
        </header>

        <section className="mt-6 bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-emerald-800">Overview</h3>
            <p className="mt-2 text-gray-700">
              ChoDaMs is the City Housing Data Management System that streamlines validator surveys, beneficiary management,
              and admin oversight. It centralizes data entry, approval workflows, and reporting.
            </p>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-emerald-800">Key Features</h3>
            <ul className="mt-2 list-disc list-inside text-gray-700">
              <li>Validator surveys with submission and approval tracking</li>
              <li>Beneficiaries list with point-based prioritization</li>
              <li>Charts and descriptive reports for barangay and classifications</li>
              <li>Admin profile and employee account management</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-emerald-800">Technologies</h3>
            <ul className="mt-2 list-disc list-inside text-gray-700">
              <li>Laravel + Inertia + React + Tailwind CSS</li>
              <li>Chart.js for visualizations</li>
              <li>MySQL for storage</li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-emerald-800">Contact</h3>
            <p className="mt-2 text-gray-700">
              For support or inquiries, please reach out to the system administrator.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}