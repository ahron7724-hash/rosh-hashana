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

/* Starter menu — used only when there is nothing saved yet. */
const STARTER = {
  people: [
    { id: 'p1', name: 'אמא', color: '#a83440', order: 1 },
    { id: 'p2', name: 'אבא', color: '#a9772a', order: 2 },
    { id: 'p3', name: 'סבתא', color: '#5f7344', order: 3 },
  ],
  categories: [
    { id: 'c1', name: 'סימני החג', emoji: '🍎', order: 1 },
    { id: 'c2', name: 'סלטים ומטבלים', emoji: '🥗', order: 2 },
    { id: 'c3', name: 'מרקים ופתיחה', emoji: '🍲', order: 3 },
    { id: 'c4', name: 'מנות עיקריות', emoji: '🍗', order: 4 },
    { id: 'c5', name: 'קינוחים', emoji: '🍰', order: 5 },
  ],
  dishes: [
    { id: 'd1', categoryId: 'c1', name: 'תפוח בדבש', note: '', takenBy: 'p1', done: false, order: 1 },
    { id: 'd2', categoryId: 'c1', name: 'רימון', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd3', categoryId: 'c1', name: 'תמרים', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd4', categoryId: 'c1', name: 'ראש דג', note: 'שיהיו לראש ולא לזנב', takenBy: null, done: false, order: 4 },
    { id: 'd5', categoryId: 'c1', name: 'קרא (דלעת) בדבש', note: '', takenBy: null, done: false, order: 5 },
    { id: 'd6', categoryId: 'c2', name: 'סלט סלק אפוי ותפוחים', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd7', categoryId: 'c2', name: 'גזר מרוקאי חריף', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd8', categoryId: 'c2', name: 'מטבוחה', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd9', categoryId: 'c2', name: 'טחינה גולמית', note: '', takenBy: null, done: false, order: 4 },
    { id: 'd10', categoryId: 'c2', name: 'סלט חסה עם פלחי רימון', note: '', takenBy: null, done: false, order: 5 },
    { id: 'd11', categoryId: 'c3', name: 'מרק עוף עם קניידלך', note: 'סיר גדול', takenBy: 'p3', done: false, order: 1 },
    { id: 'd12', categoryId: 'c3', name: 'מרק ירקות שורש', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd13', categoryId: 'c3', name: 'קציצות דג במרוקאי', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd14', categoryId: 'c4', name: 'עוף צלוי בדבש ושזיפים', note: '', takenBy: null, done: false, order: 1 },
    { id: 'd15', categoryId: 'c4', name: 'צלי בקר ביין אדום', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd16', categoryId: 'c4', name: 'אורז עם שקדים וצימוקים', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd17', categoryId: 'c4', name: 'תפוחי אדמה מוזהבים', note: '', takenBy: null, done: false, order: 4 },
    { id: 'd18', categoryId: 'c4', name: 'שעועית ירוקה בשום', note: '', takenBy: null, done: false, order: 5 },
    { id: 'd19', categoryId: 'c5', name: 'עוגת דבש', note: '', takenBy: 'p1', done: false, order: 1 },
    { id: 'd20', categoryId: 'c5', name: 'עוגת תפוחים', note: '', takenBy: null, done: false, order: 2 },
    { id: 'd21', categoryId: 'c5', name: 'פירות העונה', note: '', takenBy: null, done: false, order: 3 },
    { id: 'd22', categoryId: 'c5', name: 'טייגלך', note: 'עוגיות בצק בדבש', takenBy: null, done: false, order: 4 },
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
const Download = (p) => <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
const Upload = (p) => <svg {...base(p)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
const Sparkle = (p) => <svg {...base(p)} fill="currentColor" stroke="none"><path d="M12 2l1.9 5.6L19.5 9l-4.6 3.3L16 18l-4-3.3L8 18l1.1-5.7L4.5 9l5.6-1.4Z" /></svg>

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
  return {
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
 * One shared JSON "file" in the cloud (Vercel Blob, via /api/data) when it's
 * configured; otherwise falls back to this browser's localStorage. Either way
 * localStorage is kept as an offline cache. In shared mode the page pushes the
 * whole document on every change (debounced) and polls every few seconds to
 * pick up other people's changes.
 */
const API = '/api/data'
const POLL_MS = 4000
const PUSH_MS = 700

function createStore(onMode) {
  const subs = new Set()
  let state = loadLocal()
  let mode = 'local' // 'local' | 'remote'
  let lastRev = 0
  let dirty = false // local edits not yet confirmed to the server
  let pushTimer = null
  let pollTimer = null
  let dead = false

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
  function emit() {
    subs.forEach((f) => f(state))
  }
  function setMode(m) {
    if (m !== mode) {
      mode = m
      if (onMode) onMode(m)
    }
  }

  function commit(next) {
    state = next
    saveLocal()
    emit()
    if (mode === 'remote') {
      dirty = true
      clearTimeout(pushTimer)
      pushTimer = setTimeout(push, PUSH_MS)
    }
  }

  async function push() {
    if (dead || mode !== 'remote') return
    const snap = state
    try {
      const r = await fetch(API, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ data: snap }),
      })
      if (!r.ok) throw new Error('PUT ' + r.status)
      const j = await r.json()
      if (j && j.rev) lastRev = j.rev
      if (state !== snap) {
        clearTimeout(pushTimer)
        pushTimer = setTimeout(push, 400)
      } else {
        dirty = false
      }
    } catch (e) {
      if (!dead) setTimeout(push, 3000)
    }
  }

  async function poll() {
    if (dead || mode !== 'remote' || dirty) return
    try {
      const r = await fetch(API, { cache: 'no-store' })
      if (!r.ok) return
      const j = await r.json()
      if (j && j.data && j.rev > lastRev && !dirty) {
        lastRev = j.rev
        state = normalize(j.data)
        saveLocal()
        emit()
      }
    } catch (e) {}
  }

  async function init() {
    let j = null
    try {
      const r = await fetch(API, { cache: 'no-store' })
      const ct = r.headers.get('content-type') || ''
      if (r.ok && ct.includes('json')) j = await r.json()
    } catch (e) {}
    if (dead) return
    if (j) {
      setMode('remote')
      if (j.data && j.rev) {
        lastRev = j.rev
        state = normalize(j.data)
        saveLocal()
        emit()
      } else {
        await push() // server is empty — seed it from what we have
      }
      pollTimer = setInterval(poll, POLL_MS)
    } else {
      setMode('local')
    }
  }
  init()

  const mutate = (fn) => commit(fn(state))

  return {
    getState: () => state,
    mode: () => mode,
    destroy() {
      dead = true
      clearTimeout(pushTimer)
      clearInterval(pollTimer)
    },
    subscribe(f) {
      subs.add(f)
      f(state)
      return () => subs.delete(f)
    },
    addCategory(d) {
      const id = uid()
      mutate((s) => ({ ...s, categories: [...s.categories, { id, ...d }] }))
      return id
    },
    updateCategory(id, p) {
      mutate((s) => ({ ...s, categories: s.categories.map((c) => (c.id === id ? { ...c, ...p } : c)) }))
    },
    deleteCategory(id) {
      mutate((s) => ({
        ...s,
        categories: s.categories.filter((c) => c.id !== id),
        dishes: s.dishes.filter((x) => x.categoryId !== id),
      }))
    },
    addDish(d) {
      const id = uid()
      mutate((s) => ({ ...s, dishes: [...s.dishes, { id, ...d }] }))
      return id
    },
    updateDish(id, p) {
      mutate((s) => ({ ...s, dishes: s.dishes.map((x) => (x.id === id ? { ...x, ...p } : x)) }))
    },
    deleteDish(id) {
      mutate((s) => ({ ...s, dishes: s.dishes.filter((x) => x.id !== id) }))
    },
    addPerson(d) {
      const id = uid()
      mutate((s) => ({ ...s, people: [...s.people, { id, ...d }] }))
      return id
    },
    updatePerson(id, p) {
      mutate((s) => ({ ...s, people: s.people.map((x) => (x.id === id ? { ...x, ...p } : x)) }))
    },
    deletePerson(id) {
      mutate((s) => ({
        ...s,
        people: s.people.filter((x) => x.id !== id),
        dishes: s.dishes.map((x) => (x.takenBy === id ? { ...x, takenBy: null } : x)),
      }))
    },
    importAll(payload) {
      commit(normalize(payload))
    },
    clearAll() {
      commit({ categories: [], dishes: [], people: [] })
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
          <span>מי מביא? (אפשר להשאיר ריק)</span>
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

function DishRow({ dish, owner, onToggleDone, onOpenAssign, onEdit, onDelete }) {
  return (
    <div className={'dish' + (dish.done ? ' done' : '')}>
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
          <span>מי מביא?</span>
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
  onAddDish,
  onEditCat,
  onDeleteCat,
  onEditDish,
  onDeleteDish,
  onToggleDone,
  onOpenAssign,
}) {
  return (
    <section className="cat">
      <div className="cat-head">
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
      <p className="dialog-lead">מי מביא את זה?</p>
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
        <Popover anchorRef={menuBtnRef} onClose={() => setMenuOpen(false)} width={200}>
          <button className="popover-item" onClick={handleExport}><Download size={15} /> ייצוא לקובץ</button>
          <button className="popover-item" onClick={handleImportClick}><Upload size={15} /> ייבוא מקובץ</button>
          <button className="popover-item danger" onClick={handleClear}><Trash size={15} /> איפוס התפריט</button>
        </Popover>
      )}

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

          {cats.length > 0 && !activePerson && (
            <button className="add-cat" onClick={() => setDialog({ type: 'category' })}>
              <Plus size={16} /> נושא חדש
            </button>
          )}
        </main>

        <aside className="col-aside">
          <div className="panel">
            <h2>כרטיסי שמות</h2>
            <div className="sub">מי מביא מה — ואפשר לסמן ✓ כשמוכן</div>

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
              <div>לא חייבים שכל אחד יביא הכול — אפשר לחלק גם קניות, כלים, קרח והסעות.</div>
            </div>
          </div>
        </aside>
      </div>

      <footer className="foot">
        {mode === 'remote'
          ? 'מסונכרן — כל מי שנכנס לקישור רואה את אותו התפריט (מתעדכן כל כמה שניות). ⋯ לייצוא גיבוי.'
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
