// One shared "data file" for the family menu.
// GET  /api/data       -> { rev, data }   (data is null until first write)
// PUT  /api/data        { data } -> { ok, rev }
//
// The whole menu is stored as a single JSON object in a PUBLIC Vercel Blob
// store (menu-data.json). Writes go only through this function; the store
// URL is random and unguessable. Enable it in the Vercel dashboard:
// Storage -> Blob (Public) -> connect to this project, then redeploy.

import { list, put } from '@vercel/blob'

const BLOB_PATH = 'menu-data.json'

// Vercel names the Blob token BLOB_READ_WRITE_TOKEN by default, but a
// non-default store prefix produces e.g. MENU_BLOB_READ_WRITE_TOKEN.
// Pick the first env var that holds a real token, ignoring empty/stale ones.
function resolveToken() {
  const env = process.env
  const real = (v) => typeof v === 'string' && v.startsWith('vercel_blob_rw_')
  if (real(env.BLOB_READ_WRITE_TOKEN)) return env.BLOB_READ_WRITE_TOKEN
  const rw = Object.keys(env).filter((k) => /READ_WRITE_TOKEN$/i.test(k))
  const valid = rw.filter((k) => real(env[k]))
  const best = valid.find((k) => /BLOB/i.test(k)) || valid[0]
  if (best) return env[best]
  const nonEmpty = rw.find((k) => env[k])
  return nonEmpty ? env[nonEmpty] : ''
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  const token = resolveToken()
  if (!token) {
    return res.status(501).json({ error: 'blob-not-configured' })
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: BLOB_PATH, limit: 100, token })
      const hit = blobs.find((b) => b.pathname === BLOB_PATH)
      if (!hit) return res.status(200).json({ rev: 0, data: null })
      const r = await fetch(hit.downloadUrl || hit.url, { cache: 'no-store' })
      if (!r.ok) return res.status(200).json({ rev: 0, data: null })
      const doc = await r.json()
      return res.status(200).json({ rev: doc.rev || 0, data: doc.data ?? null })
    }

    if (req.method === 'PUT' || req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {}
      const data = body.data ?? body
      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return res.status(400).json({ error: 'bad-body' })
      }
      const rev = Date.now()
      await put(BLOB_PATH, JSON.stringify({ rev, data }), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
      })
      return res.status(200).json({ ok: true, rev })
    }

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'method-not-allowed' })
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) })
  }
}
