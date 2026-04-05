import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, upsertProfile, getProfile } from '../lib/supabase'

const AuthContext = createContext(null)

const SESSION_KEY = 'datahub_last_active'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function isSessionExpired() {
  const lastActive = localStorage.getItem(SESSION_KEY)
  // No key = fresh login, NOT expired
  if (!lastActive) return false
  const elapsed = Date.now() - parseInt(lastActive, 10)
  return elapsed >= SEVEN_DAYS_MS
}

function touchSession() {
  localStorage.setItem(SESSION_KEY, Date.now().toString())
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        if (isSessionExpired()) {
          // 7 days of inactivity — force sign out
          await supabase.auth.signOut()
          localStorage.removeItem(SESSION_KEY)
          setUser(null)
          setProfile(null)
        } else {
          touchSession()
          setUser(session.user)
          try {
            const p = await getProfile(session.user.id)
            if (!p) await upsertProfile(session.user)
            setProfile(p || {
              name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url
            })
          } catch (e) {
            // Profile table may not exist yet — still let user in
            setProfile({
              name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url
            })
          }
        }
      }
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        touchSession()
        setUser(session.user)
        try {
          await upsertProfile(session.user)
          const p = await getProfile(session.user.id)
          setProfile(p || {
            name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url
          })
        } catch (e) {
          setProfile({
            name: session.user.user_metadata?.full_name,
            avatar_url: session.user.user_metadata?.avatar_url
          })
        }
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem(SESSION_KEY)
        setUser(null)
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Touch session on user activity
  useEffect(() => {
    if (!user) return
    const touch = () => touchSession()
    window.addEventListener('click', touch)
    window.addEventListener('keydown', touch)
    return () => {
      window.removeEventListener('click', touch)
      window.removeEventListener('keydown', touch)
    }
  }, [user])

  return (
    <AuthContext.Provider value={{ user, profile, loading, setProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
