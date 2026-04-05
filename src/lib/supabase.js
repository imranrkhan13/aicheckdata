import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
})

/* ─── AUTH ──────────────────────────────────────────────── */

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` }
  })
  if (error) throw error
  return data
}

export async function signOut() {
  await supabase.auth.signOut()
}

/* ─── PROFILES ──────────────────────────────────────────── */

export async function upsertProfile(user) {
  try {
    await supabase.from('profiles').upsert({
      id:         user.id,
      email:      user.email,
      name:       user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' })
  } catch {}
}

export async function getProfile(userId) {
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single()
    return data || null
  } catch { return null }
}

/* ─── DEMO PROJECTS (fallback when no DB table exists) ─── */

export const DEMO_PROJECTS = [
  { id: 'demo-1', title: 'English Instruction Pairs',  data_type: 'instruction',  language: 'English', status: 'active', description: 'Submit clear instruction + response pairs. The response must directly and accurately answer the instruction.' },
  { id: 'demo-2', title: 'Conversational Dialogue',    data_type: 'conversation', language: 'Any',     status: 'active', description: 'Submit natural conversational exchanges on everyday topics. Each turn should feel natural and flow logically.' },
  { id: 'demo-3', title: 'Product Descriptions',       data_type: 'text',         language: 'Any',     status: 'active', description: 'Write detailed product descriptions including features, benefits, and use cases.' },
  { id: 'demo-4', title: 'Image Caption Dataset',      data_type: 'description',  language: 'English', status: 'active', description: 'Describe an image in detail — objects, colors, spatial relationships, actions, mood. 2-3 vivid sentences.' },
]

export async function getProjects() {
  try {
    const { data, error } = await supabase.from('projects').select('*').eq('status', 'active').order('created_at', { ascending: false })
    if (!error && data?.length) return data
  } catch {}
  return DEMO_PROJECTS
}

export async function getAllProjects() {
  try {
    const { data, error } = await supabase.from('projects').select('*').order('created_at', { ascending: false })
    if (!error && data?.length) return data
  } catch {}
  return DEMO_PROJECTS
}

/* ─── LOCAL STORAGE LAYER ───────────────────────────────── */
// Always write here first so the UI is never blocked waiting for the DB.

const LS_KEY = 'dh_submissions_v3'

function lsRead() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]') } catch { return [] }
}
function lsWrite(rows) {
  localStorage.setItem(LS_KEY, JSON.stringify(rows.slice(0, 500)))
}
function lsUpsert(row) {
  const all  = lsRead()
  const idx  = all.findIndex(r => r.id === row.id)
  if (idx >= 0) all[idx] = { ...all[idx], ...row }
  else all.unshift(row)
  lsWrite(all)
}
function lsForUser(uid) {
  return lsRead().filter(r => r.user_id === uid)
}

/* ─── SUBMISSIONS ───────────────────────────────────────── */

/**
 * createSubmission(payload)
 * payload must include: user_id, project_title, content, data_type,
 *   status, score_clarity, score_relevance, score_quality, feedback
 */
export async function createSubmission(payload) {
  // Generate a stable ID we control (text PK in DB)
  const id = 'sub_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)

  const row = {
    id,
    created_at:     new Date().toISOString(),
    user_id:        payload.user_id,
    project_title:  payload.project_title  || 'Untitled Project',
    content:        payload.content        || '',
    data_type:      payload.data_type      || 'text',
    status:         payload.status         || 'pending',
    score_clarity:  Number(payload.score_clarity)  || null,
    score_relevance:Number(payload.score_relevance) || null,
    score_quality:  Number(payload.score_quality)   || null,
    feedback:       payload.feedback       || null,
  }

  // 1. Save locally immediately — instant, never fails
  lsUpsert(row)

  // 2. Persist to Supabase — best-effort, async
  try {
    const { error } = await supabase.from('submissions').insert(row)
    if (error) {
      console.warn('[DataHub] DB insert failed:', error.message, error.code)
    } else {
      console.log('[DataHub] Submission saved to DB:', id)
    }
  } catch (e) {
    console.warn('[DataHub] DB unreachable, kept in localStorage:', e.message)
  }

  return row
}

/**
 * getUserSubmissions(userId)
 * Returns merged DB + localStorage, deduplicated, newest first.
 */
export async function getUserSubmissions(userId) {
  if (!userId) return []

  const local = lsForUser(userId)

  try {
    // Only select columns that actually exist in our schema
    const { data, error } = await supabase
      .from('submissions')
      .select('id, created_at, user_id, project_title, content, data_type, status, score_clarity, score_relevance, score_quality, feedback')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (!error && data?.length) {
      // Sync remote into localStorage so future reads are fast
      data.forEach(r => lsUpsert(r))

      // Merge: remote wins for shared IDs
      const remoteIds = new Set(data.map(r => r.id))
      const localOnly = local.filter(r => !remoteIds.has(r.id))
      return [...data, ...localOnly].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    }
  } catch (e) {
    console.warn('[DataHub] getUserSubmissions remote failed:', e.message)
  }

  return local.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

/**
 * getLeaderboard()
 * Aggregates passed submissions by user.
 */
export async function getLeaderboard() {
  const allLocal = lsRead().filter(r => r.status === 'passed')

  let remote = []
  try {
    // Join with profiles using a separate query to avoid FK errors
    const { data } = await supabase
      .from('submissions')
      .select('user_id, score_clarity, score_relevance, score_quality, status')
      .eq('status', 'passed')
    remote = data || []
  } catch {}

  // Also pull profile names for remote users
  const profileMap = {}
  if (remote.length) {
    const uids = [...new Set(remote.map(r => r.user_id))]
    try {
      const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', uids)
      ;(profiles || []).forEach(p => { profileMap[p.id] = p })
    } catch {}
  }

  const remoteIds = new Set(remote.map(r => r.id))
  const all = [...remote, ...allLocal.filter(r => !remoteIds.has(r.id))]
  if (!all.length) return []

  const map = {}
  all.forEach(s => {
    const uid = s.user_id || 'local'
    if (!map[uid]) map[uid] = {
      userId: uid,
      name:   profileMap[uid]?.name || 'Anonymous',
      avatar: profileMap[uid]?.avatar_url || null,
      scores: [], passed: 0,
    }
    const avg = ((+s.score_clarity || 0) + (+s.score_relevance || 0) + (+s.score_quality || 0)) / 3
    if (avg > 0) { map[uid].scores.push(avg); map[uid].passed++ }
  })

  return Object.values(map)
    .filter(c => c.scores.length > 0)
    .map(c => ({ ...c, avgScore: c.scores.reduce((a, b) => a + b, 0) / c.scores.length }))
    .sort((a, b) => b.avgScore - a.avgScore)
}
