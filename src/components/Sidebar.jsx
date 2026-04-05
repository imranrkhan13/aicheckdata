import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { signOut } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const NAV = [
  { path: '/dashboard',   label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
  { path: '/submit',      label: 'Submit',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg> },
  { path: '/history',     label: 'History',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> },
  { path: '/leaderboard', label: 'Leaderboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg> },
  { path: '/projects',    label: 'Projects',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> },
]

export default function Sidebar() {
  const { user, profile } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [collapsed, setCollapsed] = useState(false)
  const [signing, setSigning]     = useState(false)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const doSignOut = async () => {
    setSigning(true)
    try { await signOut() } catch {}
    navigate('/')
  }

  const name    = profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const avatar  = profile?.avatar_url || user?.user_metadata?.avatar_url
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const isActive = (path) => location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path))

  /* ── MOBILE: bottom tab bar ── */
  if (isMobile) {
    return (
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#0f0f0f',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex', alignItems: 'stretch',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {NAV.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: 4, padding: '10px 4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: active ? '#a5b4fc' : 'rgba(255,255,255,0.35)',
                transition: 'color 0.15s',
              }}
            >
              {item.icon}
              <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, letterSpacing: '0.2px' }}>{item.label}</span>
            </button>
          )
        })}
      </nav>
    )
  }

  /* ── DESKTOP: left sidebar ── */
  const W = collapsed ? 64 : 220
  return (
    <aside style={{
      width: W, minHeight: '100vh', background: '#0f0f0f',
      display: 'flex', flexDirection: 'column',
      transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
      flexShrink: 0, position: 'sticky', top: 0, height: '100vh',
      overflow: 'hidden', zIndex: 50,
    }}>
      {/* Logo */}
      <div style={{ height: 60, display: 'flex', alignItems: 'center', padding: '0 16px', borderBottom: '1px solid rgba(255,255,255,0.06)', gap: 10, flexShrink: 0 }}>
        <div style={{ width: 28, height: 28, background: '#6366f1', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 14, fontWeight: 700, color: '#fff' }}>D</div>
        <span style={{ fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', fontSize: 16, color: '#fff', whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity 0.15s' }}>DataHub</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV.map(item => {
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : ''}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: collapsed ? '10px 0' : '10px 12px',
                borderRadius: 8, cursor: 'pointer', border: 'none',
                background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                color: active ? '#a5b4fc' : 'rgba(255,255,255,0.4)',
                transition: 'all 0.15s', width: '100%',
                justifyContent: collapsed ? 'center' : 'flex-start',
                fontFamily: 'Inter, sans-serif',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = active ? '#a5b4fc' : 'rgba(255,255,255,0.7)' }}
              onMouseLeave={e => { e.currentTarget.style.background = active ? 'rgba(99,102,241,0.15)' : 'transparent'; e.currentTarget.style.color = active ? '#a5b4fc' : 'rgba(255,255,255,0.4)' }}
            >
              {item.icon}
              <span style={{ fontSize: 13, fontWeight: active ? 600 : 500, whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity 0.12s' }}>{item.label}</span>
              {active && !collapsed && <span style={{ marginLeft: 'auto', width: 5, height: 5, borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '8px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0 }}>
        <button
          onClick={() => setCollapsed(c => !c)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px', borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', marginBottom: 6, transition: 'all 0.15s', fontFamily: 'Inter' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {collapsed ? <polyline points="13 17 18 12 13 7"/> : <polyline points="11 17 6 12 11 7"/>}
          </svg>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: collapsed ? '8px 0' : '8px 10px', justifyContent: collapsed ? 'center' : 'flex-start', overflow: 'hidden' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: '#6366f1', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', border: '1.5px solid rgba(255,255,255,0.1)' }}>
            {avatar ? <img src={avatar} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
          </div>
          <div style={{ overflow: 'hidden', opacity: collapsed ? 0 : 1, transition: 'opacity 0.12s', minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          </div>
        </div>

        <button
          onClick={doSignOut}
          disabled={signing}
          title={collapsed ? 'Sign out' : ''}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: collapsed ? '8px 0' : '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', fontFamily: 'Inter', justifyContent: collapsed ? 'center' : 'flex-start', transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          <span style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', opacity: collapsed ? 0 : 1, transition: 'opacity 0.12s' }}>{signing ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </div>
    </aside>
  )
}
