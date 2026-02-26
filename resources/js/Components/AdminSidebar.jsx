import React, { useState, useEffect } from 'react'
import { Link } from '@inertiajs/react'

function NavItem({ href, icon, label, isActive, onClick }) {
  const Component = href ? Link : 'button'
  const props = href ? { href } : { type: 'button', onClick }
  
  return (
    <Component
      {...props}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors ${
        isActive ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'
      }`}
    >
      <img src={icon} alt={label} className="w-5 h-5" />
      <span className="tracking-wider uppercase text-xs">{label}</span>
    </Component>
  )
}

function NavGroup({ icon, label, children, isOpen, onToggle, isActive }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl transition-colors ${
          isActive ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-100 hover:text-emerald-700'
        }`}
      >
        <div className="flex items-center gap-3">
          <img src={icon} alt={label} className="w-5 h-5" />
          <span className="tracking-wider uppercase text-xs">{label}</span>
        </div>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="ml-4 pl-4 border-l border-gray-200 space-y-1 py-1">
          {children}
        </div>
      </div>
    </div>
  )
}

function SubNavItem({ href, label, isActive }) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-lg text-xs transition-colors ${
        isActive ? 'bg-emerald-50 text-emerald-800 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-emerald-700'
      }`}
    >
      {label}
    </Link>
  )
}

export default function AdminSidebar({ onLogout }) {
  const [openGroups, setOpenGroups] = useState({
    assignments: false,
    projectSites: false,
  })
  
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  
  // Auto-expand groups based on current path
  useEffect(() => {
    if (pathname.startsWith('/admin/assignments') || pathname.startsWith('/admin/monitoring') || pathname.startsWith('/admin/revocations')) {
      setOpenGroups(prev => ({ ...prev, assignments: true }))
    }
    if (pathname.startsWith('/admin/project-sites') || pathname.startsWith('/admin/hoa')) {
      setOpenGroups(prev => ({ ...prev, projectSites: true }))
    }
  }, [pathname])
  
  const toggleGroup = (group) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }))
  }
  
  const isAssignmentsGroupActive = pathname.startsWith('/admin/assignments') || pathname.startsWith('/admin/monitoring') || pathname.startsWith('/admin/revocations')
  const isProjectSitesGroupActive = pathname.startsWith('/admin/project-sites') || pathname.startsWith('/admin/hoa')

  return (
    <>
      <div className="flex items-center gap-3 mb-8">
        <img src="/icons/appicon3.png" alt="App" className="w-10 h-10 rounded-xl ring-1 ring-emerald-200" />
        <span className="text-lg font-semibold text-emerald-700">CHoDaMS</span>
      </div>
      <nav className="space-y-1 flex flex-col flex-1 overflow-y-auto">
        <NavItem
          href="/admin/dashboard"
          icon="/icons/dashboardicon.png"
          label="Dashboard"
          isActive={pathname.startsWith('/admin/dashboard')}
        />
        
        <NavItem
          href="/admin/beneficiaries"
          icon="/icons/beneficiariesicon.png"
          label="Beneficiaries"
          isActive={pathname.startsWith('/admin/beneficiaries')}
        />
        
        {/* Project Sites Group */}
        <NavGroup
          icon="/icons/projectsiteicon.png"
          label="Project Sites"
          isOpen={openGroups.projectSites}
          onToggle={() => toggleGroup('projectSites')}
          isActive={isProjectSitesGroupActive}
        >
          <SubNavItem
            href="/admin/project-sites"
            label="Site Management"
            isActive={pathname === '/admin/project-sites' || pathname.startsWith('/admin/project-sites/')}
          />
          <SubNavItem
            href="/admin/hoa"
            label="HOA Management"
            isActive={pathname.startsWith('/admin/hoa')}
          />
        </NavGroup>
        
        {/* Assignments Group */}
        <NavGroup
          icon="/icons/assignmenticon.png"
          label="Assignments"
          isOpen={openGroups.assignments}
          onToggle={() => toggleGroup('assignments')}
          isActive={isAssignmentsGroupActive}
        >
          <SubNavItem
            href="/admin/assignments"
            label="Lot Assignments"
            isActive={pathname === '/admin/assignments' || pathname.startsWith('/admin/assignments/')}
          />
          <SubNavItem
            href="/admin/monitoring"
            label="Monitoring"
            isActive={pathname.startsWith('/admin/monitoring')}
          />
          <SubNavItem
            href="/admin/revocations"
            label="Revocations"
            isActive={pathname.startsWith('/admin/revocations')}
          />
        </NavGroup>
        
        <NavItem
          href="/admin/mapping"
          icon="/icons/projectsiteicon.png"
          label="Mapping"
          isActive={pathname.startsWith('/admin/mapping')}
        />
        
        <NavItem
          href="/admin/profile"
          icon="/icons/profileicon.png"
          label="My Profile"
          isActive={pathname.startsWith('/admin/profile')}
        />
        
        <div className="mt-auto pt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <img src="/icons/logouticon.png" alt="Log out" className="w-5 h-5" />
            <span className="tracking-wider uppercase text-xs">Log out</span>
          </button>
        </div>
      </nav>
    </>
  )
}

export function AdminSidebarWrapper({ children, mobileNavOpen, setMobileNavOpen, onLogout }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col flex-shrink-0 bg-white text-gray-700 p-6 border-r border-gray-200 h-screen sticky top-0 overflow-hidden">
        <AdminSidebar onLogout={onLogout} />
      </aside>

      {/* Mobile Sidebar */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 bg-white p-6 shadow-xl flex flex-col h-full">
            <AdminSidebar onLogout={onLogout} />
          </div>
        </div>
      )}
    </>
  )
}
