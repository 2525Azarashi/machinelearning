import { h, rich, toast, reduced } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, gauss, clamp, rr } from '../lib/plot.js'
import { slider, seg, readout, button, layout, visibleLoop, tweenTo } from '../lib/labkit.js'

const frac = (v) => v.toFixed(3)

// ═════════ ツボ：同時・周辺・条件つき・ベイズ（モザイク図） ═════════
export function urn(body) {
  const { canvas, side } = layout(body)
  let p1 = 0.4, w1 = 6 / 8, w2 = 1 / 4, obs = 'none' // none | w | b
  const st = { k: 0 } // animation for conditioning
  const plot = new Plot(canvas, { aspect: .66, pad: [40, 16, 40, 16], onDraw: (g, P) => {
    const X0 = P.pad[3], Y0 = P.pad[0], W = P.iw, H = P.ih
    const cells = [
      { v: 1, b: 'w', x: 0, y: 0, w: p1, h: w1, c: '#fff' },
      { v: 1, b: 'b', x: 0, y: w1, w: p1, h: 1 - w1, c: COL.ink },
      { v: 2, b: 'w', x: p1, y: 0, w: 1 - p1, h: w2, c: '#fff' },
      { v: 2, b: 'b', x: p1, y: w2, w: 1 - p1, h: 1 - w2, c: COL.ink },
    ]
    cells.forEach(c => {
      const dim = obs !== 'none' && c.b !== obs
      const alpha = dim ? 1 - .82 * st.k : 1
      g.globalAlpha = alpha
      g.fillStyle = c.v === 1 ? (c.b === 'w' ? '#FFE3D6' : COL.coral) : (c.b === 'w' ? '#D7F5EC' : COL.mint)
      g.strokeStyle = COL.ink; g.lineWidth = 3
      const x = X0 + c.x * W + 3, y = Y0 + c.y * H + 3, w = c.w * W - 6, hh = c.h * H - 6
      if (w > 4 && hh > 4) {
        rr(g, x, y, w, hh, 12); g.fill(); g.stroke()
        // balls pattern
        const n = Math.max(1, Math.round(c.w * c.h * 40))
        const r = mulberry(c.v * 10 + (c.b === 'w' ? 1 : 2))
        for (let i = 0; i < n; i++) {
          const bx = x + 10 + r() * (w - 20), by = y + 10 + r() * (hh - 20)
          if (w < 22 || hh < 22) break
          g.beginPath(); g.arc(bx, by, 5, 0, 7); g.fillStyle = c.b === 'w' ? '#fff' : COL.ink; g.fill(); g.lineWidth = 1.6; g.strokeStyle = COL.ink; g.stroke()
        }
        const pj = c.w * c.h
        if (w > 60 && hh > 30) P.label(`P(V=${c.v}, B=${c.b}) = ${frac(pj)}`, x + w / 2, y + hh / 2, { bg: COL.butter })
      }
      g.globalAlpha = 1
    })
    // top labels
    g.font = '900 13px "Zen Maru Gothic"'; g.fillStyle = COL.ink; g.textAlign = 'center'
    g.fillText(`ツボ1  P(V=1)=${p1.toFixed(2)}`, X0 + p1 * W / 2, Y0 - 14)
    g.fillText(`ツボ2  P(V=2)=${(1 - p1).toFixed(2)}`, X0 + (p1 + (1 - p1) / 2) * W, Y0 - 14)
    if (obs !== 'none') {
      const pb = obs === 'w' ? p1 * w1 + (1 - p1) * w2 : p1 * (1 - w1) + (1 - p1) * (1 - w2)
      const post1 = (obs === 'w' ? p1 * w1 : p1 * (1 - w1)) / pb
      g.globalAlpha = st.k
      g.fillText(`${obs === 'w' ? '白' : '黒'}玉が出た世界だけ残すと…  ツボ1 の面積の割合 = ${post1.toFixed(3)}`, P.W / 2, P.H - 12)
      g.globalAlpha = 1
    } else {
      g.fillStyle = COL.ink2; g.font = '700 12px "Zen Maru Gothic"'
      g.fillText('横幅 = ツボを選ぶ確率 ／ 縦の比 = ツボの中の玉の割合 ／ 面積 = 同時確率', P.W / 2, P.H - 12)
    }
  } })
  const ro = readout([['pw', '周辺 $P(B=w)$'], ['pb', '周辺 $P(B=b)$'], ['post', '事後 $P(V=1\\mid B)$', true]])
  function update() {
    const pw = p1 * w1 + (1 - p1) * w2
    ro.set('pw', frac(pw)); ro.set('pb', frac(1 - pw))
    if (obs === 'none') ro.set('post', '<small style="font-family:var(--fj)">玉の色を観測してみて →</small>')
    else {
      const pb = obs === 'w' ? pw : 1 - pw
      const num = obs === 'w' ? p1 * w1 : p1 * (1 - w1)
      ro.set('post', `${frac(num)} / ${frac(pb)} = <b>${frac(num / pb)}</b>`, 'good')
    }
    plot.draw()
  }
  const go = (o) => { obs = o; st.k = 0; tweenTo(st, 'k', 1, 700, () => plot.draw()); update() }
  side.append(
    slider({ label: 'ツボ1を選ぶ確率 $P(V{=}1)$', min: .05, max: .95, step: .01, value: p1, fmt: v => v.toFixed(2), onInput: v => { p1 = v; update() } }),
    slider({ label: 'ツボ1の白の割合', min: .05, max: .95, step: .01, value: w1, fmt: v => v.toFixed(2), onInput: v => { w1 = v; update() } }),
    slider({ label: 'ツボ2の白の割合', min: .05, max: .95, step: .01, value: w2, fmt: v => v.toFixed(2), onInput: v => { w2 = v; update() } }),
    h('div.btn-row', button('⚫ 黒が出た', () => go('b'), 'lav'), button('⚪ 白が出た', () => go('w'), 'ghost'), button('↺', () => go('none'))),
    ro)
  update()
}

// ═════════ 1次元ガウス分布 ═════════
export function gauss1d(body) {
  const { canvas, side } = layout(body)
  let mu = 0, s = 1, a = -1, b = 1
  const plot = new Plot(canvas, { aspect: .58, x: [-5, 5], y: [0, .85], onDraw: (g, P) => {
    P.axes({ xt: 10, yt: 4, xl: 'x', yl: 'p(x)', fmtX: v => Math.round(v) })
    P.area(x => gauss(x, mu, s), { x0: Math.max(-5, a), x1: Math.min(5, b), color: 'rgba(255,214,107,.75)' })
    // σ bands
    ;[1, 2].forEach(k => { P.vline(mu - k * s, { color: COL.ink3, dash: [3, 5], width: 1.5 }); P.vline(mu + k * s, { color: COL.ink3, dash: [3, 5], width: 1.5 }) })
    P.fn(x => gauss(x, 0, 1), { color: COL.ink3, width: 2, dash: [6, 6] })
    P.fn(x => gauss(x, mu, s), { color: COL.coral, width: 4.5, n: 400 })
    P.vline(mu, { color: COL.coralD, dash: [], width: 2.5 })
    P.label(`μ = ${mu.toFixed(1)}`, P.X(mu), P.pad[0] + 10, { bg: COL.coral })
    if (mu + s < 5) P.label('σ', P.X(mu + s), P.Y(gauss(mu + s, mu, s)) - 16, { bg: '#fff' })
  } })
  const ro = readout([['pr', '黄色の面積 $P(a<x<b)$', true], ['pk', '山の高さ $1/\\sqrt{2\\pi}\\sigma$']])
  const Phi = (x) => { const t = 1 / (1 + .3275911 * Math.abs(x) / Math.SQRT2), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x / 2); return .5 * (1 + (x >= 0 ? y : -y)) }
  function update() {
    ro.set('pr', ((Phi((b - mu) / s) - Phi((a - mu) / s))).toFixed(4))
    ro.set('pk', (1 / (Math.sqrt(2 * Math.PI) * s)).toFixed(3))
    plot.draw()
  }
  side.append(
    slider({ label: '平均 $\\mu$', min: -3, max: 3, step: .1, value: mu, fmt: v => v.toFixed(1), onInput: v => { mu = v; update() } }),
    slider({ label: '標準偏差 $\\sigma$', min: .4, max: 2.5, step: .05, value: s, fmt: v => v.toFixed(2), onInput: v => { s = v; update() } }),
    slider({ label: '区間の左端 $a$', min: -5, max: 5, step: .1, value: a, fmt: v => v.toFixed(1), onInput: v => { a = Math.min(v, b); update() } }),
    slider({ label: '区間の右端 $b$', min: -5, max: 5, step: .1, value: b, fmt: v => v.toFixed(1), onInput: v => { b = Math.max(v, a); update() } }),
    ro, h('div.lab-hint', { html: '$\\sigma$ を大きくすると山が<b>低く広く</b>なる。全体の面積はいつでも 1。$\\mu\\pm\\sigma$ に約 68%、$\\mu\\pm2\\sigma$ に約 95%。' }))
  update()
}

// ═════════ 2次元ガウス分布 ═════════
export function gauss2d(body) {
  const { canvas, side } = layout(body)
  let sx = 1, sy = 1, rho = 0
  let samples = []
  const resample = () => { const r = mulberry(17); samples = Array.from({ length: 220 }, () => [randn(r), randn(r)]) }
  resample()
  const plot = new Plot(canvas, { aspect: .72, x: [-3.6, 3.6], y: [-3, 3], pad: [14, 14, 30, 34], onDraw: (g, P) => {
    P.axes({ xt: 6, yt: 6, xl: 'x₁', yl: 'x₂', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    // Cholesky transform of standard normal samples
    const L11 = sx, L21 = rho * sy, L22 = sy * Math.sqrt(1 - rho * rho)
    samples.forEach(([u, v]) => { const x = L11 * u, y = L21 * u + L22 * v; if (Math.abs(x) < 3.6 && Math.abs(y) < 3) P.dot(x, y, { r: 3.2, fill: COL.lav, lw: 1.2 }) })
    // contour ellipses (1,2σ)
    const cov = [[sx * sx, rho * sx * sy], [rho * sx * sy, sy * sy]]
    const tr = cov[0][0] + cov[1][1], det = cov[0][0] * cov[1][1] - cov[0][1] ** 2
    const l1 = tr / 2 + Math.sqrt(tr * tr / 4 - det), l2 = tr / 2 - Math.sqrt(tr * tr / 4 - det)
    const ang = Math.abs(cov[0][1]) < 1e-9 ? (cov[0][0] >= cov[1][1] ? 0 : Math.PI / 2) : Math.atan2(l1 - cov[0][0], cov[0][1])
    ;[1, 2].forEach((k, i) => {
      g.save(); g.translate(P.X(0), P.Y(0)); g.rotate(-ang)
      g.scale((P.X(1) - P.X(0)), (P.Y(0) - P.Y(1)))
      g.beginPath(); g.ellipse(0, 0, k * Math.sqrt(l1), k * Math.sqrt(Math.max(l2, 1e-6)), 0, 0, Math.PI * 2)
      g.restore(); g.strokeStyle = i ? COL.coral : COL.coralD; g.lineWidth = i ? 2.5 : 4; g.setLineDash(i ? [7, 6] : []); g.stroke(); g.setLineDash([])
    })
    // principal axis
    g.save(); g.strokeStyle = COL.ink; g.lineWidth = 2; g.translate(P.X(0), P.Y(0)); g.rotate(-ang)
    const ax = 2 * Math.sqrt(l1) * (P.X(1) - P.X(0)); g.beginPath(); g.moveTo(-ax, 0); g.lineTo(ax, 0); g.stroke(); g.restore()
  } })
  const mat = h('div.formula', { style: { margin: 0, boxShadow: 'none' } }, h('div.f-body', { style: { padding: '12px 8px' } }))
  function update() {
    mat.firstChild.innerHTML = rich(`$$\\Sigma=\\begin{pmatrix}${(sx * sx).toFixed(2)} & ${(rho * sx * sy).toFixed(2)}\\\\ ${(rho * sx * sy).toFixed(2)} & ${(sy * sy).toFixed(2)}\\end{pmatrix}$$`)
    plot.draw()
  }
  side.append(
    slider({ label: '$x_1$ 方向の標準偏差 $\\sigma_1$', min: .3, max: 1.8, step: .05, value: sx, fmt: v => v.toFixed(2), onInput: v => { sx = v; update() } }),
    slider({ label: '$x_2$ 方向の標準偏差 $\\sigma_2$', min: .3, max: 1.5, step: .05, value: sy, fmt: v => v.toFixed(2), onInput: v => { sy = v; update() } }),
    slider({ label: '相関 $\\rho$', min: -.95, max: .95, step: .05, value: rho, fmt: v => v.toFixed(2), onInput: v => { rho = v; update() } }),
    mat, h('div.lab-hint', { html: '非対角成分（共分散 $\\sigma_{12}$）が<b>楕円の傾き</b>を決める。$\\mu$ と $\\Sigma$ だけで形が完全に決まる。' }))
  update()
}

// ═════════ 大数の法則 ═════════
export function lln(body) {
  const { canvas, side } = layout(body)
  let p = 0.3, flips = [], speed = 1, running = true
  const plot = new Plot(canvas, { aspect: .58, x: [1, 400], y: [0, 1], onDraw: (g, P) => {
    P.xr = [1, Math.max(50, flips.length)]
    P.axes({ xt: 5, yt: 4, xl: '投げた回数 n', yl: 'サンプル平均', fmtX: v => Math.round(v) })
    // band ±2sqrt(p(1-p)/n)
    g.save(); g.fillStyle = 'rgba(111,214,184,.22)'; g.beginPath()
    const n1 = P.xr[1]
    for (let n = 1; n <= n1; n += Math.max(1, n1 / 200)) g.lineTo(P.X(n), P.Y(clamp(p + 2 * Math.sqrt(p * (1 - p) / n), 0, 1)))
    for (let n = n1; n >= 1; n -= Math.max(1, n1 / 200)) g.lineTo(P.X(n), P.Y(clamp(p - 2 * Math.sqrt(p * (1 - p) / n), 0, 1)))
    g.closePath(); g.fill(); g.restore()
    g.save(); g.strokeStyle = COL.mintD; g.lineWidth = 2.5; g.setLineDash([8, 6]); g.beginPath(); g.moveTo(P.X(1), P.Y(p)); g.lineTo(P.X(n1), P.Y(p)); g.stroke(); g.restore()
    let s = 0; g.strokeStyle = COL.coral; g.lineWidth = 3.5; g.lineJoin = 'round'; g.beginPath()
    flips.forEach((f, i) => { s += f; const y = s / (i + 1); i ? g.lineTo(P.X(i + 1), P.Y(y)) : g.moveTo(P.X(1), P.Y(y)) })
    g.stroke()
    if (flips.length) { const m = s / flips.length; P.dot(flips.length, m, { r: 7, fill: COL.butter }); P.label(`m = ${m.toFixed(3)}`, P.X(flips.length) - 50, P.Y(m) - 22, { bg: COL.butter }) }
    P.label(`真の平均 μ = ${p.toFixed(2)}`, P.W - P.pad[1] - 4, P.Y(p) + 20, { align: 'right', bg: '#D7F5EC' })
    // recent flips as coins
    const last = flips.slice(-16)
    last.forEach((f, i) => { const x = P.pad[3] + 16 + i * 20, y = P.pad[0] + 16; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fillStyle = f ? COL.butter : '#fff'; g.fill(); g.lineWidth = 2; g.strokeStyle = COL.ink; g.stroke(); g.fillStyle = COL.ink; g.font = '700 9px Fredoka'; g.textAlign = 'center'; g.fillText(f ? '表' : '裏', x, y + 3) })
  } })
  const rng = mulberry(42)
  let acc = 0
  const stop = visibleLoop(canvas, (dt) => {
    if (!running || flips.length >= 2000) return
    acc += dt * 20 * speed
    while (acc >= 1) { flips.push(rng() < p ? 1 : 0); acc-- }
    plot.draw()
  })
  const pause = button('⏸ 一時停止', () => { running = !running; pause.textContent = running ? '⏸ 一時停止' : '▶ 再開' })
  side.append(
    slider({ label: '表が出る確率 $\\mu$', min: .05, max: .95, step: .05, value: p, fmt: v => v.toFixed(2), onInput: v => { p = v; flips = []; plot.draw() } }),
    seg({ label: 'スピード', options: [[1, '×1'], [5, '×5'], [25, '×25']], value: 1, onChange: v => (speed = +v) }),
    h('div.btn-row', pause, button('↺ やり直す', () => { flips = []; plot.draw() })),
    h('div.lab-hint', { html: '最初はフラフラ。でも回数を増やすと、緑の帯（≈ $\\pm 2\\sigma/\\sqrt{n}$）がすぼまり、<b>サンプル平均は真の平均に吸い寄せられる</b>。' }))
  return stop
}

// ═════════ 中心極限定理 ═════════
export function clt(body) {
  const { canvas, side } = layout(body)
  let dist = 'skew', n = 1, means = []
  const dists = {
    uni: { name: '一様', f: r => r(), mu: .5, var: 1 / 12 },
    skew: { name: '指数(偏り)', f: r => -Math.log(1 - r()) * .25, mu: .25, var: .0625 },
    coin: { name: 'コイン', f: r => r() < .3 ? 1 : 0, mu: .3, var: .21 },
  }
  const rng = mulberry(9)
  const bins = 40
  const plot = new Plot(canvas, { aspect: .58, x: [0, 1], y: [0, 1], onDraw: (g, P) => {
    const D = dists[dist]
    const lo = 0, hi = dist === 'skew' ? 1.2 : 1
    P.xr = [lo, hi]
    const hist = Array(bins).fill(0)
    means.forEach(m => { const k = Math.floor((m - lo) / (hi - lo) * bins); if (k >= 0 && k < bins) hist[k]++ })
    const bw = (hi - lo) / bins
    const dens = hist.map(c => c / Math.max(1, means.length) / bw)
    const sd = Math.sqrt(D.var / n)
    const peak = Math.max(...dens, 1 / (Math.sqrt(2 * Math.PI) * sd) * 1.05, 1)
    P.yr = [0, peak * 1.12]
    P.axes({ xt: 6, yt: 4, xl: `${n} 個の平均`, yl: '密度', fmtY: v => v.toFixed(1) })
    dens.forEach((d, i) => {
      const x = P.X(lo + i * bw), w = P.X(lo + (i + 1) * bw) - x
      g.fillStyle = i % 2 ? COL.lav : '#C9BCFF'; g.strokeStyle = COL.ink; g.lineWidth = 1.5
      g.fillRect(x + 1, P.Y(d), w - 2, P.Y(0) - P.Y(d)); if (d > 0) g.strokeRect(x + 1, P.Y(d), w - 2, P.Y(0) - P.Y(d))
    })
    if (means.length > 50) P.fn(x => gauss(x, D.mu, sd), { color: COL.coral, width: 4, n: 300 })
    P.label(`サンプル数 ${means.length}`, P.W - P.pad[1] - 4, P.pad[0] + 12, { align: 'right' })
  } })
  const add = (k) => { const D = dists[dist]; for (let j = 0; j < k; j++) { let s = 0; for (let i = 0; i < n; i++) s += D.f(rng); means.push(s / n) } plot.draw() }
  const stop = visibleLoop(canvas, () => { if (means.length < 3000) add(12) })
  side.append(
    seg({ label: '元の分布（母集団）', options: Object.entries(dists).map(([k, v]) => [k, v.name]), value: dist, onChange: v => { dist = v; means = []; plot.draw() } }),
    slider({ label: '平均をとる個数 $n$', min: 1, max: 50, step: 1, value: n, fmt: v => v, onInput: v => { n = v; means = []; plot.draw() } }),
    button('↺ リセット', () => { means = []; plot.draw() }),
    h('div.lab-hint', { html: '$n=1$ だと元の分布そのまま（偏ってる！）。$n$ を増やすと、どんな分布でも平均の分布は<b>ガウス分布（赤線）</b>に近づき、幅は $\\sigma/\\sqrt{n}$ で細くなる。' }))
  return stop
}
