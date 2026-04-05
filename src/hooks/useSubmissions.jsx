import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from './useAuth'
import { getUserSubmissions } from '../lib/supabase'

const Ctx = createContext(null)

export function SubmissionsProvider({ children }) {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [lastRefresh, setLastRefresh] = useState(null)

  // Keep latest user id and load fn in refs so closures never go stale
  const userIdRef = useRef(user?.id)
  const loadRef   = useRef(null)

  useEffect(() => { userIdRef.current = user?.id }, [user?.id])

  const load = useCallback(async (silent = false) => {
    const uid = userIdRef.current
    if (!uid) return
    if (!silent) setLoading(true)
    try {
      const data = await getUserSubmissions(uid)
      setSubmissions(Array.isArray(data) ? data : [])
      setLastRefresh(Date.now())
    } catch (e) {
      console.warn('[submissions]', e.message)
    } finally {
      setLoading(false)
    }
  }, []) // no deps — uses ref for uid

  // Store load in ref
  useEffect(() => { loadRef.current = load }, [load])

  // Initial load + reset when user changes
  useEffect(() => {
    if (user?.id) {
      load()
    } else {
      setSubmissions([])
      setLoading(false)
    }
  }, [user?.id]) // eslint-disable-line

  // Poll every 30s
  useEffect(() => {
    if (!user?.id) return
    const t = setInterval(() => loadRef.current?.(true), 30_000)
    return () => clearInterval(t)
  }, [user?.id])

  // Refresh on window focus
  useEffect(() => {
    const fn = () => { if (userIdRef.current) loadRef.current?.(true) }
    window.addEventListener('focus', fn)
    return () => window.removeEventListener('focus', fn)
  }, [])

  // Optimistic add — immediately visible, background sync
  const addSubmission = useCallback((sub) => {
    setSubmissions(prev => {
      const i = prev.findIndex(s => s.id === sub.id)
      if (i >= 0) { const c = [...prev]; c[i] = { ...prev[i], ...sub }; return c }
      return [sub, ...prev]
    })
    // Sync with DB after 3s
    setTimeout(() => loadRef.current?.(true), 3000)
  }, [])

  return (
    <Ctx.Provider value={{ submissions, loading, refresh: load, addSubmission, lastRefresh }}>
      {children}
    </Ctx.Provider>
  )
}

export function useSubmissions() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSubmissions must be inside SubmissionsProvider')
  return ctx
}
