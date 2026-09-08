import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'

/* ---------------- constants ---------------- */
const LS_DATA = 'rh-menu-data-v1'
const LS_ME = 'rh-menu-me-v1'
const EMOJIS = ['🍎', '🍯', '🥗', '🍲', '🍗', '🍰', '🍷', '🍞', '🫓', '🥘', '🐟', '🍇', '🥕', '🧆', '🍮', '🥂', '🌰', '🫒']
const AVATAR_COLORS = ['#a83440', '#a9772a', '#5f7344', '#7c4e78', '#4f6191', '#a25436', '#2f7d70', '#8f3d5e']

const initials = (n) => {
  const s = (n || '').trim()
  return s ? Array.from(s)[0] : '?'
}
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0)
const bySort = (a, b) => (a.order ?? 0) - (b.order ?? 0)
const uid = () => 'x' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3)

const relTime = (ts) => {
  if (!ts) return ''
  const m = Math.round((Date.now() - ts) / 60000)
  if (m < 1) return 'עכשיו'
  if (m < 60) return `לפני ${m} דק׳`
  const h = Math.round(m / 60)
  if (h < 24) return h === 1 ? 'לפני שעה' : h === 2 ? 'לפני שעתיים' : `לפני ${h} שעות`
  const d = Math.round(h / 24)
  if (d === 1) return 'אתמול'
  if (d === 2) return 'לפני יומיים'
  if (d < 7) return `לפני ${d} ימים`
  try {
    return new Date(ts).toLocaleDateString('he-IL', { day: 'numeric', month: 'long' })
  } catch (e) {
    return ''
  }
}

/* Starter menu — used when nothing is saved yet, and by "טעינת התפריט מחדש". */
const STARTER = {
  people: [
    { id: 'p1', name: 'אמא', color: '#a83440', order: 1 },
    { id: 'p2', name: 'אבא', color: '#a9772a', order: 2 },
    { id: 'p3', name: 'סבתא', color: '#5f7344', order: 3 },
  ],
  categories: [
    { id: 'c1', name: 'סימנים', emoji: '🍎', order: 1 },
    { id: 'c2', name: 'עוגות וקינוחים', emoji: '🍰', order: 2 },
    { id: 'c3', name: 'סלטים', emoji: '🥗', order: 3 },
    { id: 'c4', name: 'סעודת שבת וחג', emoji: '🐟', order: 4 },
    { id: 'c5', name: 'סעודה שנייה', emoji: '🍲', order: 5 },
    { id: 'c6', name: 'סעודה שלישית', emoji: '🥗', order: 6 },
    { id: 'c7', name: 'סעודת חג', emoji: '🍗', order: 7 },
    { id: 'c8', name: 'סעודת יום', emoji: '🥘', order: 8 },
    { id: 'c9', name: 'תוספות', emoji: '🍚', order: 9 },
  ],
  dishes: [
    { id: 'd1', categoryId: 'c1', name: 'קציצות סילקא', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd2', categoryId: 'c1', name: 'קציצות קרא (דלעת)', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd3', categoryId: 'c1', name: 'רוביה', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd4', categoryId: 'c1', name: 'ראש של דג', note: '', takenBy: null, done: false, order: 4 },
    { id: 'd5', categoryId: 'c1', name: 'רימון', note: '', takenBy: null, done: false, order: 5 },
    { id: 'd6', categoryId: 'c2', name: 'עוגיות תמרים', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd7', categoryId: 'c2', name: 'עוגת דבש', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd8', categoryId: 'c2', name: 'אלפחורס', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd9', categoryId: 'c2', name: 'טים טאם', note: '', takenBy: null, done: false, order: 4 },
    { id: 'd10', categoryId: 'c2', name: 'קונוסים / קרם שניט', note: '', takenBy: null, done: false, order: 5 },
    { id: 'd11', categoryId: 'c2', name: 'עוגת שכבות תפוחים / קרמל', note: '', takenBy: null, done: false, order: 6 },
    { id: 'd12', categoryId: 'c2', name: 'שוגי לנוקי', note: '', takenBy: null, done: false, order: 7 },
    { id: 'd13', categoryId: 'c2', name: 'קוקילידות', note: '', takenBy: null, done: false, order: 8 },
    { id: 'd14', categoryId: 'c3', name: 'סלט ביצים', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd15', categoryId: 'c3', name: 'חציל עם פלפלים ובצל', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd16', categoryId: 'c3', name: 'חציל של לאה', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd17', categoryId: 'c3', name: 'חציל קונפי', note: '', takenBy: null, done: false, order: 4 },
    { id: 'd18', categoryId: 'c3', name: 'מטבוחה', note: '', takenBy: null, done: false, order: 5 },
    { id: 'd19', categoryId: 'c3', name: 'חציל מצופה פירורים', note: '', takenBy: null, done: false, order: 6 },
    { id: 'd20', categoryId: 'c3', name: 'טחינה', note: '', takenBy: null, done: false, order: 7 },
    { id: 'd21', categoryId: 'c3', name: 'אבוקדו', note: '', takenBy: null, done: false, order: 8 },
    { id: 'd22', categoryId: 'c3', name: 'גזר', note: '', takenBy: null, done: false, order: 9 },
    { id: 'd23', categoryId: 'c3', name: 'סלט חי', note: '', takenBy: null, done: false, order: 10 },
    { id: 'd24', categoryId: 'c3', name: 'פטריות', note: '', takenBy: null, done: false, order: 11 },
    { id: 'd25', categoryId: 'c3', name: 'סלט כבד', note: '', takenBy: null, done: false, order: 12 },
    { id: 'd26', categoryId: 'c4', name: 'הליבוט', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd27', categoryId: 'c4', name: 'קרפיון', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd28', categoryId: 'c4', name: 'פרוסות בשר – צלי', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd29', categoryId: 'c5', name: 'חמין', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd30', categoryId: 'c5', name: 'ברוסקטות כבד', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd31', categoryId: 'c6', name: 'דגים + סלטים', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd32', categoryId: 'c7', name: 'קבבים עם בצל מקורמל', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd33', categoryId: 'c7', name: 'פרגיות ממולאות / קונכיות עם פרגית', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd34', categoryId: 'c8', name: 'בשר ראש וקוסקוס', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd35', categoryId: 'c8', name: 'כל מה שנשאר', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd36', categoryId: 'c9', name: 'מקלובה', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd37', categoryId: 'c9', name: 'קוסקוס', note: '', takenBy: null, done: false, order: 2 },
  ],
}

/* ---------------- icons ---------------- */
const base = (p) => ({
  width: p.size || 18,
  height: p.size || 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: p.className,
})
const Check = (p) => <svg {...base(p)}><polyline points="20 6 9 17 4 12" /></svg>
const Plus = (p) => <svg {...base(p)}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
const X = (p) => <svg {...base(p)}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
const Pencil = (p) => <svg {...base(p)}><path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
const Trash = (p) => <svg {...base(p)}><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
const ChevronDown = (p) => <svg {...base(p)}><polyline points="6 9 12 15 18 9" /></svg>
const Users = (p) => <svg {...base(p)}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
const UserCheck = (p) => <svg {...base(p)}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>
const Dots = (p) => <svg {...base(p)} fill="currentColor" stroke="none"><circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" /></svg>
const Grip = (p) => (
  <svg {...base(p)} fill="currentColor" stroke="none">
    <circle cx="9" cy="5" r="1.5" /><circle cx="15" cy="5" r="1.5" />
    <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
    <circle cx="9" cy="19" r="1.5" /><circle cx="15" cy="19" r="1.5" />
  </svg>
)
const Download = (p) => <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
const Upload = (p) => <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
const Sparkle = (p) => <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2l1.9 5.6L19.5 9l-4.6 3.3L16 18l-4-3.3L8 18l1.1-5.7L4.5 9l5.6-1.4Z" /></svg>
const Megaphone = (p) => <svg {...base(p)}><path d="m3 11 18-5v12L3 14v-3z" /><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" /></svg>

const Pom = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 6.2c.9-1 1-2.1.6-3.4 1.5.5 2.4 1.6 2.4 3 1.9.9 3.7 2.9 3.7 6.2 0 4.4-3.2 8.4-6.7 8.4S5.3 16.4 5.3 12c0-3.3 1.8-5.3 3.7-6.2 0-1.4.9-2.5 2.4-3-.4 1.3-.3 2.4.6 3.4z" />
    <circle cx="12" cy="13.4" r="1.15" fill="var(--surface)" />
    <circle cx="9.4" cy="11.2" r="1.05" fill="var(--surface)" />
    <circle cx="14.6" cy="11.2" r="1.05" fill="var(--surface)" />
    <circle cx="9.7" cy="15.6" r="1" fill="var(--surface)" />
    <circle cx="14.3" cy="15.6" r="1" fill="var(--surface)" />
  </svg>
)
/* ---------------- data normalize ---------------- */
function normalize(raw) {
  const d = raw || {}
  const arr = (x) => (Array.isArray(x) ? x : [])
  const ann = d.announcement || {}
  return {
    announcement: {
      text: String(ann.text || ''),
      by: String(ann.by || ''),
      at: Number(ann.at) || 0,
    },
    categories: arr(d.categories).map((c, i) => ({
      id: String(c.id || uid()),
      name: String(c.name || 'נושא'),
      emoji: c.emoji || '🍽️',
      order: c.order ?? i,
    })),
    dishes: arr(d.dishes).map((x, i) => ({
      id: String(x.id || uid()),
      categoryId: String(x.categoryId || ''),
      name: String(x.name || ''),
      note: x.note || '',
      takenBy: x.takenBy || null,
      done: !!x.done,
      order: x.order ?? i,
    })),
    people: arr(d.people).map((p, i) => ({
      id: String(p.id || uid()),
      name: String(p.name || ''),
      color: p.color || AVATAR_COLORS[i % AVATAR_COLORS.length],
      order: p.order ?? i,
    })),
  }
}

/* ---------------- store ----------------
 * Shared menu in a Supabase (Postgres) database when VITE_SUPABASE_URL and
 * VITE_SUPABASE_ANON_KEY are set; otherwise this browser's localStorage.
 * Every row is inserted / updated / deleted on its own, so concurrent edits
 * from different people never clobber each other. Changes are applied locally
 * at once (optimistic) and the page re-reads every few seconds to pick up
 * other people's changes. localStorage is kept as an offline cache.
 */
const SB_URL = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '')
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const HAS_DB = !!(SB_URL && SB_KEY)
const POLL_MS = 3500

const catToRow = (c) => ({ id: c.id, name: c.name, emoji: c.emoji, pos: c.order ?? 0 })
const catFromRow = (r) => ({ id: r.id, name: r.name, emoji: r.emoji || '🍽️', order: r.pos ?? 0 })
const personToRow = (p) => ({ id: p.id, name: p.name, color: p.color, pos: p.order ?? 0 })
const personFromRow = (r) => ({ id: r.id, name: r.name, color: r.color || AVATAR_COLORS[0], order: r.pos ?? 0 })
const dishToRow = (d) => ({
  id: d.id, category_id: d.categoryId, name: d.name, note: d.note ?? '',
  taken_by: d.takenBy ?? null, done: !!d.done, pos: d.order ?? 0,
})
const dishFromRow = (r) => ({
  id: r.id, categoryId: r.category_id, name: r.name, note: r.note || '',
  takenBy: r.taken_by ?? null, done: !!r.done, order: r.pos ?? 0,
})
function patchRow(map, p) {
  const o = {}
  for (const [from, to] of map) if (from in p) o[to] = p[from]
  return o
}
const catPatch = (p) => patchRow([['name', 'name'], ['emoji', 'emoji'], ['order', 'pos']], p)
const personPatch = (p) => patchRow([['name', 'name'], ['color', 'color'], ['order', 'pos']], p)
const dishPatch = (p) =>
  patchRow([['categoryId', 'category_id'], ['name', 'name'], ['note', 'note'], ['takenBy', 'taken_by'], ['done', 'done'], ['order', 'pos']], p)

function sbFetch(path, opts = {}) {
  return fetch(`${SB_URL}/rest/v1/${path}`, {
    ...opts,
    headers: {
      apikey: SB_KEY,
      authorization: `Bearer ${SB_KEY}`,
      'content-type': 'application/json',
      ...(opts.headers || {}),
    },
  })
}
const sbOk = (r) => (r.ok ? r : Promise.reject(new Error(r.status)))

function annFromRows(rows) {
  const row = (Array.isArray(rows) ? rows : []).find((r) => r.key === 'announcement')
  if (!row) return { text: '', by: '', at: 0 }
  try {
    const v = JSON.parse(row.value)
    return { text: String(v.text || ''), by: String(v.by || ''), at: Number(v.at) || 0 }
  } catch (e) {
    return { text: String(row.value || ''), by: '', at: 0 }
  }
}

async function sbSelectAll() {
  const [c, p, d, s] = await Promise.all([
    sbFetch('categories?select=*').then(sbOk).then((r) => r.json()),
    sbFetch('people?select=*').then(sbOk).then((r) => r.json()),
    sbFetch('dishes?select=*').then(sbOk).then((r) => r.json()),
    // settings is optional — a menu made before this table existed still works
    sbFetch('settings?select=*').then(sbOk).then((r) => r.json()).catch(() => []),
  ])
  return {
    announcement: annFromRows(s),
    categories: c.map(catFromRow).sort(bySort),
    people: p.map(personFromRow).sort(bySort),
    dishes: d.map(dishFromRow).sort(bySort),
  }
}

const ACTIVE_MS = 40000 // stop polling after this long with no user activity

function createStore(onMode) {
  const subs = new Set()
  let state = loadLocal()
  let mode = 'local' // 'local' | 'db'
  let pending = 0 // in-flight writes — pause polling while > 0
  let pollTimer = null
  let refetchT = null
  let dead = false
  let lastActive = Date.now()
  let idle = false
  let unwire = null

  function loadLocal() {
    try {
      const j = JSON.parse(localStorage.getItem(LS_DATA))
      if (j && Array.isArray(j.categories)) return normalize(j)
    } catch (e) {}
    return normalize(STARTER)
  }
  function saveLocal() {
    try {
      localStorage.setItem(LS_DATA, JSON.stringify(state))
    } catch (e) {}
  }
  function setState(next) {
    state = next
    saveLocal()
    subs.forEach((f) => f(state))
  }
  function setMode(m) {
    if (m !== mode) {
      mode = m
      if (onMode) onMode(m)
    }
  }
  const local = (fn) => setState(fn(state))

  function write(promise) {
    if (mode !== 'db') return
    pending++
    Promise.resolve(promise)
      .catch((e) => console.warn('[db write]', e))
      .finally(() => {
        pending--
        clearTimeout(refetchT)
        refetchT = setTimeout(refetch, 250)
      })
  }

  async function refetch() {
    if (dead || mode !== 'db' || pending > 0) return
    try {
      const next = await sbSelectAll()
      if (dead || pending > 0) return
      if (JSON.stringify(next) !== JSON.stringify(state)) setState(next)
    } catch (e) {}
  }

  // Only poll while someone is actually looking / interacting. When idle
  // (no activity for ACTIVE_MS, or tab hidden) polling stops entirely; the
  // next interaction resumes it with an immediate refetch.
  function markActive() {
    lastActive = Date.now()
    if (idle) {
      idle = false
      refetch()
    }
  }
  function tick() {
    if (dead || mode !== 'db' || pending > 0) return
    const hidden = typeof document !== 'undefined' && document.hidden
    if (hidden || Date.now() - lastActive > ACTIVE_MS) {
      idle = true
      return
    }
    refetch()
  }
  function wireActivity() {
    if (typeof window === 'undefined') return
    const evs = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'focus']
    const onAct = () => markActive()
    const onVis = () => {
      if (!document.hidden) markActive()
    }
    evs.forEach((e) => window.addEventListener(e, onAct, { passive: true }))
    document.addEventListener('visibilitychange', onVis)
    unwire = () => {
      evs.forEach((e) => window.removeEventListener(e, onAct))
      document.removeEventListener('visibilitychange', onVis)
    }
  }

  async function insertAll(s) {
    await Promise.all([
      s.people.length && sbFetch('people', { method: 'POST', body: JSON.stringify(s.people.map(personToRow)) }).then(sbOk),
      s.categories.length && sbFetch('categories', { method: 'POST', body: JSON.stringify(s.categories.map(catToRow)) }).then(sbOk),
    ])
    if (s.dishes.length) await sbFetch('dishes', { method: 'POST', body: JSON.stringify(s.dishes.map(dishToRow)) }).then(sbOk)
  }
  async function deleteAll() {
    await sbFetch('dishes?id=not.is.null', { method: 'DELETE' }).then(sbOk)
    await Promise.all([
      sbFetch('categories?id=not.is.null', { method: 'DELETE' }).then(sbOk),
      sbFetch('people?id=not.is.null', { method: 'DELETE' }).then(sbOk),
    ])
  }
  function replaceAll(payload) {
    const s = normalize(payload)
    s.announcement = state.announcement // a family message isn't menu data — keep it
    setState(s)
    if (mode !== 'db') return
    write(deleteAll().then(() => insertAll(s)))
  }

  async function init() {
    if (!HAS_DB) {
      setMode('local')
      return
    }
    try {
      let next = await sbSelectAll()
      if (dead) return
      setMode('db')
      if (!next.categories.length && !next.dishes.length && !next.people.length) {
        await insertAll(normalize(STARTER))
        next = await sbSelectAll()
      }
      if (!dead) setState(next)
      wireActivity()
      pollTimer = setInterval(tick, POLL_MS)
    } catch (e) {
      console.warn('[db init]', e)
      setMode('local')
    }
  }
  init()

  return {
    getState: () => state,
    mode: () => mode,
    destroy() {
      dead = true
      clearInterval(pollTimer)
      clearTimeout(refetchT)
      if (unwire) unwire()
    },
    subscribe(f) {
      subs.add(f)
      f(state)
      return () => subs.delete(f)
    },

    addCategory(d) {
      const id = uid()
      const c = { id, name: d.name, emoji: d.emoji, order: d.order ?? Date.now() }
      local((s) => ({ ...s, categories: [...s.categories, c] }))
      write(sbFetch('categories', { method: 'POST', body: JSON.stringify(catToRow(c)) }).then(sbOk))
      return id
    },
    updateCategory(id, p) {
      local((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...p } : c)) }))
      write(sbFetch(`categories?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(catPatch(p)) }).then(sbOk))
    },
    deleteCategory(id) {
      local((s) => ({
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        dishes: s.dishes.filter((x) => x.categoryId !== id),
      }))
      write(
        sbFetch(`dishes?category_id=eq.${id}`, { method: 'DELETE' })
          .then(sbOk)
          .then(() => sbFetch(`categories?id=eq.${id}`, { method: 'DELETE' }).then(sbOk)),
      )
    },
    addDish(d) {
      const id = uid()
      const x = {
        id,
        categoryId: d.categoryId,
        name: d.name,
        note: d.note ?? '',
        takenBy: d.takenBy ?? null,
        done: false,
        order: d.order ?? Date.now(),
      }
      local((s) => ({ ...s, dishes: [...s.dishes, x] }))
      write(sbFetch('dishes', { method: 'POST', body: JSON.stringify(dishToRow(x)) }).then(sbOk))
      return id
    },
    updateDish(id, p) {
      local((s) => ({ ...s, dishes: s.dishes.map((x) => (x.id === id ? { ...x, ...p } : x)) }))
      write(sbFetch(`dishes?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(dishPatch(p)) }).then(sbOk))
    },
    deleteDish(id) {
      local((s) => ({ ...s, dishes: s.dishes.filter((x) => x.id !== id) }))
      write(sbFetch(`dishes?id=eq.${id}`, { method: 'DELETE' }).then(sbOk))
    },
    reorderCategories(orderedIds) {
      const changed = []
      local((s) => ({
        ...s,
        categories: s.categories.map((c) => {
          const i = orderedIds.indexOf(c.id)
          if (i === -1 || (c.order ?? 0) === i + 1) return c
          changed.push([c.id, i + 1])
          return { ...c, order: i + 1 }
        }),
      }))
      changed.forEach(([id, pos]) =>
        write(sbFetch(`categories?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ pos }) }).then(sbOk)),
      )
    },
    reorderDishes(categoryId, orderedIds) {
      const changed = []
      local((s) => ({
        ...s,
        dishes: s.dishes.map((d) => {
          if (d.categoryId !== categoryId) return d
          const i = orderedIds.indexOf(d.id)
          if (i === -1 || (d.order ?? 0) === i + 1) return d
          changed.push([d.id, i + 1])
          return { ...d, order: i + 1 }
        }),
      }))
      changed.forEach(([id, pos]) =>
        write(sbFetch(`dishes?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ pos }) }).then(sbOk)),
      )
    },
    addPerson(d) {
      const id = uid()
      const p = { id, name: d.name, color: d.color, order: d.order ?? Date.now() }
      local((s) => ({ ...s, people: [...s.people, p] }))
      write(sbFetch('people', { method: 'POST', body: JSON.stringify(personToRow(p)) }).then(sbOk))
      return id
    },
    updatePerson(id, p) {
      local((s) => ({ ...s, people: s.people.map((x) => (x.id === id ? { ...x, ...p } : x)) }))
      write(sbFetch(`people?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(personPatch(p)) }).then(sbOk))
    },
    deletePerson(id) {
      local((s) => ({
        ...s,
        people: s.people.filter((x) => x.id !== id),
        dishes: s.dishes.map((x) => (x.takenBy === id ? { ...x, takenBy: null } : x)),
      }))
      write(
        sbFetch(`dishes?taken_by=eq.${id}`, { method: 'PATCH', body: JSON.stringify({ taken_by: null }) })
          .then(sbOk)
          .then(() => sbFetch(`people?id=eq.${id}`, { method: 'DELETE' }).then(sbOk)),
      )
    },
    setAnnouncement(text, by) {
      const ann = { text: String(text || '').trim(), by: String(by || ''), at: Date.now() }
      local((s) => ({ ...s, announcement: ann }))
      write(
        sbFetch('settings?on_conflict=key', {
          method: 'POST',
          headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify({ key: 'announcement', value: JSON.stringify(ann) }),
        }).then(sbOk),
      )
    },
    importAll(payload) {
      replaceAll(payload)
    },
    resetToStarter() {
      replaceAll(STARTER)
    },
    clearAll() {
      setState({ categories: [], dishes: [], people: [], announcement: state.announcement })
      if (mode === 'db') write(deleteAll())
    },
  }
}

function doExport(data) {
  const payload = {
    app: 'rosh-hashanah-menu',
    version: 1,
    exportedAt: new Date().toISOString(),
    categories: data.categories,
    dishes: data.dishes,
    people: data.people,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'תפריט-ראש-השנה.json'
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

/* ---------------- Popover (portal) ---------------- */
function Popover({ anchorRef, onClose, width = 214, children }) {
  const [pos, setPos] = useState(null)
  const boxRef = useRef()
  useEffect(() => {
    function place() {
      const a = anchorRef.current
      if (!a) return
      const r = a.getBoundingClientRect()
      const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8))
      let top = r.bottom + 6
      const menuH = 300
      if (top + menuH > window.innerHeight && r.top - menuH - 6 > 0) top = r.top - menuH - 6
      setPos({ left, top })
    }
    place()
    const onDoc = (e) => {
      if (
        boxRef.current &&
        !boxRef.current.contains(e.target) &&
        !(anchorRef.current && anchorRef.current.contains(e.target))
      )
        onClose()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    const t = setTimeout(() => document.addEventListener('mousedown', onDoc), 0)
    document.addEventListener('keydown', onKey)
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      clearTimeout(t)
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [anchorRef, onClose, width])
  if (!pos) return null
  return createPortal(
    <div className="popover" ref={boxRef} role="menu" style={{ left: pos.left, top: pos.top, width }}>
      {children}
    </div>,
    document.body,
  )
}

/* ---------------- Dialog ---------------- */
function Dialog({ title, onCancel, children }) {
  useEffect(() => {
    const k = (e) => {
      if (e.key === 'Escape') onCancel()
    }
    document.addEventListener('keydown', k)
    return () => document.removeEventListener('keydown', k)
  }, [onCancel])
  return createPortal(
    <div className="backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel() }}>
      <div className="dialog" role="dialog" aria-modal="true">
        <div className="dialog-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onCancel} aria-label="סגירה"><X size={17} /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}

function DishDialog({ data, editing, defaultCategoryId, onCancel, onSave }) {
  const cats = [...data.categories].sort(bySort)
  const people = [...data.people].sort(bySort)
  const [name, setName] = useState(editing?.name || '')
  const [note, setNote] = useState(editing?.note || '')
  const [categoryId, setCategoryId] = useState(editing?.categoryId || defaultCategoryId || (cats[0] && cats[0].id) || '')
  const [takenBy, setTakenBy] = useState(editing?.takenBy || '')
  function submit(e) {
    e.preventDefault()
    if (!name.trim() || !categoryId) return
    onSave({ name: name.trim(), note: note.trim(), categoryId, takenBy: takenBy || null })
  }
  return (
    <Dialog title={editing ? 'עריכת מנה' : 'מנה חדשה'} onCancel={onCancel}>
      <form onSubmit={submit}>
        <label className="field">
          <span>שם המנה</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: סלט רימונים" />
        </label>
        <label className="field">
          <span>נושא</span>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>מי מכין? (אפשר להשאיר ריק)</span>
          <select value={takenBy} onChange={(e) => setTakenBy(e.target.value)}>
            <option value="">— עדיין לא נבחר —</option>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>הערה (לא חובה)</span>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="כמות, סגנון, בלי גלוטן…" />
        </label>
        <div className="dialog-foot">
          <button type="button" className="btn ghost" onClick={onCancel}>ביטול</button>
          <button type="submit" className="btn primary">{editing ? 'שמירה' : 'הוספה'}</button>
        </div>
      </form>
    </Dialog>
  )
}

function CategoryDialog({ editing, onCancel, onSave }) {
  const [name, setName] = useState(editing?.name || '')
  const [emoji, setEmoji] = useState(editing?.emoji || '🍎')
  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), emoji })
  }
  return (
    <Dialog title={editing ? 'עריכת נושא' : 'נושא חדש'} onCancel={onCancel}>
      <form onSubmit={submit}>
        <label className="field">
          <span>שם הנושא</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="למשל: סלטים, עיקריות, קינוחים" />
        </label>
        <div className="field">
          <span>אייקון</span>
          <div className="emoji-grid">
            {EMOJIS.map((x) => (
              <button type="button" key={x} className={x === emoji ? 'on' : ''} onClick={() => setEmoji(x)}>{x}</button>
            ))}
          </div>
        </div>
        <div className="dialog-foot">
          <button type="button" className="btn ghost" onClick={onCancel}>ביטול</button>
          <button type="submit" className="btn primary">{editing ? 'שמירה' : 'הוספה'}</button>
        </div>
      </form>
    </Dialog>
  )
}

function PersonDialog({ editing, usedColors, onCancel, onSave }) {
  const [name, setName] = useState(editing?.name || '')
  const [color, setColor] = useState(editing?.color || AVATAR_COLORS.find((c) => !usedColors.includes(c)) || AVATAR_COLORS[0])
  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), color })
  }
  return (
    <Dialog title={editing ? 'עריכת שם' : 'בן/בת משפחה'} onCancel={onCancel}>
      <form onSubmit={submit}>
        <label className="field">
          <span>שם</span>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="איך קוראים לו/לה?" />
        </label>
        <div className="field">
          <span>צבע</span>
          <div className="swatches">
            {AVATAR_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                className={'swatch' + (c === color ? ' on' : '')}
                style={{ background: c }}
                onClick={() => setColor(c)}
              >
                {c === color && <Check size={13} />}
              </button>
            ))}
          </div>
        </div>
        <div className="dialog-foot">
          <button type="button" className="btn ghost" onClick={onCancel}>ביטול</button>
          <button type="submit" className="btn primary">{editing ? 'שמירה' : 'הוספה'}</button>
        </div>
      </form>
    </Dialog>
  )
}

function IdentityDialog({ people, me, onCancel, onPick, onCreate }) {
  const [newName, setNewName] = useState('')
  return (
    <Dialog title="מי את/ה?" onCancel={onCancel}>
      <p className="dialog-lead">בחירת השם מאפשרת לסמן מנות על שמך בלחיצה אחת. הבחירה נשמרת במכשיר הזה בלבד.</p>
      <div className="identity-list">
        {people.map((p) => (
          <button key={p.id} className={'identity-opt' + (me === p.id ? ' on' : '')} onClick={() => onPick(p.id)}>
            <span className="avatar sm" style={{ background: p.color }}>{initials(p.name)}</span>
            {p.name}
            {me === p.id && <Check size={15} />}
          </button>
        ))}
        {people.length === 0 && <div className="small muted">עדיין אין שמות — הוסיפו את שלכם:</div>}
      </div>
      <form
        className="identity-new"
        onSubmit={(e) => {
          e.preventDefault()
          if (newName.trim()) onCreate(newName.trim())
        }}
      >
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="שם חדש" />
        <button type="submit" className="btn subtle">הוספה</button>
      </form>
      {me && (
        <button className="linkbtn" style={{ display: 'block', margin: '12px auto 0' }} onClick={() => onPick(null)}>
          ניקוי הבחירה
        </button>
      )}
    </Dialog>
  )
}

function ConfirmDialog({ body, onNo, onYes }) {
  return (
    <Dialog title="רגע לפני" onCancel={onNo}>
      <p className="dialog-lead">{body}</p>
      <div className="dialog-foot">
        <button className="btn ghost" onClick={onNo}>ביטול</button>
        <button className="btn danger" onClick={onYes}>כן, בטוח</button>
      </div>
    </Dialog>
  )
}

/* ---------------- drag to reorder ----------------
 * Pointer-based vertical sorting (works with mouse and touch). On pick-up a
 * floating copy of the row follows the pointer while the original stays put
 * as a dimmed placeholder, so the layout never jumps regardless of how tall
 * the rows are. A coloured line shows where the row will land. Nothing is
 * reordered until the drop, when `onReorder` is called with the new id order.
 * The page auto-scrolls near the viewport edges.
 */
function useSortable(ids, onReorder, enabled = true) {
  const [draggingId, setDraggingId] = useState(null)
  const cfg = useRef({ ids, onReorder, enabled })
  cfg.current = { ids, onReorder, enabled }
  const els = useRef(new Map())
  const refCbs = useRef(new Map())
  const S = useRef(null)

  const setRef = (id) => {
    let cb = refCbs.current.get(id)
    if (!cb) {
      cb = (el) => (el ? els.current.set(id, el) : els.current.delete(id))
      refCbs.current.set(id, cb)
    }
    return cb
  }

  const impl = useRef(null)
  if (!impl.current) {
    const clearMarks = () => els.current.forEach((el) => el.classList.remove('drop-before', 'drop-after'))

    const apply = () => {
      const d = S.current
      if (!d) return
      const { ids } = cfg.current
      const dyC = d.pointerY - d.startY
      const dyS = window.scrollY - d.startScroll
      // the copy is position:fixed, so it tracks the pointer in viewport space only
      if (d.clone) d.clone.style.transform = `translateY(${dyC}px)`
      // where the copy's middle now sits, in the page coordinates captured at drag start
      const center = d.selfMid + dyC + dyS
      let to = 0
      for (const r of d.rects) {
        if (r.id === d.id) continue
        if (r.mid < center) to++
      }
      clearMarks()
      if (to !== d.from) {
        const others = ids.filter((x) => x !== d.id)
        if (to < others.length) els.current.get(others[to])?.classList.add('drop-before')
        else els.current.get(others[others.length - 1])?.classList.add('drop-after')
      }
      d.to = to
    }

    const loop = () => {
      const d = S.current
      if (!d) return
      const y = d.pointerY
      const edge = 84
      let px = 0
      if (y > window.innerHeight - edge) px = Math.min(16, (y - window.innerHeight + edge) / 4)
      else if (y < edge) px = -Math.min(16, (edge - y) / 4)
      if (px) {
        window.scrollBy(0, px)
        apply()
      }
      d.raf = requestAnimationFrame(loop)
    }

    const onMove = (e) => {
      const d = S.current
      if (!d) return
      d.pointerY = e.clientY
      apply()
    }

    const finish = (commit) => {
      const d = S.current
      if (!d) return
      S.current = null
      cancelAnimationFrame(d.raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey)
      try { d.handle.releasePointerCapture(d.pointerId) } catch (er) {}
      clearMarks()
      if (d.clone) d.clone.remove()
      els.current.get(d.id)?.classList.remove('sort-ghost')
      document.body.classList.remove('sorting-active')
      if (commit && d.to != null && d.to !== d.from) {
        const { ids, onReorder } = cfg.current
        const next = ids.filter((x) => x !== d.id)
        next.splice(d.to, 0, d.id)
        onReorder(next)
      }
      setDraggingId(null)
    }
    const onUp = () => finish(true)
    const onCancel = () => finish(false)
    const onKey = (e) => {
      if (e.key === 'Escape') finish(false)
    }

    const start = (id, e) => {
      const { ids, enabled } = cfg.current
      if (!enabled || S.current) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const rects = ids
        .map((x) => {
          const el = els.current.get(x)
          if (!el) return null
          const r = el.getBoundingClientRect()
          return { id: x, mid: r.top + r.height / 2 }
        })
        .filter(Boolean)
      const from = ids.indexOf(id)
      const selfEl = els.current.get(id)
      if (from < 0 || !selfEl || rects.length < 2) return
      const r = selfEl.getBoundingClientRect()
      const selfMid = r.top + r.height / 2
      const handle = e.currentTarget

      const clone = selfEl.cloneNode(true)
      clone.classList.add('sort-clone')
      clone.classList.remove('drop-before', 'drop-after')
      clone.style.cssText +=
        `;position:fixed;margin:0;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;` +
        `box-sizing:border-box;z-index:9999;pointer-events:none`
      document.body.appendChild(clone)
      selfEl.classList.add('sort-ghost')

      S.current = {
        id,
        from,
        to: from,
        rects,
        selfMid,
        startY: e.clientY,
        pointerY: e.clientY,
        startScroll: window.scrollY,
        pointerId: e.pointerId,
        handle,
        clone,
        raf: 0,
      }
      try { handle.setPointerCapture(e.pointerId) } catch (er) {}
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onCancel)
      window.addEventListener('keydown', onKey)
      document.body.classList.add('sorting-active')
      setDraggingId(id)
      e.preventDefault()
      e.stopPropagation()
      S.current.raf = requestAnimationFrame(loop)
    }

    impl.current = { start, cancel: onCancel }
  }

  useEffect(() => () => impl.current.cancel(), [])

  return {
    setRef,
    draggingId,
    handleProps: (id) => ({
      onPointerDown: (e) => impl.current.start(id, e),
      title: 'גרירה לשינוי הסדר',
      'aria-label': 'גרירה לשינוי הסדר',
    }),
  }
}

/* ---------------- rows ---------------- */
function RowMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()
  return (
    <>
      <button className="row-menu" ref={ref} onClick={() => setOpen((v) => !v)} aria-label="עוד אפשרויות">
        <Dots size={18} />
      </button>
      {open && (
        <Popover anchorRef={ref} onClose={() => setOpen(false)} width={180}>
          {items.map((it, i) => (
            <button
              key={i}
              className={'popover-item' + (it.danger ? ' danger' : '')}
              onClick={() => {
                setOpen(false)
                it.onClick()
              }}
            >
              {it.icon} {it.label}
            </button>
          ))}
        </Popover>
      )}
    </>
  )
}

function DishRow({ dish, owner, dragHandle, rootRef, onToggleDone, onOpenAssign, onEdit, onDelete }) {
  return (
    <div className={'dish' + (dish.done ? ' done' : '')} ref={rootRef}>
      {dragHandle}
      <button
        className={'check' + (dish.done ? ' on' : '')}
        onClick={onToggleDone}
        aria-pressed={dish.done}
        title={dish.done ? 'בטל סימון' : 'סמן כמוכן'}
      >
        {dish.done && <Check size={15} />}
      </button>
      <button className="dish-body" onClick={onEdit} title="עריכת המנה">
        <span className="dish-name">{dish.name}</span>
        {dish.note && <span className="dish-note">{dish.note}</span>}
      </button>
      <button className={'assignee' + (owner ? ' filled' : '')} onClick={onOpenAssign}>
        {owner ? (
          <>
            <span className="avatar xs" style={{ background: owner.color }}>{initials(owner.name)}</span>
            <span>{owner.name}</span>
          </>
        ) : (
          <span>מי מכין?</span>
        )}
      </button>
      <RowMenu
        items={[
          { icon: <Pencil size={15} />, label: 'עריכה', onClick: onEdit },
          { icon: <Trash size={15} />, label: 'מחיקה', onClick: onDelete, danger: true },
        ]}
      />
    </div>
  )
}

function CategorySection({
  cat,
  tint,
  dishes,
  cdone,
  ctot,
  peopleById,
  rootRef,
  catHandleProps,
  canReorder,
  onReorderDishes,
  onAddDish,
  onEditCat,
  onDeleteCat,
  onEditDish,
  onDeleteDish,
  onToggleDone,
  onOpenAssign,
}) {
  const sort = useSortable(
    dishes.map((d) => d.id),
    (nextIds) => onReorderDishes(cat.id, nextIds),
    canReorder,
  )
  return (
    <section className="cat" ref={rootRef}>
      <div className="cat-head">
        {catHandleProps && (
          <button type="button" tabIndex={-1} className="sort-handle cat-drag" {...catHandleProps}>
            <Grip size={18} />
          </button>
        )}
        <span className="cat-emoji" data-tint={tint}>{cat.emoji}</span>
        <div className="cat-id">
          <h3 className="cat-title">{cat.name}</h3>
          <div className="cat-meta">{ctot ? `${cdone} מתוך ${ctot} מוכנות` : 'עדיין ריק'}</div>
        </div>
        <RowMenu
          items={[
            { icon: <Pencil size={15} />, label: 'עריכת הנושא', onClick: onEditCat },
            { icon: <Trash size={15} />, label: 'מחיקת הנושא', onClick: onDeleteCat, danger: true },
          ]}
        />
      </div>
      <div className="dishes">
        {dishes.map((d) => (
          <DishRow
            key={d.id}
            dish={d}
            owner={d.takenBy ? peopleById[d.takenBy] || null : null}
            rootRef={sort.setRef(d.id)}
            dragHandle={
              canReorder && dishes.length > 1 ? (
                <button type="button" tabIndex={-1} className="sort-handle sort-handle-sm" {...sort.handleProps(d.id)}>
                  <Grip size={15} />
                </button>
              ) : null
            }
            onToggleDone={() => onToggleDone(d)}
            onOpenAssign={() => onOpenAssign(d)}
            onEdit={() => onEditDish(d)}
            onDelete={() => onDeleteDish(d)}
          />
        ))}
        {dishes.length === 0 && <div className="dish-empty">עדיין אין מנות בנושא הזה</div>}
      </div>
      <button className="add-dish-btn" onClick={onAddDish}>
        <Plus size={17} /> הוסיפו מנה
      </button>
    </section>
  )
}

function PersonCard({ p, taken, dn, cats, selected, isMe, onSelect, onBeMe, onToggleDone, onEdit, onDelete }) {
  const [open, setOpen] = useState(isMe)
  const catName = (id) => (cats.find((c) => c.id === id) || {}).name || ''
  const list = [...taken].sort(bySort)
  const menuItems = [
    ...(isMe ? [] : [{ icon: <UserCheck size={15} />, label: 'זה אני', onClick: onBeMe }]),
    { icon: <Pencil size={15} />, label: 'עריכה', onClick: onEdit },
    { icon: <Trash size={15} />, label: 'מחיקה', onClick: onDelete, danger: true },
  ]
  return (
    <div className={'person' + (selected ? ' sel' : '')}>
      <div className="person-top">
        <button className="person-main" onClick={onSelect}>
          <span className="avatar md" style={{ background: p.color }}>{initials(p.name)}</span>
          <span className="person-idw">
            <span className="person-name">
              {p.name}
              {isMe && <em className="metag">אני</em>}
            </span>
            <span className="person-count">
              {taken.length ? `${taken.length} מנות · ${dn} מוכנות` : 'עדיין לא בחר/ה'}
            </span>
          </span>
        </button>
        <RowMenu items={menuItems} />
      </div>
      {taken.length > 0 && (
        <>
          <div className="person-bar">
            <i style={{ width: pct(dn, taken.length) + '%', background: p.color }} />
          </div>
          <button className="person-expand" onClick={() => setOpen((o) => !o)}>
            {open ? 'הסתר' : 'הצג'} רשימה <ChevronDown size={14} className={open ? 'flip' : ''} />
          </button>
          {open && (
            <div className="checklist">
              {list.map((d) => (
                <label key={d.id} className={'checkline' + (d.done ? ' done' : '')}>
                  <button
                    type="button"
                    className={'mini' + (d.done ? ' on' : '')}
                    onClick={() => onToggleDone(d)}
                  >
                    {d.done && <Check size={12} />}
                  </button>
                  <span>{d.name}</span>
                  <em>{catName(d.categoryId)}</em>
                </label>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function AssignDialog({ dish, people, me, onPick, onCancel }) {
  const meObj = people.find((p) => p.id === me) || null
  const others = people.filter((p) => p.id !== me)
  return (
    <Dialog title={dish.name} onCancel={onCancel}>
      <p className="dialog-lead">מי מכין את זה?</p>
      <div className="assign-opts">
        <button
          className={'assign-opt me' + (dish.takenBy && dish.takenBy === me ? ' on' : '')}
          onClick={() => onPick('__me__')}
        >
          {meObj ? (
            <span className="avatar sm" style={{ background: meObj.color }}>{initials(meObj.name)}</span>
          ) : (
            <span className="avatar sm ghost">★</span>
          )}
          זה אני{meObj ? ` · ${meObj.name}` : ''}
        </button>
        {others.map((p) => (
          <button
            key={p.id}
            className={'assign-opt' + (dish.takenBy === p.id ? ' on' : '')}
            onClick={() => onPick(p.id)}
          >
            <span className="avatar sm" style={{ background: p.color }}>{initials(p.name)}</span>
            {p.name}
            {dish.takenBy === p.id && <Check size={16} />}
          </button>
        ))}
        {dish.takenBy && (
          <button className="assign-opt clear" onClick={() => onPick(null)}>
            הסרת השיבוץ
          </button>
        )}
      </div>
    </Dialog>
  )
}

/* ---------------- announcement bar ----------------
 * One shared message pinned above the menu. Anyone can edit it; the text is
 * synced through the `settings` table (key `announcement`) like the rest of
 * the menu, so everyone on the link sees the same note.
 */
function AnnouncementBar({ announcement, onSave }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const taRef = useRef()
  const has = !!announcement.text

  useEffect(() => {
    if (!editing) return
    const el = taRef.current
    if (!el) return
    el.focus()
    el.setSelectionRange(el.value.length, el.value.length)
  }, [editing])

  const open = () => {
    setDraft(announcement.text)
    setEditing(true)
  }
  const save = () => {
    onSave(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="notice">
        <div className="notice-inner is-editing">
          <span className="notice-ic"><Megaphone size={18} /></span>
          <div className="notice-body">
            <textarea
              ref={taRef}
              className="notice-ta"
              value={draft}
              rows={2}
              placeholder="למשל: השנה אצל סבתא, מתחילים ב-19:00. מי שיכול — להביא כיסאות מתקפלים."
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) save()
                if (e.key === 'Escape') setEditing(false)
              }}
            />
            <div className="notice-foot">
              {has && (
                <button
                  className="linkbtn notice-clear"
                  onClick={() => {
                    onSave('')
                    setEditing(false)
                  }}
                >
                  מחיקת ההודעה
                </button>
              )}
              <button className="btn ghost" onClick={() => setEditing(false)}>ביטול</button>
              <button className="btn primary" onClick={save}>{has ? 'שמירה' : 'פרסום'}</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!has) {
    return (
      <div className="notice empty">
        <button className="notice-inner" onClick={open}>
          <span className="notice-ic"><Megaphone size={18} /></span>
          <span className="notice-add">הוספת הודעה למשפחה — תופיע כאן לכל מי שנכנס לקישור</span>
          <Pencil size={15} className="notice-pen" />
        </button>
      </div>
    )
  }

  const meta = [announcement.by && `עודכן ע״י ${announcement.by}`, relTime(announcement.at)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="notice">
      <div className="notice-inner">
        <span className="notice-ic"><Megaphone size={18} /></span>
        <div className="notice-body">
          <div className="notice-text">{announcement.text}</div>
          {meta && <div className="notice-meta">{meta}</div>}
        </div>
        <button className="notice-edit" onClick={open} aria-label="עריכת ההודעה"><Pencil size={15} /></button>
      </div>
    </div>
  )
}

/* ---------------- App ---------------- */
export default function App() {
  const [mode, setMode] = useState('local')
  const store = useMemo(() => createStore(setMode), [])
  const [data, setData] = useState(store.getState)
  const [me, setMeState] = useState(() => {
    try {
      return localStorage.getItem(LS_ME) || null
    } catch (e) {
      return null
    }
  })
  const [activePerson, setActivePerson] = useState(null)
  const [dialog, setDialog] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const menuBtnRef = useRef()
  const fileRef = useRef()

  useEffect(() => store.subscribe(setData), [store])
  useEffect(() => () => store.destroy(), [store])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const setMe = (id) => {
    setMeState(id)
    try {
      id ? localStorage.setItem(LS_ME, id) : localStorage.removeItem(LS_ME)
    } catch (e) {}
  }

  useEffect(() => {
    if (me && data.people.length && !data.people.some((p) => p.id === me)) setMe(null)
  }, [data.people, me])

  const cats = useMemo(() => [...data.categories].sort(bySort), [data.categories])
  const people = useMemo(() => [...data.people].sort(bySort), [data.people])
  const dishesByCat = useMemo(() => {
    const m = {}
    for (const d of [...data.dishes].sort(bySort)) (m[d.categoryId] = m[d.categoryId] || []).push(d)
    return m
  }, [data.dishes])
  const stats = useMemo(
    () => ({
      total: data.dishes.length,
      assigned: data.dishes.filter((d) => d.takenBy).length,
      done: data.dishes.filter((d) => d.done).length,
    }),
    [data.dishes],
  )

  const meObj = people.find((p) => p.id === me) || null
  const peopleById = useMemo(() => {
    const m = {}
    for (const p of people) m[p.id] = p
    return m
  }, [people])

  const catSort = useSortable(
    cats.map((c) => c.id),
    (nextIds) => store.reorderCategories(nextIds),
    !activePerson,
  )
  const reorderDishes = (catId, ids) => store.reorderDishes(catId, ids)

  function needIdentity(then) {
    setDialog({ type: 'identity', then })
  }
  function openAssign(dish) {
    setDialog({ type: 'assign', dish })
  }
  function pickAssignee(dish, pid) {
    if (pid === '__me__') {
      if (!me) {
        setDialog(null)
        needIdentity((id) => store.updateDish(dish.id, { takenBy: id }))
        return
      }
      pid = me
    }
    store.updateDish(dish.id, { takenBy: pid })
    setDialog(null)
  }
  function toggleDone(dish) {
    store.updateDish(dish.id, { done: !dish.done })
  }

  function saveDish(v, editing) {
    if (editing)
      store.updateDish(editing.id, {
        name: v.name,
        note: v.note,
        categoryId: v.categoryId,
        takenBy: v.takenBy || null,
      })
    else
      store.addDish({
        name: v.name,
        note: v.note || '',
        categoryId: v.categoryId,
        takenBy: v.takenBy || null,
        done: false,
        order: Date.now(),
      })
    setDialog(null)
  }
  function saveCategory(v, editing) {
    if (editing) store.updateCategory(editing.id, { name: v.name, emoji: v.emoji })
    else store.addCategory({ name: v.name, emoji: v.emoji, order: Date.now() })
    setDialog(null)
  }
  function savePerson(v, editing) {
    if (editing) {
      store.updatePerson(editing.id, { name: v.name, color: v.color })
      setDialog(null)
      return
    }
    store.addPerson({ name: v.name, color: v.color, order: Date.now() })
    setDialog(null)
  }
  function savePersonRaw(name) {
    const used = people.map((p) => p.color)
    const color = AVATAR_COLORS.find((c) => !used.includes(c)) || AVATAR_COLORS[people.length % AVATAR_COLORS.length]
    return store.addPerson({ name, color, order: Date.now() })
  }

  function confirmDelete(kind, item) {
    const body = {
      category: `למחוק את הנושא "${item.name}" ואת כל המנות שבו?`,
      dish: `למחוק את "${item.name}"?`,
      person: `למחוק את ${item.name}? המנות שנבחרו על שמו/ה ישוחררו.`,
    }[kind]
    setDialog({
      type: 'confirm',
      body,
      onYes: () => {
        if (kind === 'category') store.deleteCategory(item.id)
        if (kind === 'dish') store.deleteDish(item.id)
        if (kind === 'person') {
          store.deletePerson(item.id)
          if (me === item.id) setMe(null)
        }
        setDialog(null)
      },
    })
  }

  function handleExport() {
    setMenuOpen(false)
    doExport(data)
    setToast('הקובץ ירד לתיקיית ההורדות')
  }
  function handleImportClick() {
    setMenuOpen(false)
    if (fileRef.current) fileRef.current.click()
  }
  async function onFile(e) {
    const f = e.target.files && e.target.files[0]
    e.target.value = ''
    if (!f) return
    let parsed
    try {
      parsed = JSON.parse(await f.text())
    } catch (err) {
      setToast('קובץ לא תקין')
      return
    }
    setDialog({
      type: 'confirm',
      body: 'הייבוא יחליף את התפריט הנוכחי במה שבקובץ. להמשיך?',
      onYes: () => {
        try {
          store.importAll(parsed)
          setToast('התפריט יובא')
        } catch (err) {
          setToast('הייבוא נכשל')
        }
        setDialog(null)
      },
    })
  }
  function handleResetStarter() {
    setMenuOpen(false)
    setDialog({
      type: 'confirm',
      body: 'לטעון מחדש את התפריט המלא? זה יחליף את כל מה שיש עכשיו (כולל שיבוצים).',
      onYes: () => {
        store.resetToStarter()
        setMe(null)
        setToast('התפריט נטען')
        setDialog(null)
      },
    })
  }
  function handleClear() {
    setMenuOpen(false)
    setDialog({
      type: 'confirm',
      body: 'לאפס את כל התפריט? הפעולה מוחקת נושאים, מנות ושמות ואי אפשר לבטל.',
      onYes: () => {
        store.clearAll()
        setMe(null)
        setDialog(null)
      },
    })
  }

  const activePersonObj = people.find((p) => p.id === activePerson) || null
  const pctReady = pct(stats.done, stats.total)
  const waiting = stats.total - stats.assigned

  return (
    <div className="app">
      <header className="masthead">
        <div className="masthead-inner">
          <div className="brand-row">
            <span className="brand-mark"><Pom /></span>
            <div className="brand">
              <div className="eyebrow">ראש השנה תשפ״ז · שנה טובה ומתוקה</div>
              <h1>השולחן של המשפחה</h1>
            </div>
          </div>
          <div className="masthead-tools">
            <button className="who" onClick={() => setDialog({ type: 'identity' })}>
              {meObj ? (
                <>
                  <span className="avatar sm" style={{ background: meObj.color }}>{initials(meObj.name)}</span>
                  <span>{meObj.name}</span>
                </>
              ) : (
                <span className="muted">מי את/ה?</span>
              )}
              <ChevronDown size={15} />
            </button>
            <button className="icon-btn" ref={menuBtnRef} onClick={() => setMenuOpen((v) => !v)} aria-label="אפשרויות">
              <Dots size={18} />
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <Popover anchorRef={menuBtnRef} onClose={() => setMenuOpen(false)} width={210}>
          <button className="popover-item" onClick={handleExport}><Download size={15} /> ייצוא לקובץ</button>
          <button className="popover-item" onClick={handleImportClick}><Upload size={15} /> ייבוא מקובץ</button>
          <button className="popover-item" onClick={handleResetStarter}><Sparkle size={15} /> טעינת התפריט המלא</button>
          <button className="popover-item danger" onClick={handleClear}><Trash size={15} /> איפוס התפריט</button>
        </Popover>
      )}

      <AnnouncementBar
        announcement={data.announcement}
        onSave={(text) => store.setAnnouncement(text, meObj?.name || '')}
      />

      <div className="stats">
        <p className="stats-line">
          <b>{stats.assigned}</b> מתוך <b>{stats.total}</b> מנות שובצו
          {stats.done > 0 && (
            <>
              {' · '}
              <b>{stats.done}</b> כבר מוכנות
            </>
          )}
        </p>
        <div className="bar">
          <i style={{ width: pctReady + '%' }} />
        </div>
      </div>

      <div className="page">
        <main className="col-main">
          {activePersonObj && (
            <div className="filterbar">
              מציג רק את המנות של <b>{activePersonObj.name}</b> ·
              <button className="linkbtn" onClick={() => setActivePerson(null)}>הצג את כל התפריט</button>
            </div>
          )}

          {cats.length === 0 && (
            <div className="empty-menu">
              <h3>מתחילים לבנות את התפריט</h3>
              <div>מוסיפים נושאים (סלטים, עיקריות, קינוחים…) ובכל נושא את המנות.</div>
              <button className="btn primary" onClick={() => setDialog({ type: 'category' })}>
                <Plus size={16} /> נושא ראשון
              </button>
            </div>
          )}

          {cats.length > 0 && !activePerson && (
            <button className="add-cat" onClick={() => setDialog({ type: 'category' })}>
              <Plus size={17} /> הוספת נושא חדש
            </button>
          )}

          {cats.map((cat, idx) => {
            const all = dishesByCat[cat.id] || []
            let list = all
            if (activePerson) list = all.filter((d) => d.takenBy === activePerson)
            if (activePerson && list.length === 0) return null
            const cdone = all.filter((d) => d.done).length
            return (
              <CategorySection
                key={cat.id}
                cat={cat}
                tint={idx % 5}
                dishes={list}
                cdone={cdone}
                ctot={all.length}
                peopleById={peopleById}
                rootRef={catSort.setRef(cat.id)}
                catHandleProps={!activePerson && cats.length > 1 ? catSort.handleProps(cat.id) : null}
                canReorder={!activePerson}
                onReorderDishes={reorderDishes}
                onAddDish={() => setDialog({ type: 'dish', defaultCategoryId: cat.id })}
                onEditCat={() => setDialog({ type: 'category', editing: cat })}
                onDeleteCat={() => confirmDelete('category', cat)}
                onEditDish={(d) => setDialog({ type: 'dish', editing: d })}
                onDeleteDish={(d) => confirmDelete('dish', d)}
                onToggleDone={toggleDone}
                onOpenAssign={openAssign}
              />
            )
          })}
        </main>

        <aside className="col-aside">
          <div className="panel">
            <h2>כרטיסי שמות</h2>
            <div className="sub">מי מכין מה — ואפשר לסמן ✓ כשמוכן</div>

            <button
              className={'allcard' + (activePerson === null ? ' sel' : '')}
              onClick={() => setActivePerson(null)}
            >
              <span className="allcard-ic"><Users size={16} /></span>
              <span>
                <b>כל המשפחה</b>
                <span>
                  {stats.assigned}/{stats.total} מנות שובצו
                  {waiting > 0 ? ` · ${waiting} מחכות למתנדב` : ''}
                </span>
              </span>
            </button>

            {people.map((p) => {
              const taken = data.dishes.filter((d) => d.takenBy === p.id)
              const dn = taken.filter((d) => d.done).length
              return (
                <PersonCard
                  key={p.id}
                  p={p}
                  taken={taken}
                  dn={dn}
                  cats={data.categories}
                  selected={activePerson === p.id}
                  isMe={me === p.id}
                  onSelect={() => setActivePerson(activePerson === p.id ? null : p.id)}
                  onBeMe={() => setMe(p.id)}
                  onToggleDone={toggleDone}
                  onEdit={() => setDialog({ type: 'person', editing: p })}
                  onDelete={() => confirmDelete('person', p)}
                />
              )
            })}
            {people.length === 0 && (
              <div className="small muted" style={{ padding: '6px 2px' }}>עדיין לא הוספתם שמות.</div>
            )}

            <button className="add-person" onClick={() => setDialog({ type: 'person' })}>
              <Plus size={15} /> הוספת בן/בת משפחה
            </button>
            <div className="tip">
              <Sparkle size={15} />
              <div>לא חייבים שכל אחד יכין הכול — אפשר לחלק גם קניות, כלים, קרח והסעות.</div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="foot">
        {mode === 'db'
          ? 'מסונכרן — כל מי שנכנס לקישור רואה את אותו התפריט, מתעדכן כל כמה שניות. ⋯ לייצוא גיבוי.'
          : 'מצב מקומי — השינויים נשמרים בדפדפן הזה. דרך ⋯ אפשר לייצא קובץ ולטעון אותו במכשיר אחר.'}
      </footer>

      {dialog?.type === 'dish' && (
        <DishDialog
          data={data}
          editing={dialog.editing}
          defaultCategoryId={dialog.defaultCategoryId}
          onCancel={() => setDialog(null)}
          onSave={(v) => saveDish(v, dialog.editing)}
        />
      )}
      {dialog?.type === 'category' && (
        <CategoryDialog editing={dialog.editing} onCancel={() => setDialog(null)} onSave={(v) => saveCategory(v, dialog.editing)} />
      )}
      {dialog?.type === 'person' && (
        <PersonDialog
          editing={dialog.editing}
          usedColors={people.map((p) => p.color)}
          onCancel={() => setDialog(null)}
          onSave={(v) => savePerson(v, dialog.editing)}
        />
      )}
      {dialog?.type === 'identity' && (
        <IdentityDialog
          people={people}
          me={me}
          onCancel={() => setDialog(null)}
          onPick={(pid) => {
            setMe(pid)
            if (dialog.then) dialog.then(pid)
            setDialog(null)
          }}
          onCreate={(name) => {
            const id = savePersonRaw(name)
            setMe(id)
            if (dialog.then) dialog.then(id)
            setDialog(null)
          }}
        />
      )}
      {dialog?.type === 'assign' && (
        <AssignDialog
          dish={dialog.dish}
          people={people}
          me={me}
          onCancel={() => setDialog(null)}
          onPick={(pid) => pickAssignee(dialog.dish, pid)}
        />
      )}
      {dialog?.type === 'confirm' && (
        <ConfirmDialog body={dialog.body} onNo={() => setDialog(null)} onYes={dialog.onYes} />
      )}

      {toast && <div className="toast">{toast}</div>}
      <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: 'none' }} onChange={onFile} />
    </div>
  )
}
