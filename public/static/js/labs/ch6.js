import { h, rich, toast, reduced } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, gauss, clamp, rr } from '../lib/plot.js'
import { slider, seg, readout, button, layout, tweenTo } from '../lib/labkit.js'

function cmBox() {
  const cell = (cls, k, sub) => { const v = h('span.v', '0'); return [h('div.cell.' + cls, h('span', k), v, h('small', { style: { fontWeight: 500, fontSize: '10.5px' } }, sub)), v] }
  const [tp, vtp] = cell('tp', 'TP', '真陽性'), [fp, vfp] = cell('fp', 'FP', '偽陽性'), [fn, vfn] = cell('fn', 'FN', '偽陰性'), [tn, vtn] = cell('tn', 'TN', '真陰性')
  const el = h('div.cm', h('div.hd', ''), h('div.hd', '真:1'), h('div.hd', '真:0'), h('div.hd', '予測1'), tp, fp, h('div.hd', '予測0'), fn, tn)
  el.set = (a, b, c, d) => { vtp.textContent = a; vfp.textContent = b; vfn.textContent = c; vtn.textContent = d }
  return el
}
const metrics = (TP, FP, FN, TN) => {
  const P = TP + FP ? TP / (TP + FP) : 0, R = TP + FN ? TP / (TP + FN) : 0
  return { acc: (TP + TN) / (TP + FP + FN + TN), P, R, F: P + R ? 2 * P * R / (P + R) : 0, FPR: FP + TN ? FP / (FP + TN) : 0 }
}

// ═════════ しきい値 → 混同行列 → 指標 → ROC ═════════
export function rocLab(body) {
  const { canvas, side } = layout(body)
  let sep = 1.6, th = .5, ratio = .5
  let data = []
  const gen = () => {
    const r = mulberry(12), N = 200
    data = Array.from({ length: N }, (_, i) => { const y = r() < ratio ? 1 : 0; const z = (y ? sep / 2 : -sep / 2) + randn(r); return { y, s: 1 / (1 + Math.exp(-z * 1.4)), j: r() } })
  }
  const counts = (t) => { let TP = 0, FP = 0, FN = 0, TN = 0; data.forEach(d => { const p = d.s >= t; if (p && d.y) TP++; else if (p) FP++; else if (d.y) FN++; else TN++ }); return [TP, FP, FN, TN] }
  const rocPts = () => { const ts = [...new Set(data.map(d => d.s))].sort((a, b) => b - a); const pts = [[0, 0]]; ts.forEach(t => { const [TP, FP, FN, TN] = counts(t); pts.push([FP / Math.max(1, FP + TN), TP / Math.max(1, TP + FN)]) }); pts.push([1, 1]); return pts }
  const auc = (pts) => { let a = 0; for (let i = 1; i < pts.length; i++) a += (pts[i][0] - pts[i - 1][0]) * (pts[i][1] + pts[i - 1][1]) / 2; return a }
  // left: score strip, right: ROC — draw both in one canvas
  const plot = new Plot(canvas, { aspect: .62, pad: [18, 16, 34, 16], onDraw: (g, P) => {
    const W = P.W, H = P.H, split = W * .56
    // strip
    const sx = v => 24 + v * (split - 48), top = 40, bot = H - 50
    g.fillStyle = 'rgba(255,142,110,.12)'; g.fillRect(sx(th), top - 14, sx(1) - sx(th), bot - top + 28)
    g.font = '900 12px "Zen Maru Gothic"'; g.fillStyle = COL.ink2; g.textAlign = 'center'
    g.fillText('分類器の出力（ラベル1である確率）', split / 2, H - 14)
    g.strokeStyle = COL.ink; g.lineWidth = 2.5; g.beginPath(); g.moveTo(sx(0), bot + 10); g.lineTo(sx(1), bot + 10); g.stroke()
    ;[0, .5, 1].forEach(v => { g.font = '600 11px DM Mono'; g.fillText(v, sx(v), bot + 26) })
    data.forEach(d => {
      const x = sx(d.s), y = d.y ? top + d.j * (bot - top) * .45 : top + (bot - top) * .55 + d.j * (bot - top) * .45
      const pred = d.s >= th
      g.beginPath(); g.arc(x, y, 4.6, 0, 7)
      g.fillStyle = d.y ? COL.coral : COL.sky; g.fill()
      g.lineWidth = pred === !!d.y ? 1.2 : 2; g.strokeStyle = COL.ink; g.globalAlpha = pred === !!d.y ? 1 : .55
      g.stroke()
      if (pred !== !!d.y) { g.beginPath(); g.moveTo(x - 3, y - 3); g.lineTo(x + 3, y + 3); g.moveTo(x + 3, y - 3); g.lineTo(x - 3, y + 3); g.lineWidth = 1.6; g.stroke() }
      g.globalAlpha = 1
    })
    g.font = '900 12px "Zen Maru Gothic"'; g.textAlign = 'left'; g.fillStyle = COL.coralD; g.fillText('● 真のラベル 1', 18, 22); g.fillStyle = COL.skyD; g.fillText('● 真のラベル 0', 120, 22)
    g.strokeStyle = COL.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(sx(th), top - 18); g.lineTo(sx(th), bot + 14); g.stroke()
    P.label(`いき値 ${th.toFixed(2)}`, sx(th), top - 20, { bg: COL.butter })
    // ROC
    const rx0 = split + 30, ry0 = 30, rs = Math.min(W - rx0 - 18, H - 80)
    const RX = v => rx0 + v * rs, RY = v => ry0 + (1 - v) * rs
    g.fillStyle = '#fff'; g.strokeStyle = COL.ink; g.lineWidth = 2.5; g.fillRect(RX(0), RY(1), rs, rs); g.strokeRect(RX(0), RY(1), rs, rs)
    g.setLineDash([4, 4]); g.strokeStyle = COL.ink3; g.lineWidth = 1.5; g.beginPath(); g.moveTo(RX(0), RY(0)); g.lineTo(RX(1), RY(1)); g.stroke(); g.setLineDash([])
    const pts = rocPts()
    g.fillStyle = 'rgba(185,167,255,.35)'; g.beginPath(); g.moveTo(RX(0), RY(0)); pts.forEach(([x, y]) => g.lineTo(RX(x), RY(y))); g.lineTo(RX(1), RY(0)); g.closePath(); g.fill()
    g.strokeStyle = COL.lavD; g.lineWidth = 3.5; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(RX(x), RY(y)) : g.moveTo(RX(x), RY(y))); g.stroke()
    const [TP, FP, FN, TN] = counts(th), m = metrics(TP, FP, FN, TN)
    g.beginPath(); g.arc(RX(m.FPR), RY(m.R), 7, 0, 7); g.fillStyle = COL.butter; g.fill(); g.lineWidth = 2.5; g.strokeStyle = COL.ink; g.stroke()
    g.font = '700 11px "Zen Maru Gothic"'; g.fillStyle = COL.ink2; g.textAlign = 'center'
    g.fillText('FPR（偽陽性率）→', RX(.5), RY(0) + 18)
    g.save(); g.translate(RX(0) - 10, RY(.5)); g.rotate(-Math.PI / 2); g.fillText('TPR（再現率）→', 0, 0); g.restore()
    g.font = '900 14px Fredoka'; g.fillStyle = COL.lavD; g.fillText(`AUC = ${auc(pts).toFixed(3)}`, RX(.62), RY(.18))
  } })
  const cm = cmBox()
  const ro = readout([['acc', '正解率'], ['P', '適合率'], ['R', '再現率'], ['F', 'F値']])
  const upd = () => {
    const [TP, FP, FN, TN] = counts(th), m = metrics(TP, FP, FN, TN)
    cm.set(TP, FP, FN, TN)
    ro.set('acc', m.acc.toFixed(3)); ro.set('P', m.P.toFixed(3)); ro.set('R', m.R.toFixed(3)); ro.set('F', m.F.toFixed(3))
    plot.draw()
  }
  plot.pointer({ down: p => { const split = plot.W * .56; if (p.px < split) { th = clamp((p.px - 24) / (split - 48), 0, 1); ts.set(th); upd() } }, drag: p => { const split = plot.W * .56; if (p.px < split) { th = clamp((p.px - 24) / (split - 48), 0, 1); ts.set(th); upd() } } })
  const ts = slider({ label: 'いき値', min: 0, max: 1, step: .01, value: th, fmt: v => v.toFixed(2), onInput: v => { th = v; upd() } })
  side.append(ts,
    slider({ label: '分類器のうまさ（分離度）', min: 0, max: 4, step: .1, value: sep, fmt: v => v.toFixed(1), onInput: v => { sep = v; gen(); upd() } }),
    cm, ro)
  gen(); upd()
}

// ═════════ 不均衡データ：正解率 99% のワナ ═════════
export function imbalance(body) {
  const { canvas, side } = layout(body)
  let mode = 'all0'
  const N = 1000, pos = 10
  const plot = new Plot(canvas, { aspect: .5, pad: [10, 10, 10, 10], onDraw: (g, P) => {
    const cols = 50, rows = 20, c = Math.min((P.W - 20) / cols, (P.H - 20) / rows), ox = (P.W - c * cols) / 2, oy = (P.H - c * rows) / 2
    for (let i = 0; i < N; i++) {
      const isPos = i % 100 === 37
      const pred = mode === 'all0' ? 0 : mode === 'all1' ? 1 : (isPos ? (i % 200 === 37 ? 1 : 1) : (i % 97 === 0 ? 1 : 0))
      const x = ox + (i % cols) * c, y = oy + Math.floor(i / cols) * c
      g.fillStyle = isPos ? (pred ? COL.mint : COL.coralD) : (pred ? COL.butter : '#E9E4F5')
      g.beginPath(); g.arc(x + c / 2, y + c / 2, c * .38, 0, 7); g.fill()
      if (isPos) { g.lineWidth = 2; g.strokeStyle = COL.ink; g.stroke() }
    }
  } })
  const cm = cmBox()
  const ro = readout([['acc', '正解率'], ['P', '適合率'], ['R', '再現率'], ['FPR', '偽陽性率 FPR']])
  const upd = () => {
    let TP, FP, FN, TN
    if (mode === 'all0') { TP = 0; FP = 0; FN = pos; TN = N - pos }
    else if (mode === 'all1') { TP = pos; FP = N - pos; FN = 0; TN = 0 }
    else { TP = pos; FN = 0; FP = 0; for (let i = 0; i < N; i++) if (i % 100 !== 37 && i % 97 === 0) FP++; TN = N - pos - FP }
    const m = metrics(TP, FP, FN, TN)
    cm.set(TP, FP, FN, TN)
    ro.set('acc', m.acc.toFixed(3), m.acc > .95 ? 'good' : ''); ro.set('P', m.P.toFixed(3), m.P < .2 ? 'bad' : ''); ro.set('R', m.R.toFixed(3), m.R < .2 ? 'bad' : m.R > .9 ? 'good' : ''); ro.set('FPR', m.FPR.toFixed(3), m.FPR > .5 ? 'bad' : '')
    plot.draw()
  }
  side.append(
    seg({ label: '分類器', options: [['all0', 'つねに0'], ['all1', 'つねに1'], ['good', 'まとも']], value: mode, onChange: v => { mode = v; upd() } }),
    cm, ro, h('div.legend', h('span', h('i', { style: { background: COL.coralD } }), '見逃した陽性'), h('span', h('i', { style: { background: COL.mint } }), '見つけた陽性'), h('span', h('i', { style: { background: COL.butter } }), '誤警報')))
  upd()
}
