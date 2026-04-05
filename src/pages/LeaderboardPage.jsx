import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getLeaderboard } from '../lib/supabase'

const MEDAL_COLORS = { 1: '#f59e0b', 2: '#9ca3af', 3: '#b45309' }

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [leaders,  setLeaders]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    getLeaderboard()
      .then(d => { setLeaders(Array.isArray(d) ? d : []); setLoading(false) })
      .catch(() => { setLoading(false) })
  }, [])

  const myRank  = leaders.findIndex(l => l.userId === user?.id) + 1
  const myEntry = leaders.find(l => l.userId === user?.id)
  const totalPassed = leaders.reduce((t, l) => t + (l.passed || 0), 0)

  const Avatar = ({ entry, size = 36, border = false }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.33, fontWeight: 700, color: '#fff', background: '#6366f1', border: border ? '2px solid #6366f1' : '2px solid transparent' }}>
      {entry.avatar ? <img src={entry.avatar} alt={entry.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (entry.name || 'U').charAt(0).toUpperCase()}
    </div>
  )

  return (
    <div className="page">
      {/* Header */}
      <div style={{ marginBottom: 24, animation: 'fadeUp 0.4s both' }}>
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-sub">Top contributors by average quality score.</p>
      </div>

      {/* My rank banner */}
      {myEntry && (
        <div style={{ background: '#0f0f0f', borderRadius: 16, padding: '20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', animation: 'fadeUp 0.4s 40ms both' }}>
          <div style={{ fontSize: 28, fontWeight: 900, fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', color: myRank <= 3 ? '#f59e0b' : 'rgba(255,255,255,0.3)', minWidth: 40 }}>#{myRank}</div>
          <Avatar entry={myEntry} size={42} border />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 2 }}>Your rank</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{myEntry.name}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#fff', letterSpacing: '-1px', lineHeight: 1 }}>{myEntry.avgScore.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>avg / 10</div>
          </div>
        </div>
      )}

      {/* Main layout */}
      <div className={isMobile ? '' : 'grid-main'} style={{ gap: 16 }}>

        {/* Rankings */}
        <div className="card" style={{ animation: 'fadeUp 0.4s 80ms both' }}>
          <div className="card-head">
            <span style={{ fontSize: 13, fontWeight: 700 }}>All-time rankings</span>
            <span style={{ fontSize: 11, color: '#aaa' }}>{leaders.length} contributors</span>
          </div>
          {loading ? (
            <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4].map(i => <div key={i} className="shimmer" style={{ height: 44 }} />)}
            </div>
          ) : leaders.length === 0 ? (
            <div style={{ padding: '48px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 5, color: '#555' }}>No rankings yet</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>Be the first to pass a quality check.</div>
            </div>
          ) : leaders.map((e, i) => {
            const isMe = e.userId === user?.id
            const mc   = MEDAL_COLORS[i + 1]
            return (
              <div
                key={e.userId}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 18px', borderBottom: i < leaders.length - 1 ? '1px solid #f5f5f5' : 'none', background: isMe ? '#fafaff' : '#fff', transition: 'background 0.12s', animation: `fadeUp 0.4s ${i * 30}ms both` }}
              >
                {i < 3 ? (
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: mc + '20', border: `2px solid ${mc}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={mc} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="15" r="6"/><path d="M8.5 8.5 8 3l4 2 4-2-.5 5.5"/>
                    </svg>
                  </div>
                ) : (
                  <div style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#bbb', flexShrink: 0 }}>#{i + 1}</div>
                )}

                <Avatar entry={e} size={32} border={isMe} />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</span>
                    {isMe && <span style={{ fontSize: 9, fontWeight: 800, background: '#6366f1', color: '#fff', padding: '1px 6px', borderRadius: 100, flexShrink: 0 }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: 10, color: '#bbb' }}>{e.passed} passed</div>
                </div>

                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#0a0a0a' }}>{e.avgScore.toFixed(1)}</div>
                  <div style={{ fontSize: 9, color: '#bbb' }}>/ 10</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Stats */}
          <div className="card" style={{ padding: '18px', animation: 'fadeUp 0.4s 120ms both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18 }}>Platform stats</div>
            {[
              { label: 'Contributors', value: leaders.length, color: '#6366f1' },
              { label: 'Total passed',  value: totalPassed,    color: '#16a34a' },
              { label: 'Top score', value: leaders[0] ? `${leaders[0].avgScore.toFixed(1)}/10` : '—', color: '#f59e0b' },
            ].map(({ label, value, color }, i) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: i < 2 ? 16 : 0 }}>
                <div style={{ fontSize: 12, color: '#888' }}>{label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px', color }}>{loading ? '…' : value}</div>
              </div>
            ))}
          </div>

          {/* XP guide */}
          <div style={{ background: '#fafaff', border: '1px solid #e0e7ff', borderRadius: 14, padding: '18px', animation: 'fadeUp 0.4s 160ms both' }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>How XP works</div>
            <div style={{ fontSize: 12, color: '#666', lineHeight: 1.6, marginBottom: 14 }}>
              Higher scores mean more XP and a better rank. Score above 7 to earn.
            </div>
            {[
              ['Score ≥ 7.0', '+50 XP base'],
              ['Score 8.0+',  '+50–70 XP'],
              ['Score 9.0+',  '+70–80 XP'],
              ['Perfect 10',  '+80 XP'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderBottom: '1px solid rgba(0,0,0,0.04)', paddingBottom: 6, marginBottom: 6 }}>
                <span style={{ color: '#888' }}>{k}</span>
                <strong style={{ color: '#6366f1' }}>{v}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
