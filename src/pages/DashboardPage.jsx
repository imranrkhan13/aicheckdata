import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubmissions } from '../hooks/useSubmissions'
import { getProjects } from '../lib/supabase'

function calcXP(subs) {
  return subs.filter(s => s.status === 'passed').reduce((t, s) => {
    const c = Number(s.score_clarity) || 0
    const r = Number(s.score_relevance) || 0
    const q = Number(s.score_quality) || 0
    const avg = (c && r && q) ? (c + r + q) / 3 : 0
    if (avg < 7) return t
    let xp = 50
    if (avg >= 8) xp += Math.round((avg - 8) * 20)
    if (avg === 10) xp += 30
    return t + xp
  }, 0)
}

function StatCard({ label, value, sub, color, loading, icon }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 14, padding: '18px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#bbb' }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: color + '15', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      {loading
        ? <div style={{ height: 30, background: 'linear-gradient(90deg,#f5f5f5 25%,#eaeaea 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', borderRadius: 8, animation: 'shimmer 1.3s infinite' }} />
        : <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-1px', color: '#0a0a0a', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      }
      {sub && !loading && <div style={{ fontSize: 11, color: '#bbb', fontWeight: 500 }}>{sub}</div>}
    </div>
  )
}

function Bar({ label, value }) {
  const pct = Math.min(100, (Number(value) / 10) * 100)
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
        <span style={{ color: '#555', fontWeight: 500 }}>{label}</span>
        <span style={{ fontWeight: 700 }}>{Number(value).toFixed(1)}</span>
      </div>
      <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#6366f1', borderRadius: 2, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  )
}

const Shimmer = ({ h = 14, r = 6, w = '100%' }) => (
  <div style={{ height: h, width: w, borderRadius: r, background: 'linear-gradient(90deg,#f5f5f5 25%,#eaeaea 50%,#f5f5f5 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.3s infinite' }} />
)

export default function DashboardPage() {
  const { user, profile }  = useAuth()
  const { submissions, loading } = useSubmissions()
  const navigate = useNavigate()
  const [projects, setProjects]   = useState([])
  const [projLoad, setProjLoad]   = useState(true)
  const [isMobile, setIsMobile]   = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    getProjects().then(p => { setProjects(Array.isArray(p) ? p : []); setProjLoad(false) })
  }, [])

  const name   = profile?.name || user?.user_metadata?.full_name || 'there'
  const hour   = new Date().getHours()
  const greet  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const passed   = submissions.filter(s => s.status === 'passed')
  const scored   = submissions.filter(s => Number(s.score_clarity) > 0 && Number(s.score_relevance) > 0 && Number(s.score_quality) > 0)
  const passRate = submissions.length > 0 ? Math.round((passed.length / submissions.length) * 100) : 0
  const xpTotal  = calcXP(submissions)

  const avg3 = (k) => {
    const vals = scored.map(s => Number(s[k])).filter(v => v > 0)
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  }
  const avgC   = avg3('score_clarity')
  const avgR   = avg3('score_relevance')
  const avgQ   = avg3('score_quality')
  const avgAll = scored.length ? (avgC + avgR + avgQ) / 3 : 0

  const PROJ_COLORS = ['#6366f1', '#16a34a', '#ea580c']

  const StatIcon = ({ path }) => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
  )

  const gridCols = isMobile ? '1fr 1fr' : 'repeat(4,1fr)'

  return (
    <>
      <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .rh:hover { background:#fafafa!important; }
        .pj:hover { border-color:rgba(99,102,241,0.25)!important; transform:translateY(-2px)!important; box-shadow:0 6px 18px rgba(0,0,0,0.06)!important; }
        @media(max-width:640px){ .dash-pad{padding:20px 16px 24px!important;} }
      `}</style>

      <div className="dash-pad" style={{ padding: '32px 28px 48px', maxWidth: 1040, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 28, flexWrap: 'wrap', animation: 'fadeUp 0.4s both' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 800, letterSpacing: '-0.5px', fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', marginBottom: 3 }}>
              {greet}, {name.split(' ')[0]}
            </h1>
            <p style={{ fontSize: 13, color: '#aaa' }}>Your contribution overview.</p>
          </div>
          <button
            onClick={() => navigate('/submit')}
            style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#6366f1', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', transition: 'background 0.15s', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.background = '#4f52c8'}
            onMouseLeave={e => e.currentTarget.style.background = '#6366f1'}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Submit data
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: gridCols, gap: 12, marginBottom: 24 }}>
          <StatCard label="Submissions" value={loading ? '…' : submissions.length} sub={`${passRate}% pass rate`} color="#6366f1" loading={loading}
            icon={<StatIcon path={<><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>} />}
          />
          <StatCard label="Passed QA" value={loading ? '…' : passed.length} sub="AI accepted" color="#16a34a" loading={loading}
            icon={<StatIcon path={<polyline points="20 6 9 17 4 12"/>} />}
          />
          <StatCard label="Avg Score" value={loading ? '…' : avgAll > 0 ? avgAll.toFixed(1) : '—'} sub="out of 10.0" color="#ea580c" loading={loading}
            icon={<StatIcon path={<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>} />}
          />
          <StatCard label="XP Earned" value={loading ? '…' : xpTotal > 0 ? xpTotal : '0'} sub="quality points" color="#f59e0b" loading={loading}
            icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
          />
        </div>

        {/* Main grid — stacks on mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '3fr 2fr', gap: 16, marginBottom: 24 }}>

          {/* Recent table */}
          <div style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 14, overflow: 'hidden', animation: 'fadeUp 0.5s 80ms both' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700 }}>Recent submissions</span>
              <button onClick={() => navigate('/history')} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600 }}>
                View all →
              </button>
            </div>

            {loading ? (
              <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[80, 65, 72].map((w, i) => <Shimmer key={i} h={14} w={`${w}%`} />)}
              </div>
            ) : submissions.length === 0 ? (
              <div style={{ padding: '40px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>No submissions yet</div>
                <div style={{ fontSize: 12, color: '#bbb', marginBottom: 18 }}>Submit a sample and it appears here instantly.</div>
                <button onClick={() => navigate('/submit')} style={{ background: '#6366f1', color: '#fff', border: 'none', padding: '9px 20px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter' }}>Start now</button>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                    {['Project', 'Status', isMobile ? 'Score' : 'Score', isMobile ? 'XP' : 'XP Earned'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#bbb' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {submissions.slice(0, 7).map((s, i) => {
                    const c   = Number(s.score_clarity)   || 0
                    const r   = Number(s.score_relevance) || 0
                    const q   = Number(s.score_quality)   || 0
                    const sc  = (c && r && q) ? ((c + r + q) / 3).toFixed(1) : null
                    const xp  = s.status === 'passed' && sc ? (() => {
                      let x = 50
                      if (Number(sc) >= 8) x += Math.round((Number(sc) - 8) * 20)
                      if (Number(sc) === 10) x += 30
                      return x
                    })() : null
                    const title = s.project_title || s.projects?.title || 'Project'
                    const ok = s.status === 'passed'
                    const fail = s.status === 'failed'
                    return (
                      <tr key={s.id || i} className="rh" style={{ borderBottom: '1px solid #fafafa', transition: 'background 0.15s' }}>
                        <td style={{ padding: '11px 14px', fontWeight: 600, maxWidth: isMobile ? 90 : 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#222' }}>{title}</td>
                        <td style={{ padding: '11px 14px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: ok ? '#f0fdf4' : fail ? '#fef2f2' : '#f5f5f5', color: ok ? '#16a34a' : fail ? '#dc2626' : '#888' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
                            {ok ? 'Passed' : fail ? 'Failed' : 'Pending'}
                          </span>
                        </td>
                        <td style={{ padding: '11px 14px', fontWeight: 800, color: sc >= 7 ? '#16a34a' : sc ? '#dc2626' : '#ddd' }}>{sc ?? '—'}</td>
                        <td style={{ padding: '11px 14px', fontWeight: 700, color: xp ? '#f59e0b' : '#ddd' }}>{xp ? `+${xp}` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Quality panel */}
          <div style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 14, padding: '18px', animation: 'fadeUp 0.5s 120ms both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Quality breakdown</div>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}><Shimmer h={56} r={12} /><Shimmer h={12} /><Shimmer h={12} w="80%" /></div>
            ) : scored.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 16 }}>
                <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: '-1px', color: '#e5e7eb', marginBottom: 6 }}>—</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5, color: '#555' }}>No scores yet</div>
                <div style={{ fontSize: 12, color: '#bbb', lineHeight: 1.6 }}>Pass a quality check to see your breakdown.</div>
              </div>
            ) : (
              <>
                {/* Score ring */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px', background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0', marginBottom: 18 }}>
                  {(() => {
                    const v   = Math.min(10, Math.max(0, avgAll))
                    const r   = 24, c = 2 * Math.PI * r
                    const col = v >= 8 ? '#16a34a' : v >= 7 ? '#6366f1' : v >= 5 ? '#ea580c' : '#dc2626'
                    return (
                      <>
                        <div style={{ position: 'relative', width: 58, height: 58, flexShrink: 0 }}>
                          <svg width="58" height="58" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="29" cy="29" r={r} fill="none" stroke="#f0f0f0" strokeWidth="4" />
                            <circle cx="29" cy="29" r={r} fill="none" stroke={col} strokeWidth="4" strokeDasharray={c} strokeDashoffset={c - (v / 10) * c} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                          </svg>
                          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: col }}>{v.toFixed(1)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px', marginBottom: 2 }}>
                            {v >= 8 ? 'Excellent' : v >= 7 ? 'Good work' : 'Keep going'}
                          </div>
                          <div style={{ fontSize: 11, color: '#aaa' }}>Overall average</div>
                        </div>
                      </>
                    )
                  })()}
                </div>
                <Bar label="Clarity"   value={avgC} />
                <Bar label="Relevance" value={avgR} />
                <Bar label="Quality"   value={avgQ} />

                <div style={{ marginTop: 14, padding: '12px 14px', background: '#fffbeb', borderRadius: 10, border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>{xpTotal} XP total</div>
                    <div style={{ fontSize: 10, color: '#b45309' }}>{passed.length} submissions passed</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Active projects */}
        <div style={{ animation: 'fadeUp 0.5s 160ms both' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Active projects</span>
            <button onClick={() => navigate('/projects')} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', fontWeight: 600 }}>
              View all →
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: 12 }}>
            {projLoad
              ? [1,2,3].map(i => <Shimmer key={i} h={isMobile ? 72 : 110} r={12} />)
              : projects.slice(0, isMobile ? 2 : 3).map((p, i) => (
                <div
                  key={p.id}
                  className="pj"
                  onClick={() => navigate('/submit')}
                  style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 12, padding: '16px', cursor: 'pointer', transition: 'all 0.2s ease', animation: `fadeUp 0.5s ${200 + i * 50}ms both` }}
                >
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PROJ_COLORS[i % 3], marginBottom: 9 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, color: '#111' }}>{p.title}</div>
                  <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>
                  <div style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>+50 XP base</div>
                </div>
              ))
            }
          </div>
        </div>
      </div>
    </>
  )
}
