/**
 * DataHub Quality Engine
 * Internal — not exposed to UI. The UI never sees model names.
 */

const K = {
  a: import.meta.env.VITE_KEY_A,
  b: import.meta.env.VITE_KEY_B,
  c: import.meta.env.VITE_KEY_C,
  d: import.meta.env.VITE_KEY_D,
  e: import.meta.env.VITE_KEY_E,
};

const PROMPT = (content, project) => `You are a strict quality evaluator for an AI training data platform.

Project: "${project.title}"
Goal: "${project.description}"
Type: ${project.data_type}

Submission:
"""
${content.slice(0, 1200)}
"""

Reply ONLY with valid JSON — no markdown, no explanation, nothing else:
{"clarity":8,"relevance":7,"quality":8,"verdict":"pass","feedback":"One specific sentence about what is good and what to improve."}

Rules: clarity/relevance/quality are integers 1–10. verdict is "pass" if average >= 7 else "fail".`

function parse(raw) {
  const s = raw.replace(/```json|```/gi, '').trim()
  const i = s.indexOf('{'), j = s.lastIndexOf('}')
  if (i < 0 || j < 0) throw new Error('no json')
  const o = JSON.parse(s.slice(i, j + 1))
  if (typeof o.clarity !== 'number') throw new Error('bad shape')
  o.clarity   = Math.min(10, Math.max(1, Math.round(o.clarity)))
  o.relevance = Math.min(10, Math.max(1, Math.round(o.relevance)))
  o.quality   = Math.min(10, Math.max(1, Math.round(o.quality)))
  const avg = (o.clarity + o.relevance + o.quality) / 3
  o.verdict = avg >= 7 ? 'pass' : 'fail'
  return o
}

async function tryA(prompt) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${K.a}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.1, maxOutputTokens: 300 } })
  })
  if (!r.ok) throw new Error(r.status)
  const d = await r.json()
  return parse(d?.candidates?.[0]?.content?.parts?.[0]?.text || '')
}

async function tryB(prompt) {
  const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${K.b}` },
    body: JSON.stringify({ model: 'llama3-8b-8192', messages: [{ role: 'system', content: 'Reply only with valid JSON.' }, { role: 'user', content: prompt }], temperature: 0.1, max_tokens: 300 })
  })
  if (!r.ok) throw new Error(r.status)
  return parse((await r.json())?.choices?.[0]?.message?.content || '')
}

async function tryC(prompt) {
  const r = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${K.d}` },
    body: JSON.stringify({ model: 'mistral-small-latest', messages: [{ role: 'system', content: 'Reply only with valid JSON.' }, { role: 'user', content: prompt }], temperature: 0.1, max_tokens: 300 })
  })
  if (!r.ok) throw new Error(r.status)
  return parse((await r.json())?.choices?.[0]?.message?.content || '')
}

async function tryD(prompt) {
  const r = await fetch('https://api.cohere.com/v1/generate', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${K.c}` },
    body: JSON.stringify({ model: 'command-light', prompt: prompt + '\n\nJSON only:', max_tokens: 300, temperature: 0.1 })
  })
  if (!r.ok) throw new Error(r.status)
  return parse((await r.json())?.generations?.[0]?.text || '')
}

async function tryE(prompt) {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${K.e}`, 'HTTP-Referer': location.origin, 'X-Title': 'DataHub' },
    body: JSON.stringify({ model: 'meta-llama/llama-3.2-3b-instruct:free', messages: [{ role: 'system', content: 'Reply only with valid JSON.' }, { role: 'user', content: prompt }], temperature: 0.1, max_tokens: 300 })
  })
  if (!r.ok) throw new Error(r.status)
  return parse((await r.json())?.choices?.[0]?.message?.content || '')
}

// User-facing progress messages — NO model names exposed
const STEPS = [
  { fn: tryA, msg: 'Analysing clarity and structure…' },
  { fn: tryB, msg: 'Checking relevance to project…' },
  { fn: tryC, msg: 'Evaluating content quality…' },
  { fn: tryD, msg: 'Running secondary review…' },
  { fn: tryE, msg: 'Finalising quality score…' },
]

/**
 * scoreSubmission(content, project, onProgress)
 * onProgress(message, stepIndex, totalSteps) — called at each attempt
 * Returns: { clarity, relevance, quality, verdict, feedback }
 */
export async function scoreSubmission(content, project, onProgress) {
  const prompt = PROMPT(content, project)
  for (let i = 0; i < STEPS.length; i++) {
    const { fn, msg } = STEPS[i]
    onProgress?.(msg, i, STEPS.length)
    try {
      const result = await fn(prompt)
      // success — return clean result, no internal details
      return { clarity: result.clarity, relevance: result.relevance, quality: result.quality, verdict: result.verdict, feedback: result.feedback }
    } catch {
      // try next engine silently
    }
  }
  throw new Error('Quality check unavailable — please try again.')
}
