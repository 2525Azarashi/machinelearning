import { h, rich } from './ui.js'

export function slider({ label, min = 0, max = 1, step = 0.01, value = 0.5, fmt = v => v, onInput }) {
  const out = h('output', fmt(value))
  const inp = h('input', { type: 'range', min, max, step, value, 'aria-label': label.replace(/<[^>]+>/g, '') })
  const paint = () => inp.style.setProperty('--p', ((inp.value - min) / (max - min)) * 100 + '%')
  inp.addEventListener('input', () => { const v = +inp.value; out.textContent = fmt(v); paint(); onInput?.(v) })
  paint()
  const el = h('div.ctl', h('label', h('span', { html: rich(label) }), out), inp)
  el.set = (v, fire = false) => { inp.value = v; out.textContent = fmt(+inp.value); paint(); if (fire) onInput?.(+inp.value) }
  el.get = () => +inp.value
  el.input = inp
  return el
}

export function seg({ label, options, value, onChange }) {
  const wrap = h('div.seg', { role: 'group', 'aria-label': label || '' })
  const btns = options.map(([v, t]) => {
    const b = h('button', { type: 'button', 'aria-pressed': v === value ? 'true' : 'false', onclick: () => set(v, true) }, t)
    b.dataset.v = v
    if (v === value) b.classList.add('on')
    wrap.append(b)
    return b
  })
  function set(v, fire) {
    btns.forEach(b => { const on = b.dataset.v == String(v); b.classList.toggle('on', on); b.setAttribute('aria-pressed', on) })
    if (fire) onChange?.(v)
  }
  const el = label ? h('div.ctl', h('label', h('span', label)), wrap) : wrap
  el.set = set
  return el
}

export function readout(items) {
  const el = h('div.readout')
  const refs = {}
  items.forEach(([k, label, full]) => {
    const v = h('div.v', '—')
    const box = h('div.ro' + (full ? '.full' : ''), h('div.k', { html: rich(label) }), v)
    refs[k] = { v, box }
    el.append(box)
  })
  el.set = (k, val, cls) => {
    const r = refs[k]; if (!r) return
    r.v.innerHTML = val
    if (cls !== undefined) { r.box.classList.remove('good', 'bad'); if (cls) r.box.classList.add(cls) }
  }
  return el
}

export function button(text, onclick, cls = 'ghost') {
  return h('button.btn.sm.' + cls, { type: 'button', onclick }, text)
}

export function meter(color) {
  const i = h('i', { style: { width: '0%', background: color || '' } })
  const el = h('div.meter', i)
  el.set = (p) => (i.style.width = Math.max(0, Math.min(100, p * 100)) + '%')
  return el
}

// standard 2-col layout
export function layout(body, { wide = false } = {}) {
  body.classList.toggle('wide', wide)
  const canvas = h('div.lab-canvas')
  const side = h('div.lab-side')
  body.append(canvas, side)
  return { canvas, side }
}

// animation loop that only runs while visible
export function visibleLoop(el, step) {
  let raf = 0, on = false, last = performance.now()
  const tick = (t) => { const dt = Math.min(0.05, (t - last) / 1000); last = t; step(dt, t); if (on) raf = requestAnimationFrame(tick) }
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !on) { on = true; last = performance.now(); raf = requestAnimationFrame(tick) }
    else if (!e.isIntersecting && on) { on = false; cancelAnimationFrame(raf) }
  })
  io.observe(el)
  return () => { on = false; cancelAnimationFrame(raf); io.disconnect() }
}

// tween helper for numeric state
export function tweenTo(obj, key, to, dur = 600, onUpdate) {
  const from = obj[key], t0 = performance.now()
  return new Promise(res => {
    const f = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3)
      obj[key] = from + (to - from) * e; onUpdate?.()
      k < 1 ? requestAnimationFrame(f) : res()
    }
    requestAnimationFrame(f)
  })
}
