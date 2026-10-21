// ───────── tiny DOM helpers ─────────
export const $ = (s, r = document) => r.querySelector(s)
export const $$ = (s, r = document) => [...r.querySelectorAll(s)]
export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches

// h('div.a.b#id', {attrs}, ...children)
export function h(tag, ...rest) {
  let attrs = {}
  if (rest.length && rest[0] && typeof rest[0] === 'object' && !(rest[0] instanceof Node) && !Array.isArray(rest[0])) attrs = rest.shift()
  const m = tag.match(/^([a-z0-9-]+)?((?:[.#][\w-]+)*)$/i)
  const el = document.createElement(m[1] || 'div')
  ;(m[2].match(/[.#][\w-]+/g) || []).forEach(p => p[0] === '.' ? el.classList.add(p.slice(1)) : (el.id = p.slice(1)))
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue
    if (k === 'html') el.innerHTML = v
    else if (k === 'style' && typeof v === 'object') { for (const [sk, sv] of Object.entries(v)) sk.startsWith('--') ? el.style.setProperty(sk, sv) : (el.style[sk] = sv) }
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v)
    else if (k === 'dataset') Object.assign(el.dataset, v)
    else el.setAttribute(k, v === true ? '' : v)
  }
  add(el, rest)
  return el
}
function add(el, kids) {
  for (const c of kids.flat(Infinity)) {
    if (c == null || c === false) continue
    el.append(c instanceof Node ? c : document.createTextNode(String(c)))
  }
}

// inline rich text: $...$ → KaTeX, **b** → <b>, ==mark== → highlighter
export function rich(str) {
  if (!str) return ''
  let s = String(str)
  const maths = []
  s = s.replace(/\$\$([^$]+)\$\$/g, (_, m) => { maths.push([m, true]); return `\u0000${maths.length - 1}\u0000` })
  s = s.replace(/\$([^$]+)\$/g, (_, m) => { maths.push([m, false]); return `\u0000${maths.length - 1}\u0000` })
  s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
  s = s.replace(/==(.+?)==/g, '<mark class="hl">$1</mark>')
  s = s.replace(/\{(coral|mint|lav|butter|sky)\|(.+?)\}/g, '<span class="c-$1">$2</span>')
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => tex(maths[i][0], maths[i][1]))
  return s
}
export function tex(src, display = false) {
  try { return window.katex ? katex.renderToString(src, { displayMode: display, throwOnError: false, strict: false, trust: (c) => c.command === '\\htmlClass' }) : src }
  catch { return src }
}

// split text into spans for kinetic typography
export function splitChars(el, cls = 'ch') {
  const text = el.textContent
  el.textContent = ''
  el.setAttribute('aria-label', text)
  const out = []
  for (const c of [...text]) {
    const s = document.createElement('span')
    s.className = cls
    s.setAttribute('aria-hidden', 'true')
    s.textContent = c === ' ' ? '\u00a0' : c
    el.append(s); out.push(s)
  }
  return out
}

// ───────── Characters ─────────
export const CAST = {
  S: { name: 'サカイ', role: '先輩', en: 'SAKAI', cls: 's' },
  R: { name: 'リョウガ', role: 'くん', en: 'RYOGA', cls: 'r' },
}

// cute SVG avatars. mood: normal | happy | think | wow | wink
export function avatar(who = 'S', mood = 'normal') {
  const ink = '#2A2540'
  const eyes = {
    normal: `<circle cx="39" cy="53" r="4.2" fill="${ink}"/><circle cx="61" cy="53" r="4.2" fill="${ink}"/><circle cx="40.4" cy="51.6" r="1.4" fill="#fff"/><circle cx="62.4" cy="51.6" r="1.4" fill="#fff"/>`,
    happy: `<path d="M34 54 q5 -6 10 0" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M56 54 q5 -6 10 0" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
    think: `<circle cx="40" cy="52" r="4" fill="${ink}"/><circle cx="62" cy="52" r="4" fill="${ink}"/><path d="M33 44 l10 -2" stroke="${ink}" stroke-width="3" stroke-linecap="round"/><path d="M57 42 l10 2" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    wow: `<circle cx="39" cy="53" r="5.4" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="61" cy="53" r="5.4" fill="#fff" stroke="${ink}" stroke-width="3"/><circle cx="39" cy="53" r="2.2" fill="${ink}"/><circle cx="61" cy="53" r="2.2" fill="${ink}"/>`,
    wink: `<circle cx="39" cy="53" r="4.2" fill="${ink}"/><path d="M56 54 q5 -6 10 0" stroke="${ink}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`,
  }[mood] || ''
  const mouth = {
    normal: `<path d="M45 66 q5 4 10 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    happy: `<path d="M42 63 q8 11 16 0 z" fill="${ink}"/><path d="M46 67 q4 3 8 0" fill="#FF8E9E"/>`,
    think: `<path d="M45 67 h9" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`,
    wow: `<ellipse cx="50" cy="67" rx="4.5" ry="5.5" fill="${ink}"/>`,
    wink: `<path d="M43 64 q7 8 14 0" stroke="${ink}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
  }[mood] || ''
  if (who === 'S') {
    // サカイ先輩: ボブヘア + まるメガネ + コーラルのカーディガン
    return `<svg viewBox="0 0 100 100" class="av-svg" aria-hidden="true">
      <path d="M14 100 q4 -22 36 -22 q32 0 36 22 z" fill="#FF8E6E" stroke="${ink}" stroke-width="3"/>
      <path d="M42 80 l8 10 l8 -10" fill="#fff" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
      <path d="M20 58 q-4 -40 30 -40 q34 0 30 40 q0 14 -6 18 l-4 -24 h-40 l-4 24 q-6 -4 -6 -18 z" fill="${ink}"/>
      <ellipse cx="50" cy="55" rx="25" ry="24" fill="#FFE3CF" stroke="${ink}" stroke-width="3"/>
      <path d="M25 50 q4 -24 25 -24 q21 0 25 24 q-14 -12 -30 -12 q-12 0 -20 12 z" fill="${ink}"/>
      <circle cx="31" cy="62" r="5" fill="#FF9EAE" opacity=".55"/><circle cx="69" cy="62" r="5" fill="#FF9EAE" opacity=".55"/>
      ${eyes}${mouth}
      <circle cx="39" cy="53" r="9" fill="none" stroke="${ink}" stroke-width="2.6"/><circle cx="61" cy="53" r="9" fill="none" stroke="${ink}" stroke-width="2.6"/><path d="M48 53 h4" stroke="${ink}" stroke-width="2.6"/>
      <circle cx="74" cy="26" r="6" fill="#FFD66B" stroke="${ink}" stroke-width="2.6"/>
    </svg>`
  }
  // リョウガくん: つんつん髪 + ミントのパーカー
  return `<svg viewBox="0 0 100 100" class="av-svg" aria-hidden="true">
    <path d="M14 100 q4 -22 36 -22 q32 0 36 22 z" fill="#6FD6B8" stroke="${ink}" stroke-width="3"/>
    <path d="M38 80 q12 10 24 0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="44" cy="90" r="2" fill="${ink}"/><circle cx="56" cy="90" r="2" fill="${ink}"/>
    <ellipse cx="50" cy="56" rx="24" ry="23" fill="#FFE6D2" stroke="${ink}" stroke-width="3"/>
    <path d="M24 52 l2 -14 l-8 -4 l12 -4 l-2 -10 l12 6 l6 -12 l6 10 l10 -8 l0 12 l12 -2 l-6 10 l8 6 l-6 4 q-8 -10 -24 -10 q-16 0 -22 16 z" fill="#4A3B6B" stroke="${ink}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="31" cy="63" r="5" fill="#FF9EAE" opacity=".55"/><circle cx="69" cy="63" r="5" fill="#FF9EAE" opacity=".55"/>
    <g transform="translate(0,1)">${eyes}${mouth}</g>
  </svg>`
}

// mascot: まるっとニューロン
export function mascot(cls = '') {
  return `<svg viewBox="0 0 120 120" class="mascot ${cls}" aria-hidden="true">
    <g class="m-legs" stroke="#2A2540" stroke-width="4" stroke-linecap="round" fill="none">
      <path d="M22 60 q-14 -4 -16 -18"/><path d="M98 60 q14 -4 16 -18"/><path d="M40 98 q-4 12 -14 16"/><path d="M80 98 q4 12 14 16"/>
    </g>
    <circle cx="6" cy="40" r="6" fill="#B9A7FF" stroke="#2A2540" stroke-width="3"/><circle cx="114" cy="40" r="6" fill="#FFD66B" stroke="#2A2540" stroke-width="3"/>
    <circle cx="25" cy="115" r="5" fill="#6FD6B8" stroke="#2A2540" stroke-width="3"/><circle cx="95" cy="115" r="5" fill="#8CC8FF" stroke="#2A2540" stroke-width="3"/>
    <circle class="m-body" cx="60" cy="64" r="40" fill="#FF8E6E" stroke="#2A2540" stroke-width="4"/>
    <ellipse cx="46" cy="44" rx="10" ry="6" fill="#fff" opacity=".45" transform="rotate(-25 46 44)"/>
    <g class="m-eyes"><circle cx="47" cy="62" r="5.5" fill="#2A2540"/><circle cx="73" cy="62" r="5.5" fill="#2A2540"/><circle cx="49" cy="60" r="1.8" fill="#fff"/><circle cx="75" cy="60" r="1.8" fill="#fff"/></g>
    <circle cx="38" cy="74" r="6" fill="#FF5E7A" opacity=".35"/><circle cx="82" cy="74" r="6" fill="#FF5E7A" opacity=".35"/>
    <path d="M52 76 q8 8 16 0" stroke="#2A2540" stroke-width="4" fill="none" stroke-linecap="round"/>
  </svg>`
}

// ───────── animation helpers ─────────
export function onVisible(el, fn, opts = { threshold: 0.25 }) {
  const io = new IntersectionObserver((ents) => {
    ents.forEach(e => { if (e.isIntersecting) { fn(e.target); io.unobserve(e.target) } })
  }, opts)
  io.observe(el)
  return () => io.disconnect()
}

export function countUp(el, to, { dur = 1.2, dec = 0, suffix = '' } = {}) {
  if (reduced || !window.gsap) { el.textContent = to.toFixed(dec) + suffix; return }
  const o = { v: 0 }
  gsap.to(o, { v: to, duration: dur, ease: 'power3.out', onUpdate: () => (el.textContent = o.v.toFixed(dec) + suffix) })
}

// toast は patterns.js の高機能版を使う（循環参照を避けるため遅延呼び出し）
export function toast(msg, opt) { return import('./patterns.js').then(m => m.toast(msg, opt)) }

// confetti burst (for correct answers)
export function confetti(x, y, n = 26) {
  if (reduced) return
  const colors = ['#FF8E6E', '#6FD6B8', '#B9A7FF', '#FFD66B', '#8CC8FF', '#FF9EAE']
  for (let i = 0; i < n; i++) {
    const p = h('i.confetti', { style: { left: x + 'px', top: y + 'px', background: colors[i % colors.length], borderRadius: i % 3 ? '50%' : '3px' } })
    document.body.append(p)
    const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 120
    p.animate([
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 60}px)) rotate(${Math.random() * 540}deg) scale(.4)`, opacity: 0 },
    ], { duration: 900 + Math.random() * 500, easing: 'cubic-bezier(.2,.7,.3,1)' }).onfinish = () => p.remove()
  }
}

// magnetic hover
export function magnetic(el, strength = 0.3) {
  if (reduced || matchMedia('(hover: none)').matches) return
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    const x = (e.clientX - r.left - r.width / 2) * strength
    const y = (e.clientY - r.top - r.height / 2) * strength
    el.style.transform = `translate(${x}px, ${y}px)`
  })
  el.addEventListener('pointerleave', () => (el.style.transform = ''))
}

// tilt on hover
export function tilt(el, max = 8) {
  if (reduced || matchMedia('(hover: none)').matches) return
  el.addEventListener('pointermove', (e) => {
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width - 0.5
    const py = (e.clientY - r.top) / r.height - 0.5
    el.style.transform = `perspective(800px) rotateY(${px * max}deg) rotateX(${-py * max}deg) translateY(-4px)`
    el.style.setProperty('--mx', (px + 0.5) * 100 + '%')
    el.style.setProperty('--my', (py + 0.5) * 100 + '%')
  })
  el.addEventListener('pointerleave', () => (el.style.transform = ''))
}

// progress store
const KEY = 'marutto-ml-progress-v1'
export const store = {
  get() { try { return JSON.parse(localStorage.getItem(KEY)) || {} } catch { return {} } },
  set(o) { localStorage.setItem(KEY, JSON.stringify(o)) },
  mark(ch, key, v = true) { const s = this.get(); s[ch] = s[ch] || {}; s[ch][key] = v; this.set(s) },
}
