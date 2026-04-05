import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithGoogle } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

const G = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

export default function LandingPage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [signing, setSigning] = useState(false)
  const [faq,     setFaq]     = useState(null)

  useEffect(() => {
    if (!loading && user) navigate('/dashboard', { replace: true })
  }, [user, loading, navigate])

  const signIn = async () => {
    setSigning(true)
    try { await signInWithGoogle() } catch { setSigning(false) }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html{scroll-behavior:smooth}
        body{font-family:'Inter',sans-serif;background:#fff;-webkit-font-smoothing:antialiased}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{0%,100%{opacity:.5}50%{opacity:1}}
        @keyframes spin{to{transform:rotate(360deg)}}

        .lp{font-family:'Inter',sans-serif;color:#0a0a0a;overflow-x:hidden;background:#fff}

        /* NAV */
        .lp-nav{position:fixed;top:0;left:0;right:0;z-index:100;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 clamp(16px,4vw,48px);background:rgba(255,255,255,0.92);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border-bottom:1px solid rgba(0,0,0,0.06)}
        .lp-logo{font-family:'Instrument Serif',serif;font-style:italic;font-size:20px;letter-spacing:-0.3px;display:flex;align-items:center;gap:7px;color:#0a0a0a;text-decoration:none}
        .logo-dot{width:7px;height:7px;background:#6366f1;border-radius:50%;animation:glow 2s ease-in-out infinite;flex-shrink:0}
        .nav-btns{display:flex;gap:8px}
        .btn-nav-ghost{display:inline-flex;align-items:center;gap:6px;background:transparent;color:#555;border:1.5px solid rgba(0,0,0,0.12);padding:8px 16px;font-size:13px;font-weight:500;font-family:'Inter';border-radius:100px;cursor:pointer;transition:all 0.15s}
        .btn-nav-ghost:hover{border-color:rgba(0,0,0,0.25);color:#0a0a0a}
        .btn-nav-dark{display:inline-flex;align-items:center;gap:8px;background:#0a0a0a;color:#fff;border:none;padding:9px 18px;font-size:13px;font-weight:600;font-family:'Inter';border-radius:100px;cursor:pointer;transition:all 0.18s}
        .btn-nav-dark:hover{background:#222;transform:translateY(-1px);box-shadow:0 6px 20px rgba(0,0,0,0.18)}
        .btn-nav-dark:disabled{opacity:.6;cursor:wait}

        /* HERO */
        .lp-hero{min-height:100vh;display:flex;align-items:center;padding:80px clamp(16px,4vw,48px) 60px;position:relative;overflow:hidden}
        .blob{position:absolute;border-radius:50%;pointer-events:none}
        .blob1{top:-120px;right:-80px;width:420px;height:420px;background:radial-gradient(circle,rgba(99,102,241,.09) 0%,transparent 70%)}
        .blob2{bottom:-60px;left:-60px;width:340px;height:340px;background:radial-gradient(circle,rgba(22,163,74,.06) 0%,transparent 70%)}
        .hero-inner{max-width:1100px;margin:0 auto;width:100%;display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
        .hero-badge{display:inline-flex;align-items:center;gap:7px;background:#f0f0ff;border:1px solid #c7d2fe;padding:5px 13px;border-radius:100px;font-size:11px;font-weight:600;color:#6366f1;margin-bottom:20px;animation:fadeUp 0.5s 0.1s both}
        .badge-dot{width:5px;height:5px;background:#6366f1;border-radius:50%;animation:glow 2s infinite}
        .hero-h1{font-family:'Instrument Serif',serif;font-size:clamp(40px,5.5vw,72px);line-height:1.0;letter-spacing:-2.5px;color:#0a0a0a;margin-bottom:18px;animation:fadeUp 0.6s 0.15s both}
        .hero-h1 em{font-style:italic;color:#6366f1}
        .hero-sub{font-size:16px;color:#666;line-height:1.7;margin-bottom:32px;letter-spacing:-0.1px;animation:fadeUp 0.6s 0.25s both;max-width:440px}
        .hero-actions{display:flex;align-items:center;gap:12px;flex-wrap:wrap;animation:fadeUp 0.6s 0.35s both}
        .btn-hero{display:inline-flex;align-items:center;gap:9px;background:#0a0a0a;color:#fff;border:none;padding:13px 26px;font-size:15px;font-weight:700;font-family:'Inter';border-radius:100px;cursor:pointer;transition:all 0.2s;letter-spacing:-.15px}
        .btn-hero:hover{background:#1f1f1f;transform:translateY(-2px);box-shadow:0 10px 28px rgba(0,0,0,.2)}
        .btn-hero:disabled{opacity:.6;cursor:wait}
        .btn-scroll{font-size:14px;color:#888;background:none;border:none;cursor:pointer;font-family:'Inter';font-weight:500;transition:color .15s}
        .btn-scroll:hover{color:#0a0a0a}

        /* HERO MOCKUP */
        .hero-right{animation:fadeUp 0.7s 0.4s both}
        .mock-card{background:#fff;border:1px solid #eee;border-radius:16px;padding:18px;margin-bottom:12px;box-shadow:0 4px 16px rgba(0,0,0,.05);transition:all .2s}
        .mock-card:hover{box-shadow:0 8px 28px rgba(0,0,0,.08);transform:translateY(-2px)}
        .score-row{display:flex;gap:8px;margin-top:12px}
        .score-item{flex:1;text-align:center;padding:10px 4px;background:#fafafa;border-radius:10px;border:1px solid #f0f0f0}

        /* DIVIDER */
        .lp-divider{padding:22px clamp(16px,4vw,48px);border-top:1px solid #f5f5f5;border-bottom:1px solid #f5f5f5;display:flex;align-items:center;gap:20px;flex-wrap:wrap}
        .div-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;color:#ccc;flex-shrink:0}
        .div-names{display:flex;gap:16px;flex-wrap:wrap}
        .div-name{font-size:12px;font-weight:600;color:#ccc}

        /* SECTION */
        .lp-section{max-width:1100px;margin:0 auto;padding:72px clamp(16px,4vw,48px)}
        .eyebrow{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#6366f1;margin-bottom:12px}
        .sec-h{font-family:'Instrument Serif',serif;font-size:clamp(26px,3.5vw,44px);line-height:1.08;letter-spacing:-1.2px;margin-bottom:10px}
        .sec-sub{font-size:15px;color:#777;line-height:1.65;max-width:400px}

        /* STEPS */
        .steps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin-top:44px}
        .step{padding:22px;border-radius:16px;border:1px solid transparent;transition:all .2s;cursor:default}
        .step:hover{border-color:rgba(0,0,0,.06);box-shadow:0 6px 20px rgba(0,0,0,.06);transform:translateY(-3px)}
        .step-n{font-family:'Instrument Serif',serif;font-style:italic;font-size:38px;line-height:1;margin-bottom:14px;opacity:.2}
        .step-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
        .step-title{font-size:14px;font-weight:800;letter-spacing:-.3px;margin-bottom:6px}
        .step-body{font-size:12px;line-height:1.6;opacity:.65}

        /* FEATURES */
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#f0f0f0;border:1px solid #f0f0f0;border-radius:18px;overflow:hidden;margin-top:44px}
        .feat{background:#fff;padding:28px;transition:background .18s}
        .feat:hover{background:#fafaff}
        .feat-icon{width:36px;height:36px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
        .feat-title{font-size:14px;font-weight:800;letter-spacing:-.3px;margin-bottom:6px}
        .feat-body{font-size:12px;color:#777;line-height:1.65}

        /* CTA */
        .cta-wrap{padding:0 clamp(16px,4vw,48px) 72px;max-width:1100px;margin:0 auto}
        .cta-box{background:#0a0a0a;border-radius:22px;padding:clamp(44px,6vw,72px) clamp(24px,5vw,56px);text-align:center;position:relative;overflow:hidden}
        .cta-box::before{content:'';position:absolute;top:-80px;right:-60px;width:280px;height:280px;background:radial-gradient(circle,rgba(99,102,241,.2) 0%,transparent 70%);border-radius:50%;pointer-events:none}
        .cta-h{font-family:'Instrument Serif',serif;font-size:clamp(28px,4vw,52px);color:#fff;line-height:1.05;letter-spacing:-1.5px;margin-bottom:12px;position:relative;z-index:1}
        .cta-h em{font-style:italic;color:#a5b4fc}
        .cta-sub{font-size:15px;color:rgba(255,255,255,.4);margin-bottom:32px;position:relative;z-index:1}
        .btn-cta{display:inline-flex;align-items:center;gap:9px;background:#fff;color:#0a0a0a;border:none;padding:13px 28px;font-size:15px;font-weight:800;font-family:'Inter';border-radius:100px;cursor:pointer;transition:all .2s;position:relative;z-index:1}
        .btn-cta:hover{background:rgba(255,255,255,.92);transform:translateY(-2px);box-shadow:0 12px 32px rgba(0,0,0,.3)}
        .btn-cta:disabled{opacity:.65;cursor:wait}

        /* FAQ */
        .faq-wrap{max-width:680px;margin:0 auto;padding:0 clamp(16px,4vw,48px) 72px}
        .faq-item{border-bottom:1px solid #f0f0f0}
        .faq-q{display:flex;justify-content:space-between;align-items:center;padding:18px 0;cursor:pointer;font-size:15px;font-weight:700;letter-spacing:-.2px;transition:color .15s;gap:12px}
        .faq-q:hover{color:#6366f1}
        .faq-plus{font-size:20px;color:#ccc;transition:transform .2s;flex-shrink:0;font-style:normal}
        .faq-a{padding:0 0 16px;font-size:13px;color:#666;line-height:1.75}

        /* FOOTER */
        .lp-footer{padding:24px clamp(16px,4vw,48px);border-top:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
        .footer-logo{font-family:'Instrument Serif',serif;font-style:italic;font-size:17px;color:#888}
        .footer-copy{font-size:12px;color:#ccc}

        /* RESPONSIVE */
        @media(max-width:900px){
          .hero-inner{grid-template-columns:1fr;gap:36px}
          .hero-right{display:none}
          .steps{grid-template-columns:1fr 1fr}
          .feat-grid{grid-template-columns:1fr}
        }
        @media(max-width:520px){
          .steps{grid-template-columns:1fr}
          .nav-btns .btn-nav-ghost{display:none}
          .hero-sub{font-size:15px}
        }
      `}</style>

      <div className="lp">
        {/* NAV */}
        <nav className="lp-nav">
          <div className="lp-logo"><span className="logo-dot"/>DataHub</div>
          <div className="nav-btns">
            <button className="btn-nav-ghost" onClick={signIn}>Sign in</button>
            <button className="btn-nav-dark"  onClick={signIn} disabled={signing}>
              {signing ? 'Redirecting…' : 'Get started →'}
            </button>
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero">
          <div className="blob blob1"/><div className="blob blob2"/>
          <div className="hero-inner">
            <div>
              <div className="hero-badge"><span className="badge-dot"/>Automated quality scoring</div>
              <h1 className="hero-h1">
                Contribute data.<br />
                <em>Build better AI.</em>
              </h1>
              <p className="hero-sub">
                Write language samples — instruction pairs, conversations, descriptions — and get your quality scored instantly by an automated pipeline. Track your progress, improve with feedback, and see your impact on real AI models.
              </p>
              <div className="hero-actions">
                <button className="btn-hero" onClick={signIn} disabled={signing}>
                  <G/>{signing ? 'Connecting…' : 'Start with Google'}
                </button>
                <button className="btn-scroll" onClick={() => document.getElementById('how').scrollIntoView({ behavior: 'smooth' })}>
                  See how it works ↓
                </button>
              </div>
            </div>

            {/* Mockup */}
            <div className="hero-right">
              <div className="mock-card">
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: '#bbb', marginBottom: 10 }}>Quality Check Complete</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Submission Accepted</div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>English Instruction Pairs</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#f59e0b', background: '#fffbeb', border: '1px solid #fde68a', padding: '3px 9px', borderRadius: 100 }}>+50 XP</span>
                </div>
                <div className="score-row">
                  {[['8','Clarity'],['9','Relevance'],['8','Quality']].map(([n,l]) => (
                    <div key={l} className="score-item">
                      <div style={{ fontSize: 20, fontWeight: 900, color: '#6366f1', letterSpacing: '-.5px' }}>{n}</div>
                      <div style={{ fontSize: 9, color: '#aaa', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.4px', marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mock-card">
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.7px', color: '#bbb', marginBottom: 8 }}>Feedback</div>
                <p style={{ fontSize: 13, color: '#444', lineHeight: 1.65, margin: 0 }}>Excellent structure — the analogy makes the concept immediately accessible and the response directly answers the instruction.</p>
              </div>

              <div className="mock-card">
                <div style={{ display: 'flex', gap: 14 }}>
                  {[['14','Submissions'],['892','XP Total'],['8.4','Avg Score']].map(([v,l]) => (
                    <div key={l} style={{ flex: 1, textAlign: 'center', padding: '6px 0' }}>
                      <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-.5px', color: '#0a0a0a' }}>{v}</div>
                      <div style={{ fontSize: 10, color: '#aaa', fontWeight: 500, marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* DIVIDER */}
        <div className="lp-divider">
          <span className="div-label">Data used by</span>
          <div className="div-names">
            {['OpenAI','Anthropic','Google DeepMind','Meta AI','Cohere','Mistral','Hugging Face'].map(n => <span key={n} className="div-name">{n}</span>)}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <section className="lp-section" id="how">
          <div className="eyebrow">How it works</div>
          <h2 className="sec-h">Simple. Clear. Impactful.</h2>
          <p className="sec-sub">Contribute language data that directly improves AI models used by millions of people.</p>
          <div className="steps">
            {[
              { n:'01', color:'#6366f1', bg:'#eef2ff', title:'Sign in', body:'One click with Google. Your account and history are ready immediately.', svgPath:<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></> },
              { n:'02', color:'#16a34a', bg:'#f0fdf4', title:'Pick a project', body:'Browse open campaigns — instruction pairs, conversations, image captions. Each has clear guidelines.', svgPath:<><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></> },
              { n:'03', color:'#ea580c', bg:'#fff7ed', title:'Write your sample', body:'Write your data sample in the editor. Use the auto-fill for an instant example to guide you.', svgPath:<><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></> },
              { n:'04', color:'#7c3aed', bg:'#faf5ff', title:'Get scored instantly', body:'An automated quality pipeline checks your work. Pass and gain XP. Fail and get specific feedback to improve.', svgPath:<><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></> },
            ].map(s => (
              <div key={s.n} className="step" style={{ background: s.bg }}>
                <div className="step-n" style={{ color: s.color }}>{s.n}</div>
                <div className="step-icon" style={{ background: '#fff' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={s.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{s.svgPath}</svg>
                </div>
                <div className="step-title" style={{ color: s.color }}>{s.title}</div>
                <div className="step-body" style={{ color: s.color }}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section className="lp-section" style={{ paddingTop: 0 }}>
          <div className="eyebrow">Platform features</div>
          <h2 className="sec-h">Built for quality.</h2>
          <div className="feat-grid">
            {[
              { color:'#6366f1', bg:'#eef2ff', title:'Automated quality scoring',  body:'Every submission is scored on clarity, relevance, and quality the moment you submit. No waiting, no manual review delays.' },
              { color:'#16a34a', bg:'#f0fdf4', title:'Specific AI feedback',       body:"Don't just see a number — get a sentence explaining exactly what's good and what to improve." },
              { color:'#ea580c', bg:'#fff7ed', title:'Unlimited retries',           body:'Failed a check? Read the feedback, improve your writing, and resubmit as many times as needed.' },
              { color:'#0ea5e9', bg:'#f0f9ff', title:'XP progress system',         body:'Earn XP for every accepted submission. Higher quality scores earn more. Track your rank on the leaderboard.' },
              { color:'#7c3aed', bg:'#faf5ff', title:'Full submission history',    body:'Every submission, score, and piece of feedback is saved. Review your past work and see how your quality has improved.' },
              { color:'#db2777', bg:'#fdf2f8', title:'Multi-language support',     body:'Contribute in English, Hindi, and many other languages. Native speakers in every language are equally valued.' },
            ].map(f => (
              <div key={f.title} className="feat">
                <div className="feat-icon" style={{ background: f.bg }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={f.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <div className="feat-title">{f.title}</div>
                <div className="feat-body">{f.body}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="cta-wrap">
          <div className="cta-box">
            <h2 className="cta-h">Your words.<br/><em>Real impact.</em></h2>
            <p className="cta-sub">Sign in and make your first contribution in under 2 minutes.</p>
            <button className="btn-cta" onClick={signIn} disabled={signing}>
              <G/>{signing ? 'Connecting…' : 'Get started — it\'s free'}
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="faq-wrap">
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <div className="eyebrow" style={{ display:'flex', justifyContent:'center' }}>FAQ</div>
            <h2 className="sec-h" style={{ textAlign:'center' }}>Common questions</h2>
          </div>
          {[
            { q:'What kind of data do I submit?', a:'Instruction-response pairs, conversations, product descriptions, or image captions — depending on the project. Every project has a clear brief with examples so you know exactly what to write.' },
            { q:'How does automated scoring work?', a:'An automated pipeline scores every submission on three dimensions: clarity (how well-written it is), relevance (does it match the project), and quality (is it accurate and useful). Average ≥ 7 out of 10 = accepted.' },
            { q:'What is the XP system?', a:'XP (experience points) track your contribution quality over time. Pass a quality check = +50 XP base. Higher scores earn more XP. Your XP total determines your leaderboard rank.' },
            { q:'What happens if my submission fails?', a:"You get specific feedback explaining exactly what to improve — not just a score. Read it, revise your submission, and resubmit. There's no limit on retries." },
          ].map((item, i) => (
            <div key={i} className="faq-item">
              <div className="faq-q" onClick={() => setFaq(faq === i ? null : i)}>
                <span>{item.q}</span>
                <em className="faq-plus" style={{ transform: faq === i ? 'rotate(45deg)' : 'none' }}>+</em>
              </div>
              {faq === i && <div className="faq-a">{item.a}</div>}
            </div>
          ))}
        </div>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="footer-logo">DataHub</div>
          <div className="footer-copy">© 2025 DataHub. All rights reserved.</div>
        </footer>
      </div>
    </>
  )
}
