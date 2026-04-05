import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function DashboardLayout() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f8f8f6' }}>
      {/* Desktop sidebar sits to the left */}
      {!isMobile && <Sidebar />}

      {/* Main content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        minWidth: 0,
        // On mobile, pad bottom so bottom nav doesn't cover content
        paddingBottom: isMobile ? 72 : 0,
      }}>
        <Outlet />
      </main>

      {/* Mobile bottom nav rendered inside layout so it overlays content */}
      {isMobile && <Sidebar />}
    </div>
  )
}
