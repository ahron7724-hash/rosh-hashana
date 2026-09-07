// One shared "data file" for the family menu.
// GET  /api/data       -> { rev, data }   (data is null until first write)
// PUT  /api/data        { data } -> { ok, rev }
//
// The whole menu is stored as a single JSON object in Vercel Blob
// (menu-data.json). Enable it in the Vercel dashboard: Storage -> Create ->
// Blob -> connect to this project. That adds BLOB_READ_WRITE_TOKEN and the
// route starts working after the next deploy. Until then the app runs in
// local mode (localStorage) on its own.

import { list, put } from '@vercel/blob'

const BLOB_PATH = 'menu-data.json'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(501).json({ error: 'blob-not-configured' })
  }

  try {
    if (req.method === 'GET') {
      const { blobs } = await list({ prefix: BLOB_PATH, limit: 100 })
      const hit = blobs.find((b) => b.pathname === BLOB_PATH)
      if (!hit) return res.status(200).json({ rev: 0, data: null })
      const r = await fetch(hit.url, { cache: 'no-store' })
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
      })
      return res.status(200).json({ ok: true, rev })
    }

    res.setHeader('Allow', 'GET, PUT')
    return res.status(405).json({ error: 'method-not-allowed' })
  } catch (e) {
    return res.status(500).json({ error: String((e && e.message) || e) })
  }
}
