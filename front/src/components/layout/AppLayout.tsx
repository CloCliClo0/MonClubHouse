import { useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { getToken } from '../../services/auth'

export default function AppLayout() {
  if (!getToken()) return <Navigate to="/login" replace />

  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} />

      <main className="lg:ml-[260px] px-4 lg:px-6 pt-[64px] pb-4 lg:pb-6 min-h-screen">
        <div className="max-w-[1280px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
