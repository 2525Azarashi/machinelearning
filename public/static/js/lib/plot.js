// Minimal canvas plotting kit with DPR + resize handling
export const COL = {
  ink: '#2A2540', ink2: '#5B5575', ink3: '#8E88A6', paper: '#FFF7EC',
  coral: '#FF8E6E', coralD: '#F2694A', mint: '#6FD6B8', mintD: '#2FB58E',
  lav: '#B9A7FF', lavD: '#8B73F2', butter: '#FFD66B', sky: '#8CC8FF', skyD: '#3C8FE0', pink: '#FF9EAE',
}

export class Plot {
  constructor(host, { aspect = 0.62, minH = 240, maxH = 460, pad = [24, 20, 36, 46], x = [0, 1], y = [0, 1], onDraw } = {}) {
    this.host = host
    this.c = document.createElement('canvas')
    host.append(this.c)
    this.ctx = this.c.getContext('2d')
    this.aspect = aspect; this.minH = minH; this.maxH = maxH
    this.pad = pad // top right bottom left
    this.xr = x; this.yr = y
    this.onDraw = onDraw
    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(host)
    this.resize()
  }
  resize() {
    const w = this.host.clientWidth || 600
    const hgt = Math.max(this.minH, Math.min(this.maxH, w * this.aspect))
    this.host.style.height = hgt + 'px'
    const d = Math.min(2, devicePixelRatio || 1)
    this.c.width = w * d; this.c.height = hgt * d
    this.c.style.width = w + 'px'; this.c.style.height = hgt + 'px'
    this.W = w; this.H = hgt; this.d = d
    this.ctx.setTransform(d, 0, 0, d, 0, 0)
    this.draw()
  }
  get iw() { return this.W - this.pad[1] - this.pad[3] }
  get ih() { return this.H - this.pad[0] - this.pad[2] }
  X(v) { return this.pad[3] + (v - this.xr[0]) / (this.xr[1] - this.xr[0]) * this.iw }
  Y(v) { return this.pad[0] + (1 - (v - this.yr[0]) / (this.yr[1] - this.yr[0])) * this.ih }
  invX(px) { return this.xr[0] + (px - this.pad[3]) / this.iw * (this.xr[1] - this.xr[0]) }
  invY(py) { return this.yr[0] + (1 - (py - this.pad[0]) / this.ih) * (this.yr[1] - this.yr[0]) }
  clear() { this.ctx.clearRect(0, 0, this.W, this.H) }
  draw() { if (this.onDraw) { this.clear(); this.onDraw(this.ctx, this) } }
  destroy() { this.ro.disconnect() }

  axes({ xt = 5, yt = 4, xl = '', yl = '', grid = true, fmtX = v => +v.toFixed(2), fmtY = v => +v.toFixed(1) } = {}) {
    const g = this.ctx
    g.save()
    g.font = '600 11px "DM Mono", monospace'
    g.fillStyle = COL.ink3; g.strokeStyle = 'rgba(42,37,64,.09)'; g.lineWidth = 1
    for (let i = 0; i <= xt; i++) {
      const v = this.xr[0] + (this.xr[1] - this.xr[0]) * i / xt, px = this.X(v)
      if (grid) { g.beginPath(); g.moveTo(px, this.pad[0]); g.lineTo(px, this.pad[0] + this.ih); g.stroke() }
      g.textAlign = 'center'; g.fillText(fmtX(v), px, this.pad[0] + this.ih + 16)
    }
    for (let i = 0; i <= yt; i++) {
      const v = this.yr[0] + (this.yr[1] - this.yr[0]) * i / yt, py = this.Y(v)
      if (grid) { g.beginPath(); g.moveTo(this.pad[3], py); g.lineTo(this.pad[3] + this.iw, py); g.stroke() }
      g.textAlign = 'right'; g.fillText(fmtY(v), this.pad[3] - 7, py + 4)
    }
    g.strokeStyle = COL.ink; g.lineWidth = 2.5; g.lineCap = 'round'
    g.beginPath(); g.moveTo(this.pad[3], this.pad[0]); g.lineTo(this.pad[3], this.pad[0] + this.ih); g.lineTo(this.pad[3] + this.iw, this.pad[0] + this.ih); g.stroke()
    g.font = '700 12px "Zen Maru Gothic", sans-serif'; g.fillStyle = COL.ink2
    if (xl) { g.textAlign = 'right'; g.fillText(xl, this.pad[3] + this.iw, this.pad[0] + this.ih + 31) }
    if (yl) { g.textAlign = 'left'; g.fillText(yl, this.pad[3] + 6, this.pad[0] + 12) }
    g.restore()
  }
  fn(f, { color = COL.coral, width = 3.5, dash = null, n = 240, x0 = this.xr[0], x1 = this.xr[1], clip = true } = {}) {
    const g = this.ctx
    g.save()
    if (clip) { g.beginPath(); g.rect(this.pad[3], this.pad[0] - 2, this.iw, this.ih + 4); g.clip() }
    g.strokeStyle = color; g.lineWidth = width; g.lineJoin = 'round'; g.lineCap = 'round'
    if (dash) g.setLineDash(dash)
    g.beginPath()
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n, y = f(x)
      const px = this.X(x), py = this.Y(Math.max(this.yr[0] - 50, Math.min(this.yr[1] + 50, y)))
      i ? g.lineTo(px, py) : g.moveTo(px, py)
    }
    g.stroke(); g.restore()
  }
  area(f, { x0 = this.xr[0], x1 = this.xr[1], color = 'rgba(255,142,110,.3)', base = 0, n = 160 } = {}) {
    const g = this.ctx
    g.save(); g.fillStyle = color; g.beginPath(); g.moveTo(this.X(x0), this.Y(base))
    for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; g.lineTo(this.X(x), this.Y(f(x))) }
    g.lineTo(this.X(x1), this.Y(base)); g.closePath(); g.fill(); g.restore()
  }
  dot(x, y, { r = 6.5, fill = COL.mint, stroke = COL.ink, lw = 2.5 } = {}) {
    const g = this.ctx
    g.beginPath(); g.arc(this.X(x), this.Y(y), r, 0, Math.PI * 2)
    g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = stroke; g.stroke()
  }
  label(text, px, py, { color = COL.ink, bg = '#fff', align = 'center', font = '700 12px "Zen Maru Gothic", sans-serif' } = {}) {
    const g = this.ctx
    g.save(); g.font = font
    const w = g.measureText(text).width + 14, hh = 22
    let x = align === 'center' ? px - w / 2 : align === 'right' ? px - w : px
    x = Math.max(2, Math.min(this.W - w - 2, x))
    g.fillStyle = bg; g.strokeStyle = COL.ink; g.lineWidth = 2
    rr(g, x, py - hh / 2, w, hh, 11); g.fill(); g.stroke()
    g.fillStyle = color; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, x + 7, py + 1)
    g.restore()
  }
  vline(x, { color = COL.ink, dash = [6, 6], width = 2 } = {}) {
    const g = this.ctx; g.save(); g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash)
    g.beginPath(); g.moveTo(this.X(x), this.pad[0]); g.lineTo(this.X(x), this.pad[0] + this.ih); g.stroke(); g.restore()
  }
  // pointer helpers: returns data coords
  pointer(handlers) {
    const pos = (e) => { const r = this.c.getBoundingClientRect(); return { px: e.clientX - r.left, py: e.clientY - r.top, x: this.invX(e.clientX - r.left), y: this.invY(e.clientY - r.top) } }
    let down = false
    this.c.addEventListener('pointerdown', (e) => { down = true; this.c.setPointerCapture(e.pointerId); handlers.down?.(pos(e), e) })
    this.c.addEventListener('pointermove', (e) => { const p = pos(e); down ? handlers.drag?.(p, e) : handlers.hover?.(p, e) })
    const up = (e) => { if (down) { down = false; handlers.up?.(pos(e), e) } }
    this.c.addEventListener('pointerup', up); this.c.addEventListener('pointercancel', up)
    this.c.addEventListener('pointerleave', () => handlers.leave?.())
  }
}
export function rr(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath()
}

// ───────── math utils ─────────
export function mulberry(seed = 1) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 } }
export function randn(rng = Math.random) { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) }
export const gauss = (x, m, s) => Math.exp(-((x - m) ** 2) / (2 * s * s)) / (Math.sqrt(2 * Math.PI) * s)
export function lgamma(x) { // Lanczos
  const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5]
  let y = x, t = x + 5.5; t -= (x + 0.5) * Math.log(t); let s = 1.000000000190015
  for (const k of c) s += k / ++y
  return -t + Math.log(2.5066282746310005 * s / x)
}
export const betaPdf = (x, a, b) => (x <= 0 || x >= 1) ? 0 : Math.exp((a - 1) * Math.log(x) + (b - 1) * Math.log(1 - x) - (lgamma(a) + lgamma(b) - lgamma(a + b)))
export function erf(x) { const t = 1 / (1 + 0.3275911 * Math.abs(x)); const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return x >= 0 ? y : -y }
export const Phi = (x, m = 0, s = 1) => 0.5 * (1 + erf((x - m) / (s * Math.SQRT2)))

// solve linear system (Gaussian elimination with partial pivot)
export function solve(A, b) {
  const n = b.length, M = A.map((r, i) => [...r, b[i]])
  for (let i = 0; i < n; i++) {
    let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(M[k][i]) > Math.abs(M[p][i])) p = k
    ;[M[i], M[p]] = [M[p], M[i]]
    const d = M[i][i] || 1e-12
    for (let k = i + 1; k < n; k++) { const f = M[k][i] / d; for (let j = i; j <= n; j++) M[k][j] -= f * M[i][j] }
  }
  const x = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) { let s = M[i][n]; for (let j = i + 1; j < n; j++) s -= M[i][j] * x[j]; x[i] = s / (M[i][i] || 1e-12) }
  return x
}
// polynomial least squares with ridge λ  (E = 1/2 Σ(y-t)^2 + λ/2 ||w||^2)
// numerically stable: map x∈[0,1] → u=2x-1 and solve the augmented system by Householder QR
export function polyfit(xs, ts, M, lambda = 0) {
  const n = M + 1
  if (xs.length < n && lambda <= 0) lambda = 1e-9
  const rows = xs.map(x => { const u = 2 * x - 1; return Array.from({ length: n }, (_, i) => u ** i) })
  const b = [...ts]
  if (lambda > 0) { const s = Math.sqrt(lambda); for (let i = 0; i < n; i++) { const r = Array(n).fill(0); r[i] = s; rows.push(r); b.push(0) } }
  const A = rows.map(r => [...r]), m = A.length
  for (let k = 0; k < Math.min(n, m); k++) {
    let norm = 0; for (let i = k; i < m; i++) norm += A[i][k] ** 2
    norm = Math.sqrt(norm); if (norm < 1e-300) continue
    const alpha = A[k][k] > 0 ? -norm : norm
    const v = Array(m).fill(0); for (let i = k; i < m; i++) v[i] = A[i][k]; v[k] -= alpha
    let vv = 0; for (let i = k; i < m; i++) vv += v[i] ** 2
    if (vv < 1e-300) continue
    for (let j = k; j < n; j++) { let d = 0; for (let i = k; i < m; i++) d += v[i] * A[i][j]; d = 2 * d / vv; for (let i = k; i < m; i++) A[i][j] -= d * v[i] }
    let d = 0; for (let i = k; i < m; i++) d += v[i] * b[i]; d = 2 * d / vv; for (let i = k; i < m; i++) b[i] -= d * v[i]
  }
  const w = Array(n).fill(0)
  for (let i = n - 1; i >= 0; i--) { let s2 = b[i]; for (let j = i + 1; j < n; j++) s2 -= A[i][j] * w[j]; w[i] = Math.abs(A[i][i]) > 1e-12 ? s2 / A[i][i] : 0 }
  w.u = true
  return w
}
export const polyval = (w, x) => { const z = w.u ? 2 * x - 1 : x; let s = 0; for (let i = w.length - 1; i >= 0; i--) s = s * z + w[i]; return s }
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v))
