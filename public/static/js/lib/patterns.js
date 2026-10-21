// ═══════════════════════════════════════════
// UI patterns: Toast / Bottom Sheet / Skeleton / Swipe Action / Auto Complete / Pull to Refresh
// ═══════════════════════════════════════════
import { h, $, $$, rich, tex, reduced } from './ui.js'

const haptic = (ms = 8) => { try { navigator.vibrate?.(ms) } catch {} }
// touch + mouse drag (pointer capture is unreliable with touch-action on some browsers)
function drag(el, { start, move, end, skip = (t) => t.closest('button') }) {
  el.addEventListener('touchstart', (e) => { if (skip(e.target)) return; start(e.touches[0].clientX, e.touches[0].clientY) }, { passive: true })
  el.addEventListener('touchmove', (e) => { if (move(e.touches[0].clientX, e.touches[0].clientY) && e.cancelable) e.preventDefault() }, { passive: false })
  el.addEventListener('touchend', () => end()); el.addEventListener('touchcancel', () => end())
  el.addEventListener('mousedown', (e) => {
    if (e.button || skip(e.target)) return; start(e.clientX, e.clientY)
    const mm = (ev) => move(ev.clientX, ev.clientY), mu = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu) }
    addEventListener('mousemove', mm); addEventListener('mouseup', mu)
  })
}

// ───────────────── TOAST ─────────────────
// toast(msg, { kind: 'ok'|'ng'|'info'|'star', icon, action: {label, fn}, duration })
const ICON = { ok: '✓', ng: '!', info: 'i', star: '★' }
export function toast(msg, opt = {}) {
  if (typeof opt === 'string') opt = { kind: opt }
  const { kind = 'ok', icon = ICON[kind] || '✓', action, duration = action ? 4200 : 2600 } = opt
  let box = $('#toasts')
  if (!box) { box = h('div#toasts', { role: 'status', 'aria-live': 'polite' }); document.body.append(box) }
  // stack limit
  const live = $$('.toast', box); if (live.length >= 3) dismiss(live[0])
  const bar = h('i.toast-bar', { style: { animationDuration: duration + 'ms' } })
  const t = h('div.toast.' + kind,
    h('span.toast-ic', icon),
    h('span.toast-msg', { html: msg }),
    action ? h('button.toast-act', { type: 'button', onclick: (e) => { e.stopPropagation(); action.fn(); dismiss(t) } }, action.label) : null,
    h('button.toast-x', { type: 'button', 'aria-label': '閉じる', onclick: () => dismiss(t) }, '×'),
    bar)
  box.append(t)
  requestAnimationFrame(() => t.classList.add('in'))
  let left = duration, start = performance.now(), timer
  const run = () => { start = performance.now(); timer = setTimeout(() => dismiss(t), left); bar.style.animationPlayState = 'running' }
  const pause = () => { clearTimeout(timer); left -= performance.now() - start; bar.style.animationPlayState = 'paused' }
  t.addEventListener('pointerenter', pause); t.addEventListener('pointerleave', run)
  // swipe to dismiss
  let sx = null, dx = 0
  drag(t, {
    start: (x) => { sx = x; dx = 0; t.style.transition = 'none'; pause() },
    move: (x) => { if (sx == null) return false; dx = x - sx; t.style.transform = `translateX(${dx}px) rotate(${dx / 30}deg)`; t.style.opacity = 1 - Math.min(1, Math.abs(dx) / 220); return true },
    end: () => {
      if (sx == null) return; sx = null; t.style.transition = ''
      if (Math.abs(dx) > 90) { t.__gone = 1; t.style.transform = `translateX(${dx > 0 ? 420 : -420}px) rotate(${dx > 0 ? 12 : -12}deg)`; t.style.opacity = 0; setTimeout(() => t.remove(), 300) }
      else { t.style.transform = ''; t.style.opacity = ''; run() }
    },
  })
  run()
  return t
}
function dismiss(t) { if (!t || t.__gone) return; t.__gone = 1; t.classList.remove('in'); t.classList.add('out'); setTimeout(() => t.remove(), 420) }

// ───────────────── BOTTOM SHEET ─────────────────
// iOS-safe scroll lock: body を固定してスクロール位置を保持
let lockedY = 0
function lockScroll(on) {
  const de = document.documentElement, b = document.body
  if (on) {
    if (de.classList.contains('sheet-open')) return
    lockedY = scrollY
    de.classList.add('sheet-open')
    Object.assign(b.style, { position: 'fixed', top: -lockedY + 'px', left: '0', right: '0', width: '100%' })
  } else {
    if (!de.classList.contains('sheet-open')) return
    Object.assign(b.style, { position: '', top: '', left: '', right: '', width: '' })
    de.style.scrollBehavior = 'auto'; scrollTo(0, lockedY); de.style.scrollBehavior = ''
    requestAnimationFrame(() => de.classList.remove('sheet-open'))
  }
}
let sheetEl = null, lastFocus = null
export function openSheet({ title = '', eyebrow = '', body, color = 'var(--butter)', snap = 'half', onClose } = {}) {
  closeSheet(true)
  lastFocus = document.activeElement
  const panel = h('div.sheet-panel', { role: 'dialog', 'aria-modal': 'true', 'aria-label': title.replace(/<[^>]+>/g, ''), tabindex: '-1', style: { '--sc': color } })
  const grip = h('div.sheet-grip', { 'aria-hidden': 'true' }, h('i'))
  const head = h('div.sheet-head',
    h('div', eyebrow ? h('div.sheet-eyebrow', eyebrow) : null, h('h3.sheet-title', { html: rich(title) })),
    h('button.sheet-close', { type: 'button', 'aria-label': '閉じる', onclick: () => closeSheet() }, '×'))
  const content = h('div.sheet-body')
  if (body instanceof Node) content.append(body); else content.innerHTML = body || ''
  panel.append(grip, head, content)
  const scrim = h('div.sheet-scrim', { onclick: () => closeSheet() })
  sheetEl = h('div.sheet', scrim, panel)
  sheetEl.__onClose = onClose
  document.body.append(sheetEl)
  lockScroll(true)
  const vh = () => innerHeight
  const snaps = { half: .52, full: .9 }
  let cur = snaps[snap] || .52
  const setH = (frac, anim = true) => { panel.style.transition = anim ? '' : 'none'; panel.style.height = Math.round(frac * vh()) + 'px' }
  setH(cur, false)
  requestAnimationFrame(() => { sheetEl.classList.add('in'); panel.focus({ preventScroll: true }) })
  // drag on grip/head (snap: half / full / dismiss, velocity-aware)
  let sy = null, sh = 0, lastY = 0, lastT = 0, vel = 0
  const dstart = (x, y) => { sy = y; sh = panel.getBoundingClientRect().height; lastY = y; lastT = performance.now(); vel = 0; panel.style.transition = 'none' }
  const dmove = (x, y) => {
    if (sy == null) return false
    const d = sy - y, hgt = sh + d
    panel.style.height = (hgt < sh * .3 ? sh * .3 : Math.min(vh() * .94, hgt)) + 'px'
    const now = performance.now(); vel = (lastY - y) / Math.max(1, now - lastT); lastY = y; lastT = now
    return true
  }
  const dend = () => {
    if (sy == null) return; sy = null; panel.style.transition = ''
    const f = panel.getBoundingClientRect().height / vh()
    if (vel < -0.6 || f < .3) return closeSheet()
    cur = vel > 0.6 ? snaps.full : (Math.abs(f - snaps.half) < Math.abs(f - snaps.full) ? snaps.half : snaps.full)
    setH(cur); haptic()
  }
  ;[grip, head].forEach(el => drag(el, { start: dstart, move: dmove, end: dend }))
  // keyboard
  sheetEl.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSheet()
    if (e.key === 'Tab') { const f = $$('button, a, input, [tabindex="0"]', panel).filter(x => !x.disabled); if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus() } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus() } }
  })
  haptic()
  return { panel, content, expand: () => setH(cur = snaps.full) }
}
export function closeSheet(instant = false) {
  if (!sheetEl) return
  const el = sheetEl; sheetEl = null
  lockScroll(false)
  el.__onClose?.()
  if (instant) { el.remove(); return }
  el.classList.remove('in'); el.classList.add('out')
  setTimeout(() => el.remove(), 420)
  lastFocus?.focus?.({ preventScroll: true })
}

// ───────────────── SKELETON ─────────────────
export function skeletonPage(kind = 'chapter') {
  const bar = (w, hgt = 14, extra = '') => h('i.sk' + extra, { style: { width: w, height: hgt + 'px' } })
  if (kind === 'home') return h('div.sk-page.wrap', { 'aria-hidden': 'true' },
    h('div.sk-row', h('div', { style: { flex: 1 } }, bar('30%', 26, '.pill'), bar('80%', 80), bar('60%', 80), bar('90%', 14), bar('70%', 14)), h('i.sk.circle', { style: { width: '360px', height: '360px' } })))
  const line = (side) => h('div.sk-line.' + side, h('i.sk.circle', { style: { width: '54px', height: '54px', flex: 'none' } }), h('div.sk-bub', bar('40%', 10), bar('95%'), bar('70%')))
  return h('div.sk-page.wrap', { 'aria-hidden': 'true' },
    bar('22%', 12), bar('55%', 72), bar('40%', 18),
    h('div.sk-row', { style: { gap: '10px', margin: '20px 0 50px' } }, ...[1, 2, 3, 4].map(() => bar('140px', 32, '.pill'))),
    h('div.sk-grid', h('div', ...Array.from({ length: 7 }, () => bar('80%', 12))),
      h('div', bar('50%', 34), line('s'), line('r'), line('s'), h('i.sk', { style: { width: '100%', height: '320px', borderRadius: '22px', marginTop: '20px' } }))))
}
export function skeletonLab() {
  return h('div.sk-lab', { 'aria-hidden': 'true' },
    h('div.sk-lab-canvas', h('i.sk', { style: { width: '100%', height: '100%', borderRadius: '14px' } }), h('div.sk-spark', h('i'), h('i'), h('i'))),
    h('div.sk-lab-side', ...[1, 2, 3].map(() => h('div', h('i.sk', { style: { width: '50%', height: '12px' } }), h('i.sk.pill', { style: { width: '100%', height: '14px' } }))), h('i.sk', { style: { width: '100%', height: '64px', borderRadius: '12px' } })))
}

// ───────────────── SWIPE ACTION ─────────────────
// swipeable(el, { left: {label, icon, color, fn}, right: {...} })  left = swipe to left reveals right-side action
export function swipeable(el, { left, right }) {
  el.classList.add('swipe-item')
  const inner = h('div.swipe-inner'); while (el.firstChild) inner.append(el.firstChild)
  const mk = (a, side) => a && h('div.swipe-bg.' + side, { style: { background: a.color } }, h('span.swipe-ic', a.icon), h('span.swipe-lb', a.label))
  const bgL = mk(right, 'l'), bgR = mk(left, 'r') // swipe right reveals left bg
  el.append(...[bgL, bgR].filter(Boolean), inner)
  const TH = 90
  let sx = null, sy = 0, dx = 0, lock = null, crossed = false
  const start = (x, y) => { sx = x; sy = y; dx = 0; lock = null; crossed = false; inner.style.transition = 'none' }
  const move = (x, y, e) => {
    if (sx == null) return
    const mx = x - sx, my = y - sy
    if (!lock) { if (Math.abs(mx) > 8 || Math.abs(my) > 8) lock = Math.abs(mx) > Math.abs(my) * 1.2 ? 'x' : 'y'; else return }
    if (lock !== 'x') { sx = null; inner.style.transition = ''; return }
    if (e.cancelable) e.preventDefault()
    dx = mx
    if ((dx > 0 && !right) || (dx < 0 && !left)) dx = dx / 6 // rubber band
    const over = Math.abs(dx) > TH
    if (over !== crossed) { crossed = over; haptic(over ? 12 : 4); el.classList.toggle('armed', over) }
    el.classList.toggle('dir-r', dx > 0); el.classList.toggle('dir-l', dx < 0)
    inner.style.transform = `translateX(${dx}px) rotate(${dx / 90}deg)`
    el.style.setProperty('--sp', Math.min(1, Math.abs(dx) / TH))
  }
  const end = () => {
    if (sx == null && lock !== 'x') { lock = null; return }
    sx = null
    inner.style.transition = ''
    if (lock === 'x' && Math.abs(dx) > TH) {
      const a = dx > 0 ? right : left
      inner.style.transform = `translateX(${dx > 0 ? 36 : -36}px)`
      setTimeout(() => { inner.style.transform = ''; a?.fn() }, 170)
    } else inner.style.transform = ''
    el.classList.remove('armed'); el.style.setProperty('--sp', 0)
    if (lock === 'x' && Math.abs(dx) > 8) { const stop = (ev) => { ev.stopPropagation(); ev.preventDefault() }; inner.addEventListener('click', stop, { capture: true, once: true }); setTimeout(() => inner.removeEventListener('click', stop, { capture: true }), 60) }
    lock = null
  }
  // touch (mobile) — passive:false so we can stop the page from scrolling sideways
  inner.addEventListener('touchstart', (e) => start(e.touches[0].clientX, e.touches[0].clientY), { passive: true })
  inner.addEventListener('touchmove', (e) => move(e.touches[0].clientX, e.touches[0].clientY, e), { passive: false })
  inner.addEventListener('touchend', end); inner.addEventListener('touchcancel', end)
  // mouse (desktop drag)
  inner.addEventListener('mousedown', (e) => { if (e.button) return; start(e.clientX, e.clientY)
    const mm = (ev) => move(ev.clientX, ev.clientY, ev), mu = () => { end(); removeEventListener('mousemove', mm); removeEventListener('mouseup', mu) }
    addEventListener('mousemove', mm); addEventListener('mouseup', mu) })
  return inner
}

// ───────────────── AUTO COMPLETE ─────────────────
// autocomplete(input, { source: q => items[], render: item => html, onPick: item => void, recent })
const norm = (s) => (s || '').toLowerCase().normalize('NFKC').replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60)).replace(/\s+/g, '')
export function score(q, text, alt = '') {
  const a = norm(text), b = norm(alt), n = norm(q)
  if (!n) return 0
  if (a === n) return 100
  if (a.startsWith(n)) return 80
  if (a.includes(n)) return 60
  if (b.split(/[ ,]/).some(w => w && norm(w).startsWith(n))) return 50
  if (b.includes(n)) return 40
  // subsequence fuzzy
  let i = 0; for (const c of a) if (c === n[i]) i++
  return i === n.length ? 20 : 0
}
export function highlight(text, q) {
  const n = norm(q); if (!n) return esc(text)
  const t = norm(text); const i = t.indexOf(n)
  // norm keeps length for most JP chars; fallback if mismatch
  if (i < 0 || t.length !== text.length) return esc(text)
  return esc(text.slice(0, i)) + '<mark>' + esc(text.slice(i, i + n.length)) + '</mark>' + esc(text.slice(i + n.length))
}
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

export function autocomplete(input, { source, render, onPick, empty, listId = 'ac-list' + Math.random().toString(36).slice(2, 7) }) {
  const list = h('ul.ac-list', { id: listId, role: 'listbox' })
  input.setAttribute('role', 'combobox'); input.setAttribute('aria-autocomplete', 'list'); input.setAttribute('aria-controls', listId); input.setAttribute('aria-expanded', 'false'); input.autocomplete = 'off'
  let items = [], idx = -1
  const paint = () => {
    const q = input.value.trim()
    items = source(q)
    list.innerHTML = ''
    if (!items.length) { list.append(h('li.ac-empty', { html: empty ? empty(q) : '見つかりませんでした' })) }
    items.forEach((it, i) => {
      if (it.group) { list.append(h('li.ac-group', { role: 'presentation' }, it.group)); return }
      const li = h('li.ac-item', { role: 'option', id: listId + '-' + i, 'aria-selected': 'false', html: render(it, q) })
      li.style.setProperty('--i', i)
      li.addEventListener('pointerdown', (e) => { e.preventDefault(); pick(it) })
      li.addEventListener('pointerenter', () => setIdx(i))
      list.append(li)
    })
    idx = -1; const first = items.findIndex(x => !x.group); if (first >= 0 && q) setIdx(first)
    input.setAttribute('aria-expanded', 'true')
  }
  const setIdx = (i) => {
    idx = i
    $$('.ac-item', list).forEach(li => { const on = li.id === listId + '-' + i; li.classList.toggle('on', on); li.setAttribute('aria-selected', on) })
    const cur = document.getElementById(listId + '-' + i); if (cur) { input.setAttribute('aria-activedescendant', cur.id); cur.scrollIntoView({ block: 'nearest' }) }
  }
  const step = (d) => { const sel = items.map((x, i) => x.group ? -1 : i).filter(i => i >= 0); if (!sel.length) return; let k = sel.indexOf(idx); k = (k + d + sel.length) % sel.length; setIdx(sel[k]) }
  const pick = (it) => { onPick(it); }
  input.addEventListener('input', paint)
  input.addEventListener('focus', paint)
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); step(1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1) }
    else if (e.key === 'Enter') { e.preventDefault(); if (idx >= 0 && items[idx]) pick(items[idx]) }
    else if (e.key === 'Tab' && idx >= 0 && items[idx]?.complete) { e.preventDefault(); input.value = items[idx].complete; paint() }
  })
  return { list, refresh: paint }
}

// ───────────────── PULL TO REFRESH ─────────────────
export function pullToRefresh(onRefresh) {
  if (!matchMedia('(pointer: coarse)').matches) return () => {}
  const ind = h('div#ptr', { 'aria-hidden': 'true' },
    h('div.ptr-ball', { html: `<svg viewBox="0 0 48 48" width="48" height="48"><circle cx="24" cy="24" r="18" fill="none" stroke="rgba(42,37,64,.15)" stroke-width="5"/><circle class="ptr-arc" cx="24" cy="24" r="18" fill="none" stroke="#FF8E6E" stroke-width="5" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 24 24)"/><g class="ptr-dots">${[0, 1, 2].map(i => `<circle cx="${15 + i * 9}" cy="24" r="3.2" fill="#2A2540"/>`).join('')}</g></svg>` }),
    h('div.ptr-label', '引っぱって更新'))
  document.body.append(ind)
  const MAX = 130, TH = 80
  let sy = null, d = 0, busy = false, armed = false
  const set = (v) => {
    d = v
    const p = Math.min(1, d / TH)
    ind.style.transform = `translate(-50%, ${Math.min(d, MAX) - 70}px)`
    ind.style.opacity = Math.min(1, d / 30)
    $('.ptr-arc', ind).style.strokeDashoffset = 1 - p
    $('.ptr-ball', ind).style.transform = `rotate(${d * 2.4}deg) scale(${.7 + .3 * p})`
    document.body.style.setProperty('--ptr', Math.min(d, MAX) * .5 + 'px')
    const a = d > TH
    if (a !== armed) { armed = a; haptic(a ? 14 : 4); $('.ptr-label', ind).textContent = a ? 'はなして更新！' : '引っぱって更新' ; ind.classList.toggle('armed', a) }
  }
  const start = (e) => { if (busy || scrollY > 0 || document.documentElement.classList.contains('sheet-open')) return; sy = e.touches[0].clientY }
  const move = (e) => {
    if (sy == null) return
    const raw = e.touches[0].clientY - sy
    if (raw <= 0) { if (d) set(0); return }
    if (scrollY > 0) { sy = null; return }
    e.preventDefault()
    set(MAX * (1 - Math.exp(-raw / 160))) // resistance curve
  }
  const end = async () => {
    if (sy == null) return; sy = null
    if (d > TH) {
      busy = true; ind.classList.add('loading'); $('.ptr-label', ind).textContent = '更新中…'
      ind.style.transition = 'transform .3s var(--spring)'; ind.style.transform = 'translate(-50%, 18px)'
      document.body.style.setProperty('--ptr', '40px')
      try { await Promise.all([onRefresh(), new Promise(r => setTimeout(r, 900))]) } catch {}
      ind.classList.remove('loading'); ind.classList.add('done'); $('.ptr-label', ind).textContent = '更新しました'
      await new Promise(r => setTimeout(r, 450))
    }
    ind.style.transition = 'transform .45s var(--ease), opacity .3s'
    ind.classList.remove('done', 'armed'); armed = false
    set(0); document.body.style.setProperty('--ptr', '0px')
    setTimeout(() => { ind.style.transition = '' }, 460)
    busy = false
  }
  addEventListener('touchstart', start, { passive: true })
  addEventListener('touchmove', move, { passive: false })
  addEventListener('touchend', end)
  return () => { removeEventListener('touchstart', start); removeEventListener('touchmove', move); removeEventListener('touchend', end); ind.remove() }
}
