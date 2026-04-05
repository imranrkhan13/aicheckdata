import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSubmissions } from '../hooks/useSubmissions'
import { getProjects, createSubmission, DEMO_PROJECTS } from '../lib/supabase'
import { scoreSubmission } from '../lib/ai'

/* ── XP calculation (replaces money, more impressive) ── */
function calcXP(clarity, relevance, quality) {
  const avg = (clarity + relevance + quality) / 3
  if (avg < 7) return 0
  let xp = 50 // base
  if (avg >= 8) xp += Math.round((avg - 8) * 20)
  if (avg === 10) xp += 30
  return xp
}

/* ── Demo samples ─────────────────────────────────────── */
const SAMPLES = {
  'English Instruction Pairs': `Instruction: Explain how photosynthesis works to a 12-year-old.

Response: Photosynthesis is how plants make their own food using sunlight. Think of a plant like a tiny kitchen — it takes in sunlight through its leaves, water from the soil through its roots, and carbon dioxide from the air. It mixes all three together to produce sugar (energy for the plant) and releases oxygen as a byproduct — the same air we breathe. Without photosynthesis, almost no life on Earth could exist.`,

  'Conversational Dialogue': `Alex: I can't believe it's Friday already.
Jordan: Right? Did you finish that report you were stressed about?
Alex: Just barely. Stayed late Wednesday but got it done. Any plans this weekend?
Jordan: Thinking about the farmers market Saturday morning. Want to come?
Alex: That actually sounds perfect. What time?
Jordan: Around 9 — we can grab coffee on the way.
Alex: Done. I'll text you in the morning.`,

  'Product Descriptions': `AeroGrip Pro Wireless Gaming Mouse

Precision-built for competitive play, the AeroGrip Pro pairs a 26,000 DPI optical sensor with a 1ms wireless response time that matches wired performance. At just 78g, it ranks among the lightest full-feature gaming mice available. Six programmable buttons and a dual-mode scroll wheel adapt to any genre. Textured side grips maintain control through extended sessions. Battery life reaches 70 hours; USB-C fast charge adds 3 hours in 10 minutes. Compatible with Windows, macOS, and Linux via 2.4GHz dongle or Bluetooth 5.0.`,

  'Image Caption Dataset': `A sun-drenched café terrace in late afternoon. Four iron tables cast long shadows across terracotta tiles. Two women sit at the nearest table, leaning toward each other mid-conversation, each holding a ceramic espresso cup. A tabby cat sleeps on an empty chair behind them. Potted lavender lines the low stone wall at the terrace edge, and golden-hour light warms the entire scene with a soft amber glow.`,
}

function getSample(project) {
  return SAMPLES[project?.title] || SAMPLES['English Instruction Pairs']
}

/* ── Score pill ─────────────────────────────────────────── */
function ScorePill({ label, value }) {
  const col = value >= 8 ? '#15803d' : value >= 7 ? '#6366f1' : value >= 5 ? '#c2410c' : '#dc2626'
  const bg  = value >= 8 ? '#f0fdf4' : value >= 7 ? '#eef2ff' : value >= 5 ? '#fff7ed' : '#fef2f2'
  return (
    <div style={{ flex: 1, textAlign: 'center', padding: '14px 8px', background: bg, borderRadius: 12 }}>
      <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: '-1px', color: col }}>{value}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: col, opacity: 0.7, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: 2 }}>{label}</div>
    </div>
  )
}

/* ── Progress loader ────────────────────────────────────── */
const STEPS = [
  'Reading your submission…',
  'Checking clarity and structure…',
  'Evaluating project relevance…',
  'Assessing content quality…',
  'Generating your score…',
]

function Loader({ step }) {
  const pct = Math.round(((step + 1) / STEPS.length) * 100)
  return (
    <div style={{ background: '#f8f8ff', border: '1.5px solid #c7d2fe', borderRadius: 16, padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'spin 1.5s linear infinite' }}>
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#3730a3' }}>Quality Check Running</div>
          <div style={{ fontSize: 11, color: '#6366f1', marginTop: 1 }}>{STEPS[step]}</div>
        </div>
        <div style={{ marginLeft: 'auto', fontSize: 13, fontWeight: 800, color: '#6366f1' }}>{pct}%</div>
      </div>
      <div style={{ height: 5, background: '#e0e7ff', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #818cf8)', borderRadius: 3, transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? '#6366f1' : '#e0e7ff', transition: 'background 0.3s' }} />
        ))}
      </div>
    </div>
  )
}

/* ── Result card ────────────────────────────────────────── */
function ResultCard({ result, xp, onReset, onViewHistory }) {
  const passed = result.verdict === 'pass'
  const avg    = (result.clarity + result.relevance + result.quality) / 3

  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: `2px solid ${passed ? '#16a34a' : '#dc2626'}`, animation: 'slideDown 0.4s cubic-bezier(0.4,0,0.2,1) both' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', background: passed ? 'linear-gradient(135deg,#15803d,#16a34a)' : 'linear-gradient(135deg,#b91c1c,#dc2626)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {passed ? <polyline points="20 6 9 17 4 12"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{passed ? 'Submission Accepted' : 'Not Accepted Yet'}</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.65)' }}>Average score: {avg.toFixed(1)} / 10</div>
        </div>
        {passed && xp > 0 && (
          <div style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', padding: '6px 14px', borderRadius: 100, display: 'flex', alignItems: 'center', gap: 5 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>+{xp} XP</span>
          </div>
        )}
      </div>

      {/* Scores */}
      <div style={{ padding: '16px', background: '#fff', display: 'flex', gap: 8, borderBottom: '1px solid #f0f0f0' }}>
        <ScorePill label="Clarity"   value={result.clarity}   />
        <ScorePill label="Relevance" value={result.relevance} />
        <ScorePill label="Quality"   value={result.quality}   />
      </div>

      {/* Feedback */}
      <div style={{ padding: '16px', background: '#fff' }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#bbb', marginBottom: 7 }}>AI Feedback</div>
        <p style={{ fontSize: 13, lineHeight: 1.75, color: '#333', margin: '0 0 16px' }}>{result.feedback}</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={onReset}
            style={{ flex: 1, minWidth: 120, background: '#0a0a0a', color: '#fff', border: 'none', padding: '11px', borderRadius: 100, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#222'}
            onMouseLeave={e => e.currentTarget.style.background = '#0a0a0a'}
          >
            {passed ? 'Submit another' : 'Improve and retry'}
          </button>
          <button
            onClick={onViewHistory}
            style={{ flex: 1, minWidth: 120, background: '#f5f5f5', color: '#444', border: 'none', padding: '11px', borderRadius: 100, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#eee'}
            onMouseLeave={e => e.currentTarget.style.background = '#f5f5f5'}
          >
            View History →
          </button>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════ */
export default function SubmitPage() {
  const { user }          = useAuth()
  const { addSubmission } = useSubmissions()
  const navigate          = useNavigate()
  const resultRef         = useRef(null)

  const [projects,  setProjects]  = useState(DEMO_PROJECTS)
  const [selected,  setSelected]  = useState(null)
  const [step,      setStep]      = useState('pick') // 'pick' | 'write' | 'loading' | 'result'
  const [dataType,  setDataType]  = useState('instruction')
  const [content,   setContent]   = useState('')
  const [loadStep,  setLoadStep]  = useState(0)
  const [loadMsg,   setLoadMsg]   = useState('')
  const [result,    setResult]    = useState(null)
  const [error,     setError]     = useState('')

  const PALETTES = [
    { bg: '#eef2ff', border: '#c7d2fe', accent: '#6366f1' },
    { bg: '#f0fdf4', border: '#bbf7d0', accent: '#16a34a' },
    { bg: '#fff7ed', border: '#fed7aa', accent: '#ea580c' },
    { bg: '#fdf4ff', border: '#e9d5ff', accent: '#9333ea' },
  ]

  useEffect(() => { getProjects().then(p => { if (p?.length) setProjects(p) }) }, [])

  const pickProject = (p) => {
    setSelected(p)
    setDataType(p.data_type !== 'any' ? p.data_type : 'instruction')
    setContent('')
    setResult(null)
    setError('')
    setStep('write')
  }

  const handleSubmit = async () => {
    if (content.trim().length < 30) { setError('Write at least 30 characters.'); return }
    setError('')
    setStep('loading')
    setLoadStep(0)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const score = await scoreSubmission(content, selected, (msg, idx) => {
        setLoadStep(idx)
        setLoadMsg(msg)
      })
      setResult(score)
      setStep('result')

      const sub = await createSubmission({
        user_id:         user.id,
        project_title:   selected.title,
        content,
        data_type:       dataType,
        status:          score.verdict === 'pass' ? 'passed' : 'failed',
        score_clarity:   score.clarity,
        score_relevance: score.relevance,
        score_quality:   score.quality,
        feedback:        score.feedback,
      })
      addSubmission({ ...sub, projects: { title: selected.title } })

      // Scroll to result after render
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)

    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
      setStep('write')
    }
  }

  const reset = () => {
    setResult(null)
    setContent('')
    setError('')
    setStep('pick')
    setSelected(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const xp = result ? calcXP(result.clarity, result.relevance, result.quality) : 0

  return (
    <>
      <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideDown{ from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        .ta:focus { outline:none; border-color:#6366f1!important; box-shadow:0 0 0 3px rgba(99,102,241,0.12)!important; }
        .proj-btn:hover { transform:translateY(-2px); box-shadow:0 6px 18px rgba(0,0,0,0.08)!important; }
        @media(max-width:640px){ .page-pad{ padding:20px 16px 24px!important; } }
      `}</style>

      <div className="page-pad" style={{ padding: '32px 28px 48px', maxWidth: 640, margin: '0 auto' }}>

        {/* ── Header ── */}
        <div style={{ marginBottom: 28, animation: 'fadeUp 0.4s both' }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.6px', fontFamily: 'Instrument Serif, serif', fontStyle: 'italic', marginBottom: 4 }}>Submit Data</h1>
          <p style={{ fontSize: 13, color: '#aaa' }}>
            {step === 'pick' ? 'Choose a project to contribute to.' :
             step === 'write' ? `Writing for: ${selected?.title}` :
             step === 'loading' ? 'Running quality check…' :
             result?.verdict === 'pass' ? 'Accepted! Great work.' : 'Here is your feedback.'}
          </p>
        </div>

        {/* ── STEP 1: Pick a project ── */}
        {step === 'pick' && (
          <div style={{ animation: 'fadeUp 0.4s 40ms both' }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#aaa', marginBottom: 14 }}>
              {projects.length} active projects
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {projects.map((p, i) => {
                const pal = PALETTES[i % PALETTES.length]
                return (
                  <button
                    key={p.id}
                    className="proj-btn"
                    onClick={() => pickProject(p)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer',
                      background: '#fff', border: `1.5px solid ${pal.border}`,
                      borderRadius: 14, padding: '16px 18px',
                      display: 'flex', alignItems: 'center', gap: 14,
                      transition: 'all 0.18s ease', fontFamily: 'Inter',
                      animation: `fadeUp 0.4s ${i * 60}ms both`,
                    }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: pal.bg, border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={pal.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 3 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: '#888', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{p.description}</div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 8, flexWrap: 'wrap' }}>
                        {[p.language, p.data_type].filter(Boolean).map(t => (
                          <span key={t} style={{ fontSize: 10, fontWeight: 600, background: pal.bg, border: `1px solid ${pal.border}`, color: pal.accent, padding: '2px 8px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{t}</span>
                        ))}
                        <span style={{ fontSize: 10, fontWeight: 600, color: '#aaa', marginLeft: 'auto' }}>+50 XP base →</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ── STEP 2: Write ── */}
        {step === 'write' && (
          <div style={{ animation: 'fadeUp 0.4s both' }}>
            {/* Back */}
            <button onClick={() => { setStep('pick'); setSelected(null); setContent('') }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter', marginBottom: 20, padding: 0, fontWeight: 500 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              Change project
            </button>

            {/* Project reminder */}
            {selected && (() => {
              const i = projects.findIndex(p => p.id === selected.id)
              const pal = PALETTES[i % PALETTES.length]
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: pal.bg, border: `1px solid ${pal.border}`, borderRadius: 12, padding: '12px 16px', marginBottom: 20 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: pal.accent, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: pal.accent }}>{selected.title}</div>
                    <div style={{ fontSize: 11, color: pal.accent, opacity: 0.7, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.description}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: pal.accent, background: '#fff', padding: '4px 10px', borderRadius: 100, border: `1px solid ${pal.border}`, flexShrink: 0 }}>+50 XP</div>
                </div>
              )
            })()}

            {/* Data type */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#aaa', marginBottom: 7 }}>Data type</label>
              <select value={dataType} onChange={e => setDataType(e.target.value)}
                style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 10, padding: '10px 12px', fontSize: 13, background: '#fff', fontFamily: 'Inter', color: '#111', cursor: 'pointer' }}>
                <option value="instruction">Instruction + Response pair</option>
                <option value="conversation">Conversation</option>
                <option value="text">Text / Description</option>
                <option value="description">Image description</option>
              </select>
            </div>

            {/* Textarea */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#aaa' }}>Your content</label>
                <button
                  onClick={() => { setContent(getSample(selected)); setError('') }}
                  style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', background: '#eef2ff', border: '1px solid #c7d2fe', padding: '4px 11px', borderRadius: 100, cursor: 'pointer', fontFamily: 'Inter' }}
                >
                  Load sample
                </button>
              </div>
              <textarea
                value={content}
                onChange={e => { setContent(e.target.value); setError('') }}
                className="ta"
                placeholder={dataType === 'instruction'
                  ? 'Instruction: [your question or task]\n\nResponse: [your detailed answer]'
                  : dataType === 'conversation'
                    ? 'A: ...\nB: ...\nA: ...'
                    : 'Write your sample here…'}
                style={{ width: '100%', border: '1.5px solid #e5e5e5', borderRadius: 12, padding: '13px', fontSize: 13, fontFamily: 'Inter', lineHeight: 1.65, resize: 'vertical', minHeight: 180, color: '#111', background: '#fff', transition: 'border-color 0.15s' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
                {error && <span style={{ fontSize: 11, color: '#dc2626', fontWeight: 500 }}>{error}</span>}
                <span style={{ fontSize: 11, color: content.length < 30 ? '#f59e0b' : '#bbb', marginLeft: 'auto', fontWeight: 500 }}>
                  {content.length < 30 ? `${30 - content.length} more chars needed` : `${content.length} chars`}
                </span>
              </div>
            </div>

            {/* XP preview */}
            <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 10, padding: '12px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              <span style={{ fontSize: 12, color: '#555' }}>Score ≥ 7.0 → <strong>+50 XP</strong>&nbsp;&nbsp;·&nbsp;&nbsp;Score ≥ 8.0 → <strong>+50–70 XP</strong>&nbsp;&nbsp;·&nbsp;&nbsp;Perfect 10 → <strong>+80 XP</strong></span>
            </div>

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={content.length < 30}
              style={{ width: '100%', background: content.length < 30 ? '#e5e5e5' : '#0a0a0a', color: content.length < 30 ? '#aaa' : '#fff', border: 'none', padding: '14px', borderRadius: 100, fontSize: 14, fontWeight: 700, cursor: content.length < 30 ? 'not-allowed' : 'pointer', fontFamily: 'Inter', transition: 'all 0.18s' }}
              onMouseEnter={e => { if (content.length >= 30) e.currentTarget.style.background = '#222' }}
              onMouseLeave={e => { if (content.length >= 30) e.currentTarget.style.background = '#0a0a0a' }}
            >
              Submit for quality check
            </button>
          </div>
        )}

        {/* ── STEP 3: Loading ── */}
        {step === 'loading' && (
          <div style={{ animation: 'fadeUp 0.3s both' }}>
            <Loader step={loadStep} />
            <div style={{ marginTop: 16, padding: '14px 16px', background: '#fafafa', borderRadius: 12, border: '1px solid #f0f0f0' }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#bbb', marginBottom: 8 }}>Your submission</div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.65, margin: 0 }}>{content.slice(0, 200)}{content.length > 200 ? '…' : ''}</p>
            </div>
          </div>
        )}

        {/* ── STEP 4: Result ── */}
        {step === 'result' && result && (
          <div ref={resultRef} style={{ animation: 'fadeUp 0.4s both' }}>
            <ResultCard
              result={result}
              xp={xp}
              onReset={reset}
              onViewHistory={() => navigate('/history')}
            />

            {/* Scoring guide collapsed below result */}
            <details style={{ marginTop: 16 }}>
              <summary style={{ fontSize: 12, color: '#aaa', cursor: 'pointer', fontWeight: 600, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6, userSelect: 'none' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                How scoring works
              </summary>
              <div style={{ marginTop: 12, background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 12, padding: '14px 16px', fontSize: 12, color: '#666', lineHeight: 1.7 }}>
                <strong>Clarity</strong> — Is it well written and easy to understand?<br />
                <strong>Relevance</strong> — Does it match what the project needs?<br />
                <strong>Quality</strong> — Is it accurate and useful for AI training?<br /><br />
                <strong>XP system:</strong> Score ≥ 7.0 = 50 XP base. Each point above 8.0 adds 20 XP. Perfect 10 adds a 30 XP bonus.
              </div>
            </details>
          </div>
        )}
      </div>
    </>
  )
}
