import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase handles the OAuth callback automatically
    // We just need to check the session and redirect
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        navigate('/dashboard', { replace: true })
      } else {
        // Wait a moment for Supabase to process the callback
        setTimeout(async () => {
          const { data: { session: s } } = await supabase.auth.getSession()
          navigate(s ? '/dashboard' : '/', { replace: true })
        }, 1500)
      }
    }
    check()
  }, [navigate])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      minHeight: '100vh', background: '#fafaf8', flexDirection: 'column', gap: 16
    }}>
      <div style={{
        width: 36, height: 36,
        border: '2.5px solid #e0e0e0', borderTopColor: '#0a0a0a',
        borderRadius: '50%', animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ fontSize: 14, color: '#888', fontFamily: 'Inter' }}>Signing you in…</div>
    </div>
  )
}
