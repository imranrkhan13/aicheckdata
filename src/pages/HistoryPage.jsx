import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSubmissions } from '../hooks/useSubmissions'

function calcXP(s) {
  const c = Number(s.score_clarity) || 0
  const r = Number(s.score_relevance) || 0
  const q = Number(s.score_quality) || 0
  if (!c || !r || !q) return 0
  const avg = (c + r + q) / 3
  if (avg < 7) return 0
  let xp = 50
  if (avg >= 8) xp += Math.round((avg - 8) * 20)
  if (avg === 10) xp += 30
  return xp
}

function StatusPill({ status }) {
  const cfg = {
    passed:  { bg: '#f0fdf4', color: '#16a34a', label: 'Passed' },
    failed:  { bg: '#fef2f2', color: '#dc2626', label: 'Failed' },
    pending: { bg: '#f5f5f5', color: '#888',    label: 'Pending' },
  }
  const c = cfg[status] || cfg.pending
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 100, background: c.bg, color: c.color }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor' }} />
      {c.label}
    </span>
  )
}

/* Mobile card for one submission */
function SubCard({ s, expanded, onToggle }) {
  const c   = Number(s.score_clarity)   || 0
  const r   = Number(s.score_relevance) || 0
  const q   = Number(s.score_quality)   || 0
  const avg = c && r && q ? (c + r + q) / 3 : null
  const xp  = s.status === 'passed' ? calcXP(s) : 0
  const title = s.project_title || s.projects?.title || 'Project'

  return (
    <div onClick={onToggle} style={{ background: '#fff', border: '1px solid #efefef', borderRadius: 14, padding: '14px 16px', marginBottom: 10, cursor: 'pointer', transition: 'border-color 0.15s' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <StatusPill status={s.status} />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#111', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        {xp > 0 && <span style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', padding: '2px 8px', borderRadius: 100, flexShrink: 0 }}>+{xp} XP</span>}
      </div>
      {avg && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          {[['C', c], ['R', r], ['Q', q]].map(([l, v]) => (
            <div key={l} style={{ flex: 1, textAlign: 'center', padding: '6px 4px', background: '#fafafa', borderRadius: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: v >= 7 ? '#16a34a' : '#dc2626' }}>{v}</div>
              <div style={{ fontSize: 9, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{l}</div>
            </div>
          ))}
          <div style={{ flex: 1, textAlign: 'center', padding: '6px 4px', background: '#fafafa', borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: avg >= 7 ? '#16a34a' : '#dc2626' }}>{avg.toFixed(1)}</div>
            <div style={{ fontSize: 9, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.3px' }}>Avg</div>
          </div>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, color: '#bbb' }}>
          {s.data_type} · {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
        </span>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </div>
      {expanded && s.feedback && (
        <div style={{ marginTop: 12, padding: '12px', background: '#fafafa', borderRadius: 10, borderTop: '1px solid #f0f0f0' }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#bbb', marginBottom: 5 }}>Feedback</div>
          <p style={{ fontSize: 12, color: '#444', lineHeight: 1.7, margin: 0 }}>{s.feedback}</p>
        </div>
      )}
    </div>
  )
}

export default function HistoryPage() {
  const navigate = useNavigate()
  const { submissions, loading, refresh, lastRefresh } = useSubmissions()
  const [filter,     setFilter]     = useState('all')
  const [expanded,   setExpanded]   = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [isMobile,   setIsMobile]   = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const passed  = submissions.filter(s => s.status === 'passed')
  const failed  = submissions.filter(s => s.status === 'failed')
  const pending = submissions.filter(s => !s.status || s.status === 'pending')
  const totalXP = submissions.reduce((t, s) => t + calcXP(s), 0)

  const filtered = { all: submissions, passed, failed, pending }[filter] ?? submissions

  const doRefresh = async () => { setRefreshing(true); await refresh(); setRefreshing(false) }

  return (
    <div className="page">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 24, flexWrap: 'wrap', animation: 'fadeUp 0.4s both' }}>
        <div>
          <h1 className="page-title">My History</h1>
          <p className="page-sub">
            All your submissions with scores and feedback.
            {lastRefresh && <span style={{ marginLeft: 6, color: '#ccc', fontSize: 11 }}>{new Date(lastRefresh).toLocaleTimeString()}</span>}
          </p>
        </div>
        <button
          onClick={doRefresh}
          disabled={refreshing || loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#6366f1', background: '#eef2ff', border: '1.5px solid #c7d2fe', padding: '8px 14px', borderRadius: 100, cursor: 'pointer', fontFamily: 'Inter', transition: 'all 0.15s', flexShrink: 0 }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 20, animation: 'fadeUp 0.4s 40ms both' }}>
        {[
          { label: 'Total',  value: loading ? '…' : submissions.length, color: '#6366f1' },
          { label: 'Passed', value: loading ? '…' : passed.length,      color: '#16a34a' },
          { label: 'Failed', value: loading ? '…' : failed.length,      color: '#dc2626' },
          { label: 'XP',     value: loading ? '…' : totalXP > 0 ? `${totalXP}` : '0', color: '#f59e0b' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#bbb', marginBottom: 7 }}>{label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.8px', color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="filter-row" style={{ animation: 'fadeUp 0.4s 80ms both' }}>
        {[
          { key: 'all',     label: 'All',     n: submissions.length },
          { key: 'passed',  label: 'Passed',  n: passed.length },
          { key: 'failed',  label: 'Failed',  n: failed.length },
          { key: 'pending', label: 'Pending', n: pending.length },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} className={`filter-chip ${filter === f.key ? 'active' : 'idle'}`}>
            {f.label} <span style={{ opacity: 0.6 }}>({f.n})</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="card" style={{ animation: 'fadeUp 0.4s 120ms both' }}>
        {loading ? (
          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[80,65,72,55,78].map((w,i) => <div key={i} className="shimmer" style={{ height: 14, width: `${w}%` }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, color: '#555' }}>
              {filter === 'all' ? 'No submissions yet' : `No ${filter} submissions`}
            </div>
            <div style={{ fontSize: 12, color: '#bbb', marginBottom: 20 }}>
              {filter === 'all' ? 'Submit a sample and it appears here immediately.' : 'Try a different filter.'}
            </div>
            {filter === 'all' && (
              <button onClick={() => navigate('/submit')} className="btn-primary">Submit now</button>
            )}
          </div>
        ) : isMobile ? (
          /* Mobile: card list */
          <div style={{ padding: '12px' }}>
            {filtered.map(s => (
              <SubCard key={s.id} s={s} expanded={expanded === s.id} onToggle={() => setExpanded(expanded === s.id ? null : s.id)} />
            ))}
          </div>
        ) : (
          /* Desktop: table */
          <table className="data-table">
            <thead>
              <tr>
                {['Project', 'Type', 'Status', 'Clarity', 'Relevance', 'Quality', 'Avg', 'XP', 'Date', ''].map(h => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const c   = Number(s.score_clarity)   || 0
                const r   = Number(s.score_relevance) || 0
                const q   = Number(s.score_quality)   || 0
                const avg = c && r && q ? (c + r + q) / 3 : null
                const xp  = calcXP(s)
                const isExp = expanded === s.id
                const title = s.project_title || s.projects?.title || 'Project'

                return (
                  <>
                    <tr
                      key={s.id}
                      onClick={() => setExpanded(isExp ? null : s.id)}
                      style={{ cursor: 'pointer', background: isExp ? '#fafafa' : '#fff' }}
                    >
                      <td style={{ fontWeight: 600, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#222' }}>{title}</td>
                      <td style={{ color: '#aaa' }}>{s.data_type || '—'}</td>
                      <td><StatusPill status={s.status} /></td>
                      {['score_clarity','score_relevance','score_quality'].map(k => (
                        <td key={k} style={{ fontWeight: 600, color: Number(s[k]) >= 7 ? '#16a34a' : Number(s[k]) ? '#dc2626' : '#ddd' }}>
                          {Number(s[k]) || '—'}
                        </td>
                      ))}
                      <td style={{ fontWeight: 800, color: avg >= 7 ? '#16a34a' : avg ? '#dc2626' : '#ddd' }}>{avg ? avg.toFixed(1) : '—'}</td>
                      <td style={{ fontWeight: 700, color: xp ? '#f59e0b' : '#ddd' }}>{xp ? `+${xp}` : '—'}</td>
                      <td style={{ color: '#bbb', whiteSpace: 'nowrap' }}>
                        {s.created_at ? new Date(s.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                      <td>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExp ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                          <polyline points="9 18 15 12 9 6"/>
                        </svg>
                      </td>
                    </tr>
                    {isExp && (
                      <tr key={`${s.id}-exp`} style={{ background: '#fafafa' }}>
                        <td colSpan={10} style={{ padding: '0 14px 14px' }}>
                          <div style={{ background: '#fff', border: '1px solid #f0f0f0', borderRadius: 10, padding: '14px 16px' }}>
                            {s.feedback && (
                              <div style={{ marginBottom: s.content ? 12 : 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#bbb', marginBottom: 6 }}>AI Feedback</div>
                                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.75, margin: 0 }}>{s.feedback}</p>
                              </div>
                            )}
                            {s.content && (
                              <div style={{ marginTop: s.feedback ? 12 : 0 }}>
                                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#bbb', marginBottom: 6 }}>Submitted content</div>
                                <pre style={{ fontSize: 12, color: '#555', lineHeight: 1.65, background: '#fafafa', padding: '10px 12px', borderRadius: 8, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                                  {s.content.slice(0, 400)}{s.content.length > 400 ? '…' : ''}
                                </pre>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
