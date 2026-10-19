import { h, rich, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, gauss, Phi, clamp, rr } from '../lib/plot.js'
import { slider, seg, readout, button, layout, tweenTo } from '../lib/labkit.js'

// ═════════ ベイズ決定則（2クラス） ═════════
export function bayesBoundary(body) {
  const { canvas, side } = layout(body)
  let pi1 = .5, m1 = -1, m2 = 1.2, s = 1
  const st = { xb: 1.5 }
  const j1 = x => pi1 * gauss(x, m1, s), j2 = x => (1 - pi1) * gauss(x, m2, s)
  const optimal = () => { // solve j1=j2 numerically
    let lo = -4, hi = 4.5; const f = x => j1(x) - j2(x)
    if (f(lo) * f(hi) > 0) return f(0) > 0 ? hi : lo
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; f(lo) * f(mid) <= 0 ? hi = mid : lo = mid } return (lo + hi) / 2
  }
  const err = xb => pi1 * (1 - Phi(xb, m1, s)) + (1 - pi1) * Phi(xb, m2, s)
  const plot = new Plot(canvas, { aspect: .6, x: [-4, 4.5], y: [0, .5], onDraw: (g, P) => {
    const peak = Math.max(j1(m1), j2(m2)); P.yr = [0, peak * 1.3]
    P.axes({ xt: 8, yt: 3, xl: 'x', yl: 'p(x, C_k)', fmtX: v => v.toFixed(0), fmtY: v => v.toFixed(2) })
    const xb = st.xb
    // error areas: C1 mass right of xb (wrongly → C2), C2 mass left of xb
    P.area(j2, { x0: -4, x1: xb, color: 'rgba(111,214,184,.55)', n: 200 })
    P.area(j1, { x0: xb, x1: 4.5, color: 'rgba(255,142,110,.55)', n: 200 })
    // extra (reducible) error region
    const xo = optimal()
    if (Math.abs(xo - xb) > .01) {
      const lo = Math.min(xo, xb), hi = Math.max(xo, xb)
      g.save(); g.fillStyle = 'rgba(255,214,107,.9)'; g.beginPath(); g.moveTo(P.X(lo), P.Y(Math.min(j1(lo), j2(lo))))
      for (let i = 0; i <= 80; i++) { const x = lo + (hi - lo) * i / 80; g.lineTo(P.X(x), P.Y(Math.max(j1(x), j2(x)))) }
      for (let i = 80; i >= 0; i--) { const x = lo + (hi - lo) * i / 80; g.lineTo(P.X(x), P.Y(Math.min(j1(x), j2(x)))) }
      g.closePath(); g.fill(); g.restore()
    }
    P.fn(j1, { color: COL.coralD, width: 4, n: 300 })
    P.fn(j2, { color: COL.mintD, width: 4, n: 300 })
    // regions bar
    g.fillStyle = 'rgba(255,142,110,.25)'; g.fillRect(P.X(-4), P.H - P.pad[2] + 22, P.X(xb) - P.X(-4), 8)
    g.fillStyle = 'rgba(111,214,184,.35)'; g.fillRect(P.X(xb), P.H - P.pad[2] + 22, P.X(4.5) - P.X(xb), 8)
    P.vline(xo, { color: COL.ink3, dash: [3, 4], width: 2 })
    P.vline(xb, { color: COL.ink, dash: [], width: 3 })
    P.label('境界 x̂ (ドラッグ)', P.X(xb), P.pad[0] + 10, { bg: COL.butter })
    P.label('R₁ → C₁', P.X(-3.2), P.pad[0] + 40, { bg: '#FFE3D6' }); P.label('R₂ → C₂', P.X(3.6), P.pad[0] + 40, { bg: '#D7F5EC' })
  } })
  plot.pointer({ down: p => { st.xb = clamp(p.x, -4, 4.5); upd() }, drag: p => { st.xb = clamp(p.x, -4, 4.5); upd() } })
  const ro = readout([['e', '誤分類率 $p(\\text{error})$'], ['eo', '最小（ベイズ）'], ['x', '最適境界 $x^*$', true]])
  const upd = () => { const xo = optimal(); ro.set('e', err(st.xb).toFixed(4), Math.abs(st.xb - xo) < .03 ? 'good' : ''); ro.set('eo', err(xo).toFixed(4)); ro.set('x', `${xo.toFixed(3)}  <small>（$p(x,C_1)=p(x,C_2)$ の交点）</small>`.replace(/\$[^$]+\$/g, m => rich(m))); plot.draw() }
  side.append(
    slider({ label: '事前確率 $p(C_1)$', min: .05, max: .95, step: .01, value: pi1, fmt: v => v.toFixed(2), onInput: v => { pi1 = v; upd() } }),
    slider({ label: 'クラスの離れ具合', min: .2, max: 4, step: .1, value: m2 - m1, fmt: v => v.toFixed(1), onInput: v => { m1 = -v / 2; m2 = v / 2; upd() } }),
    ro, button('🎯 境界を最適な位置へ', () => tweenTo(st, 'xb', optimal(), 800, upd).then(() => toast('黄色（ムダな誤り）が消えた！')), 'butter'),
    h('div.lab-hint', { html: '<b>黄色</b>は境界をずらしたせいで増えた「ムダな誤り」。交点で区切ると消える ＝ 各 $x$ で <b>事後確率が大きいクラス</b>を選ぶのが最適。' }))
  upd()
}

// ═════════ 回帰のベイズ決定則：条件つき期待値 ═════════
export function condMean(body) {
  const { canvas, side } = layout(body)
  let x0 = .35, guess = 0, cloud = []
  const f = x => Math.sin(2 * Math.PI * x) * .9 + .2 * x, sd = x => .15 + .25 * x
  const r = mulberry(4)
  for (let i = 0; i < 700; i++) { const x = r(); cloud.push([x, f(x) + randn(r) * sd(x)]) }
  const plot = new Plot(canvas, { aspect: .6, x: [0, 1], y: [-2, 2], onDraw: (g, P) => {
    P.axes({ xt: 4, yt: 4, xl: 'x', yl: 't' })
    cloud.forEach(([x, t]) => { g.fillStyle = 'rgba(139,115,242,.28)'; g.beginPath(); g.arc(P.X(x), P.Y(t), 2.4, 0, 7); g.fill() })
    P.fn(f, { color: COL.mintD, width: 4 })
    // slice at x0
    g.save(); g.fillStyle = 'rgba(255,214,107,.5)'; g.strokeStyle = COL.ink; g.lineWidth = 2
    g.beginPath(); const m = f(x0), s = sd(x0)
    g.moveTo(P.X(x0), P.Y(m - 3 * s)); for (let t = m - 3 * s; t <= m + 3 * s; t += s / 12) g.lineTo(P.X(x0) + gauss(t, m, s) * s * 70, P.Y(t)); g.lineTo(P.X(x0), P.Y(m + 3 * s)); g.closePath(); g.fill(); g.stroke(); g.restore()
    P.vline(x0, { color: COL.ink, width: 2 })
    P.dot(x0, m, { r: 8, fill: COL.mint }); P.dot(x0, guess, { r: 8, fill: COL.coral })
    P.label('E[t|x]', P.X(x0) - 40, P.Y(m), { bg: '#C9F1E3' })
    P.label('あなたの予測', P.X(x0) - 56, P.Y(guess), { bg: '#FFE3D6' })
  } })
  const lossAt = (y) => { const m = f(x0), s = sd(x0); return (y - m) ** 2 + s * s }
  const ro = readout([['l', 'その $x$ での期待2乗損失'], ['min', '最小値（＝分散）']])
  const upd = () => { ro.set('l', lossAt(guess).toFixed(3), Math.abs(guess - f(x0)) < .03 ? 'good' : ''); ro.set('min', (sd(x0) ** 2).toFixed(3)); plot.draw() }
  const sg = slider({ label: 'あなたの予測 $y(x)$', min: -2, max: 2, step: .01, value: guess, fmt: v => v.toFixed(2), onInput: v => { guess = v; upd() } })
  side.append(
    slider({ label: '入力 $x$', min: .02, max: .98, step: .01, value: x0, fmt: v => v.toFixed(2), onInput: v => { x0 = v; upd() } }),
    sg, ro, button('🎯 損失最小の予測は？', () => { const st = { v: guess }; tweenTo(st, 'v', f(x0), 700, () => { guess = st.v; sg.set(guess); upd() }) }, 'butter'),
    h('div.lab-hint', { html: '黄色い山 = $p(t\\mid x)$。期待2乗損失 $=(y-\\mathbb E[t|x])^2+\\mathrm{var}[t|x]$ だから、<b>条件つき平均（緑線）</b>が最適。分散ぶんの誤差はどうやっても消せない。' }))
  upd()
}
