import { h, rich, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, gauss, Phi, clamp, rr } from '../lib/plot.js'
import { slider, seg, readout, button, layout, tweenTo, visibleLoop } from '../lib/labkit.js'

// ═════════ 損失関数のかたち ═════════
export function lossShapes(body) {
  const { canvas, side } = layout(body)
  let z = 0.6, show = { sq: true, zo: true, hinge: true, ce: true }
  // x-axis: margin m = t*y  (for classification);  for squared: residual r
  const L = {
    sq: { name: '2乗誤差', c: COL.coral, f: m => (1 - m) ** 2 },
    zo: { name: '0-1', c: COL.ink, f: m => m > 0 ? 0 : 1 },
    hinge: { name: 'ヒンジ', c: COL.lavD, f: m => Math.max(0, 1 - m) },
    ce: { name: '交差エントロピー', c: COL.mintD, f: m => Math.log2(1 + Math.exp(-m)) },
  }
  const plot = new Plot(canvas, { aspect: .58, x: [-2, 3], y: [0, 4], onDraw: (g, P) => {
    P.axes({ xt: 5, yt: 4, xl: 'マージン t·y（右ほど“自信をもって正解”）', yl: '損失', fmtX: v => +v.toFixed(1), fmtY: v => +v.toFixed(1) })
    g.save(); g.fillStyle = 'rgba(255,142,110,.08)'; g.fillRect(P.X(-2), P.pad[0], P.X(0) - P.X(-2), P.ih); g.restore()
    P.vline(0, { color: COL.ink3, dash: [4, 4], width: 1.5 })
    Object.entries(L).forEach(([k, v]) => { if (show[k]) P.fn(v.f, { color: v.c, width: k === 'zo' ? 3 : 4, n: 500 }) })
    Object.entries(L).forEach(([k, v]) => { if (show[k]) P.dot(z, clamp(v.f(z), 0, 4), { r: 6, fill: v.c === COL.ink ? '#fff' : v.c }) })
    P.vline(z, { color: COL.ink, dash: [], width: 2 })
    g.font = '700 12px "Zen Maru Gothic"'; g.fillStyle = COL.coralD; g.fillText('← 間違えている側', P.X(-1.9), P.pad[0] + 16)
  } })
  const ro = readout(Object.entries(L).map(([k, v]) => [k, v.name]))
  const upd = () => { Object.entries(L).forEach(([k, v]) => ro.set(k, v.f(z).toFixed(3))); plot.draw() }
  const toggles = h('div.legend', Object.entries(L).map(([k, v]) => {
    const b = h('button.chip', { type: 'button', style: { background: '#fff', cursor: 'pointer' }, onclick: () => { show[k] = !show[k]; b.style.opacity = show[k] ? 1 : .35; plot.draw() } }, h('i', { style: { background: v.c, width: '14px', height: '14px', borderRadius: '4px', border: '2px solid #2A2540' } }), v.name)
    return b
  }))
  side.append(slider({ label: 'マージン $t\\cdot y$', min: -2, max: 3, step: .05, value: z, fmt: v => v.toFixed(2), onInput: v => { z = v; upd() } }), toggles, ro,
    h('div.lab-hint', { html: '0-1 損失は「正解か不正解か」だけ。でも段差があって<b>微分できない</b>ので、学習ではなめらかな代わり（ヒンジ・交差エントロピー）をよく使う。' }))
  upd()
}

// ═════════ 期待損失 vs 経験損失 ═════════
export function empirical(body) {
  const { canvas, side } = layout(body)
  // true: t = sin(2πx)+noise, model y = a*x + b (fixed candidate), compare expected vs empirical squared loss
  const sigma = .3, truth = x => Math.sin(2 * Math.PI * x) * .8
  let N = 5, seed = 1, data = [], a = -1.4, b = .7
  const expected = () => { let s = 0; const K = 400; for (let i = 0; i < K; i++) { const x = (i + .5) / K; s += (truth(x) - (a * x + b)) ** 2 } return s / K + sigma * sigma }
  const emp = () => data.reduce((s, p) => s + (p.t - (a * p.x + b)) ** 2, 0) / data.length
  const gen = () => { const r = mulberry(seed); data = Array.from({ length: N }, () => { const x = r(); return { x, t: truth(x) + randn(r) * sigma } }) }
  let hist = []
  const plot = new Plot(canvas, { aspect: .58, x: [0, 1], y: [-1.6, 1.6], onDraw: (g, P) => {
    P.axes({ xt: 4, yt: 4, xl: 'x', yl: 't' })
    // density band of p(t|x)
    for (let k = 2; k >= 1; k--) { P.area(x => truth(x) + k * sigma, { base: -1.6, color: 'rgba(0,0,0,0)' }) }
    g.save(); g.fillStyle = 'rgba(111,214,184,.18)'; g.beginPath()
    for (let i = 0; i <= 100; i++) { const x = i / 100; g.lineTo(P.X(x), P.Y(truth(x) + 2 * sigma)) }
    for (let i = 100; i >= 0; i--) { const x = i / 100; g.lineTo(P.X(x), P.Y(truth(x) - 2 * sigma)) }
    g.closePath(); g.fill(); g.restore()
    P.fn(truth, { color: COL.mintD, width: 2.5, dash: [7, 6] })
    P.fn(x => a * x + b, { color: COL.coral, width: 4 })
    data.forEach(p => { g.strokeStyle = COL.coralD; g.lineWidth = 2; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(P.X(p.x), P.Y(p.t)); g.lineTo(P.X(p.x), P.Y(a * p.x + b)); g.stroke(); g.setLineDash([]); P.dot(p.x, p.t, { r: 6, fill: COL.butter }) })
    P.label('緑の帯 = 同時分布 p(x,t)（ふつうは見えない）', P.pad[3] + 6, P.H - P.pad[2] - 14, { align: 'left', bg: '#D7F5EC' })
  } })
  const ro = readout([['ex', '期待損失（神の視点）'], ['em', '経験損失（データから）'], ['gap', 'ズレ', true]])
  const upd = () => {
    const e = expected(), m = emp()
    ro.set('ex', e.toFixed(3)); ro.set('em', m.toFixed(3)); ro.set('gap', `${(m - e >= 0 ? '+' : '') + (m - e).toFixed(3)}  <small>(N=${N})</small>`, Math.abs(m - e) < .05 ? 'good' : Math.abs(m - e) > .2 ? 'bad' : '')
    plot.draw()
  }
  side.append(
    slider({ label: 'データ数 $N$', min: 2, max: 400, step: 1, value: N, fmt: v => v, onInput: v => { N = v; gen(); upd() } }),
    button('🎲 データを取り直す', () => { seed++; gen(); upd() }, 'butter'),
    slider({ label: 'モデルの傾き', min: -3, max: 1, step: .05, value: a, fmt: v => v.toFixed(2), onInput: v => { a = v; upd() } }),
    ro, h('div.lab-hint', { html: '同じモデルでも、$N$ が小さいと経験損失はデータ次第でブレる。$N$ を大きくすると<b>大数の法則</b>で期待損失に近づく。' }))
  gen(); upd()
}
