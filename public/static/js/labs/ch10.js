import { h, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, polyfit, polyval, clamp, rr } from '../lib/plot.js'
import { slider, readout, button, layout } from '../lib/labkit.js'

// ═════════ モデルエビデンスの近似：フィット度 + M ln(Δw_post / Δw_pri) ═════════
export function occamsRazor(body) {
  const { canvas, side } = layout(body)
  let N = 12, ratio = 0.12 // Δw_post / Δw_pri
  let seed = 18, xs = [], ts = []
  const sigma = 0.28
  const gen = () => {
    const r = mulberry(seed++)
    xs = Array.from({ length: N }, (_, i) => (i + 0.5) / N)
    ts = xs.map(x => Math.sin(2 * Math.PI * x) + randn(r) * sigma)
  }
  gen()
  const ro = readout([
    ['best', 'エビデンス最大の次数 $M^*$'],
    ['fit', '$M^*$ のフィット度項'],
    ['pen', '$M^*$ のペナルティ項', true],
  ])
  let selM = 3
  const plot = new Plot(canvas, { aspect: 0.64, x: [0, 9], y: [-25, 5], onDraw: (g, P) => {
    const fits = [], pens = [], evs = []
    for (let deg = 0; deg <= 9; deg++) {
      const M = deg + 1
      const w = polyfit(xs, ts, deg, 1e-4)
      const sse = xs.reduce((s, x, i) => s + (ts[i] - polyval(w, x)) ** 2, 0)
      const logFit = -sse / (2 * sigma * sigma) - (N / 2) * Math.log(2 * Math.PI * sigma * sigma)
      const pen = M * Math.log(ratio)
      fits.push(logFit); pens.push(pen); evs.push(logFit + pen)
    }
    const bestDeg = evs.indexOf(Math.max(...evs))
    const ymin = Math.min(...evs, ...pens) - 3
    const ymax = Math.max(...fits, ...evs) + 4
    P.yr = [ymin, ymax]
    P.axes({ xt: 9, yt: 5, xl: '多項式の次数 M-1（パラメータ数 M = 次数+1）', yl: '対数値', fmtX: v => v.toFixed(0), fmtY: v => v.toFixed(0) })
    const drawCurve = (arr, col, dash, w = 3.2) => {
      g.save(); g.strokeStyle = col; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'
      if (dash) g.setLineDash(dash)
      g.beginPath()
      arr.forEach((v, i) => (i ? g.lineTo(P.X(i), P.Y(v)) : g.moveTo(P.X(i), P.Y(v))))
      g.stroke(); g.restore()
    }
    drawCurve(fits, COL.mintD, [6, 5], 3)
    drawCurve(pens, COL.coralD, [6, 5], 3)
    drawCurve(evs, COL.ink, null, 4.2)
    evs.forEach((v, i) => P.dot(i, v, { r: i === bestDeg ? 8.5 : 5, fill: i === bestDeg ? COL.butter : '#fff' }))
    P.vline(selM, { color: COL.lavD, dash: [4, 4], width: 2 })
    P.label(`最大！ 次数 ${bestDeg} (M=${bestDeg + 1})`, P.X(bestDeg), P.Y(evs[bestDeg]) - 18, { bg: COL.butter })
    // legend box
    const lx = P.pad[3] + 10, ly = P.H - P.pad[2] - 58
    g.save(); g.fillStyle = 'rgba(255,255,255,.92)'; g.strokeStyle = COL.ink; g.lineWidth = 2
    rr(g, lx, ly, 230, 50, 10); g.fill(); g.stroke()
    g.font = '700 11px "Zen Maru Gothic", sans-serif'
    g.fillStyle = COL.mintD; g.fillText('--- 第1項：フィット度（単調増加）', lx + 10, ly + 18)
    g.fillStyle = COL.coralD; g.fillText('--- 第2項：ペナルティ M ln(Δw_post/Δw_pri)', lx + 10, ly + 33)
    g.fillStyle = COL.ink; g.fillText('━━ 合計：対数モデルエビデンス', lx + 10, ly + 46)
    g.restore()
    ro.set('best', `次数 ${bestDeg}（パラメータ数 M = ${bestDeg + 1}）`, 'good')
    ro.set('fit', fits[bestDeg].toFixed(2))
    ro.set('pen', `${pens[bestDeg].toFixed(2)}  （M=${bestDeg + 1} × ln(${ratio.toFixed(2)})）`)
  } })
  plot.pointer({ down: p => { selM = clamp(Math.round(p.x), 0, 9); plot.draw() } })
  side.append(
    slider({ label: '幅の比 $\\Delta w_{\\mathrm{post}}/\\Delta w_{\\mathrm{pri}}$', min: 0.03, max: 0.5, step: 0.01, value: ratio, fmt: v => v.toFixed(2), onInput: v => { ratio = v; plot.draw() } }),
    slider({ label: '学習データ数 $N$', min: 8, max: 30, step: 2, value: N, fmt: v => v, onInput: v => { N = v; gen(); plot.draw() } }),
    button('🎲 データを再生成', () => { gen(); plot.draw(); toast('確認用データなしで最適な次数が選ばれた！') }, 'butter'),
    ro,
    h('div.lab-hint', { html: '緑（フィット度）は次数を上げるほど増え続けるが、赤（ペナルティ $M\\ln(\\Delta w_{\\mathrm{post}}/\\Delta w_{\\mathrm{pri}})<0$）が直線的に下がるため、<b>合計の対数エビデンス（黒線）はちょうどいい次数で山になる</b>！' }),
  )
  plot.draw()
  return () => plot.destroy()
}
