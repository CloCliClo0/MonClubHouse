import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      <Sidebar />
      <Topbar />
      <main className="ml-[260px] pt-[64px] p-6 min-h-screen">
        <div className="max-w-[1280px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
