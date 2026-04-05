import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllProjects } from '../lib/supabase'

const ACCENTS = ['#6366f1', '#16a34a', '#ea580c', '#0ea5e9', '#7c3aed', '#db2777']

const TYPE_ICONS = {
  instruction:  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>,
  conversation: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></>,
  text:         <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  description:  <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
}

export default function ProjectsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  useEffect(() => {
    getAllProjects()
      .then(p => { setProjects(Array.isArray(p) ? p : []); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  const filtered = filter === 'all' ? projects : projects.filter(p => p.status === filter)
  const active   = projects.filter(p => p.status === 'active').length

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap', animation: 'fadeUp 0.4s both' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-sub">{active} active campaign{active !== 1 ? 's' : ''} open for contributions.</p>
        </div>
        <button onClick={() => navigate('/submit')} className="btn-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Submit data
        </button>
      </div>

      {/* Filters */}
      <div className="filter-row" style={{ animation: 'fadeUp 0.4s 40ms both' }}>
        {['all', 'active', 'closed'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`filter-chip ${filter === f ? 'active' : 'idle'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid-3" style={{ animation: 'fadeUp 0.4s 80ms both' }}>
          {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 200, borderRadius: 14 }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '48px 20px', textAlign: 'center', animation: 'fadeUp 0.4s 80ms both' }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5, color: '#555' }}>No projects found</div>
          <div style={{ fontSize: 12, color: '#bbb' }}>Try a different filter.</div>
        </div>
      ) : (
        <div className="grid-3" style={{ animation: 'fadeUp 0.4s 80ms both' }}>
          {filtered.map((p, i) => {
            const accent   = ACCENTS[i % ACCENTS.length]
            const iconPath = TYPE_ICONS[p.data_type]
            const isActive = p.status === 'active'

            return (
              <div
                key={p.id}
                style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 14, padding: '20px', display: 'flex', flexDirection: 'column', transition: 'all 0.2s ease', position: 'relative', animation: `fadeUp 0.4s ${i * 55}ms both`, cursor: isActive ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (isActive) { e.currentTarget.style.borderColor = accent + '60'; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${accent}15` } }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#efefef'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                onClick={() => isActive && navigate('/submit')}
              >
                {/* Status badge */}
                <div style={{ position: 'absolute', top: 14, right: 14 }}>
                  <span className={`pill ${isActive ? 'pill-green' : 'pill-gray'}`}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                    {p.status}
                  </span>
                </div>

                {/* Icon */}
                <div style={{ width: 40, height: 40, borderRadius: 10, background: accent + '15', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, flexShrink: 0 }}>
                  {iconPath ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{iconPath}</svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    </svg>
                  )}
                </div>

                <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 8, paddingRight: 50, lineHeight: 1.3 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: '#777', lineHeight: 1.65, marginBottom: 14, flex: 1 }}>{p.description}</div>

                {/* Tags */}
                <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
                  {[p.language, p.data_type].filter(Boolean).map(t => (
                    <span key={t} style={{ fontSize: 10, fontWeight: 600, border: '1px solid #efefef', padding: '2px 8px', borderRadius: 100, color: '#888', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t}</span>
                  ))}
                </div>

                {/* XP badge + CTA */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 9px', borderRadius: 100 }}>+50 XP base</span>
                  {isActive && (
                    <button
                      onClick={e => { e.stopPropagation(); navigate('/submit') }}
                      style={{ fontSize: 12, fontWeight: 700, color: accent, background: accent + '12', border: `1px solid ${accent}30`, padding: '6px 12px', borderRadius: 100, cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.15s' }}
                    >
                      Contribute →
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
