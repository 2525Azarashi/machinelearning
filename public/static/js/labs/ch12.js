import { h, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, solve, clamp } from '../lib/plot.js'
import { slider, seg, readout, button, layout } from '../lib/labkit.js'

const sig = a => 1 / (1 + Math.exp(-clamp(a, -30, 30)))

// ═════════ 線形識別関数の幾何と外れ値耐性（最小2乗 vs パーセプトロン vs ロジスティック回帰） ═════════
export function linearBoundaryLab(body) {
  const { canvas, side } = layout(body)
  let outlier = false
  let seed = 23, basePts = []
  const gen = () => {
    const r = mulberry(seed++)
    basePts = []
    for (let i = 0; i < 12; i++) basePts.push({ x: -1.1 + randn(r) * 0.45, y: 0.7 + randn(r) * 0.45, c: 1 })
    for (let i = 0; i < 12; i++) basePts.push({ x: 0.9 + randn(r) * 0.45, y: -0.7 + randn(r) * 0.45, c: 0 })
  }
  gen()

  const getPts = () => outlier
    ? [...basePts, { x: 2.7, y: -2.4, c: 0, out: true }, { x: 2.9, y: -2.2, c: 0, out: true }, { x: 2.5, y: -2.5, c: 0, out: true }]
    : basePts

  function fitLSQ(pts) {
    // t in {-1, +1}
    const X = pts.map(p => [1, p.x, p.y])
    const t = pts.map(p => (p.c === 1 ? 1 : -1))
    const A = [0, 1, 2].map(i => [0, 1, 2].map(j => X.reduce((s, r) => s + r[i] * r[j], i === j ? 1e-6 : 0)))
    const b = [0, 1, 2].map(i => X.reduce((s, r, n) => s + r[i] * t[n], 0))
    return solve(A, b) // [w0, w1, w2]
  }

  function fitLog(pts) {
    let w = [0, -0.5, 0.5]
    for (let it = 0; it < 12; it++) {
      const X = pts.map(p => [1, p.x, p.y])
      const ys = X.map(r => sig(w[0] * r[0] + w[1] * r[1] + w[2] * r[2]))
      const R = ys.map(y => Math.max(1e-4, y * (1 - y)))
      const H = [0, 1, 2].map(i => [0, 1, 2].map(j => X.reduce((s, r, n) => s + R[n] * r[i] * r[j], i === j ? 0.05 : 0)))
      const g = [0, 1, 2].map(i => X.reduce((s, r, n) => s + (ys[n] - pts[n].c) * r[i], 0.05 * w[i]))
      const step = solve(H, g)
      w = w.map((v, i) => v - step[i])
    }
    return w
  }

  function fitPerceptron(pts) {
    let w = [0, -0.2, 0.2]
    for (let ep = 0; ep < 60; ep++) {
      let err = 0
      for (const p of pts) {
        const t = p.c === 1 ? 1 : -1
        if ((w[0] + w[1] * p.x + w[2] * p.y) * t <= 0) {
          w[0] += 0.2 * t; w[1] += 0.2 * t * p.x; w[2] += 0.2 * t * p.y
          err++
        }
      }
      if (!err) break
    }
    return w
  }

  const ro = readout([
    ['lsq', '最小2乗分類の誤分類数'],
    ['log', 'ロジスティック回帰の誤分類数'],
    ['dist', '原点から決定境界までの距離 $|w_0|/\\|\\mathbf w\\|$', true],
  ])

  const plot = new Plot(canvas, { aspect: 0.72, x: [-2.8, 3.4], y: [-3.0, 2.6], onDraw: (g, P) => {
    P.axes({ xt: 6, yt: 5, xl: 'x₁', yl: 'x₂', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    const pts = getPts()
    const wLsq = fitLSQ(pts), wLog = fitLog(pts), wPer = fitPerceptron(pts)
    const drawLine = (w, col, dash, lw = 3.2) => {
      if (Math.abs(w[2]) > 1e-4) P.fn(x => -(w[0] + w[1] * x) / w[2], { color: col, width: lw, dash })
    }
    drawLine(wLsq, COL.coralD, [7, 5], 3.2)
    drawLine(wPer, COL.lavD, [3, 4], 2.6)
    drawLine(wLog, COL.mintD, null, 4)
    // draw normal vector w of logistic boundary from closest point to origin
    const norm2 = wLog[1] ** 2 + wLog[2] ** 2 || 1
    const x0 = -wLog[0] * wLog[1] / norm2, y0 = -wLog[0] * wLog[2] / norm2
    const unx = wLog[1] / Math.sqrt(norm2), uny = wLog[2] / Math.sqrt(norm2)
    g.save(); g.strokeStyle = COL.ink; g.fillStyle = COL.ink; g.lineWidth = 2.8
    const px0 = P.X(x0), py0 = P.Y(y0), px1 = P.X(x0 + unx * 0.9), py1 = P.Y(y0 + uny * 0.9)
    g.beginPath(); g.moveTo(px0, py0); g.lineTo(px1, py1); g.stroke()
    const ang = Math.atan2(py1 - py0, px1 - px0)
    g.beginPath(); g.moveTo(px1, py1)
    g.lineTo(px1 - 9 * Math.cos(ang - 0.45), py1 - 9 * Math.sin(ang - 0.45))
    g.lineTo(px1 - 9 * Math.cos(ang + 0.45), py1 - 9 * Math.sin(ang + 0.45))
    g.closePath(); g.fill(); g.restore()
    P.label('法線 w (直交)', px1 + 14, py1 - 12, { bg: '#fff' })

    pts.forEach(p => P.dot(p.x, p.y, { r: p.out ? 8 : 6, fill: p.c === 1 ? COL.butter : COL.sky }))
    const errOf = w => pts.filter(p => (w[0] + w[1] * p.x + w[2] * p.y >= 0) !== (p.c === 1)).length
    const elsq = errOf(wLsq), elog = errOf(wLog)
    ro.set('lsq', `${elsq} / ${pts.length}`, elsq > elog ? 'bad' : 'good')
    ro.set('log', `${elog} / ${pts.length}`, elog === 0 ? 'good' : '')
    ro.set('dist', `${(Math.abs(wLog[0]) / Math.sqrt(norm2)).toFixed(3)}  （緑＝ロジスティック、赤破線＝最小2乗、紫点線＝パーセプトロン）`)
  } })

  side.append(
    h('div.btn-row',
      button('💥 「正しすぎる外れ値」ON/OFF', () => { outlier = !outlier; plot.draw(); toast(outlier ? '外れ値追加！ 最小2乗（赤破線）が大きく引っ張られた！' : '外れ値を除去しました') }, 'butter'),
      button('🎲 再生成', () => { gen(); plot.draw() }),
    ),
    ro,
    h('div.lab-hint', { html: '右下に「正解側だけど遠く離れた青い点（外れ値）」を入れると、<b>最小2乗分類（赤破線）は $y>1$ のズレまで罰するため境界が大きく歪んで誤分類を起こす</b>。ロジスティック回帰（緑実線）はびくともしない！' }),
  )
  plot.draw()
  return () => plot.destroy()
}

// ═════════ ロジスティック回帰 IRLS ステップ ＆ 3クラス・ソフトマックス決定領域 ═════════
export function logisticSoftmaxLab(body) {
  const { canvas, side } = layout(body)
  let mode = 'irls', irlsStep = 0, priorBias = 0, seed = 41
  let pts2 = [], pts3 = []

  const gen = () => {
    const r = mulberry(seed++)
    pts2 = []
    for (let i = 0; i < 14; i++) pts2.push({ x: -0.9 + randn(r) * 0.65, y: 0.7 + randn(r) * 0.65, c: 1 })
    for (let i = 0; i < 14; i++) pts2.push({ x: 0.9 + randn(r) * 0.65, y: -0.7 + randn(r) * 0.65, c: 0 })
    pts3 = []
    const centers = [[-1.1, 0.9], [1.2, 0.8], [0.0, -1.2]]
    centers.forEach(([cx, cy], k) => {
      for (let i = 0; i < 12; i++) pts3.push({ x: cx + randn(r) * 0.5, y: cy + randn(r) * 0.5, c: k })
    })
  }
  gen()

  function runIRLS(steps) {
    let w = [0, 0.1, -0.1]
    const X = pts2.map(p => [1, p.x, p.y])
    for (let it = 0; it < steps; it++) {
      const ys = X.map(r => sig(w[0] * r[0] + w[1] * r[1] + w[2] * r[2]))
      const R = ys.map(y => Math.max(1e-4, y * (1 - y)))
      const H = [0, 1, 2].map(i => [0, 1, 2].map(j => X.reduce((s, r, n) => s + R[n] * r[i] * r[j], i === j ? 0.02 : 0)))
      const g = [0, 1, 2].map(i => X.reduce((s, r, n) => s + (ys[n] - pts2[n].c) * r[i], 0.02 * w[i]))
      const d = solve(H, g)
      w = w.map((v, i) => v - d[i])
    }
    w[0] += priorBias
    const loss = pts2.reduce((s, p) => {
      const y = clamp(sig(w[0] + w[1] * p.x + w[2] * p.y), 1e-6, 1 - 1e-6)
      return s - (p.c * Math.log(y) + (1 - p.c) * Math.log(1 - y))
    }, 0)
    return { w, loss }
  }

  function fitSoftmax3() {
    // 3 classes, each w_k = [w0, w1, w2], GD 120 steps
    const W = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
    const lr = 0.08
    for (let ep = 0; ep < 120; ep++) {
      const G = [[0, 0, 0], [0, 0, 0], [0, 0, 0]]
      for (const p of pts3) {
        const ph = [1, p.x, p.y]
        const as = W.map(wk => wk[0] * ph[0] + wk[1] * ph[1] + wk[2] * ph[2])
        const m = Math.max(...as)
        const ex = as.map(a => Math.exp(a - m))
        const sum = ex[0] + ex[1] + ex[2]
        for (let k = 0; k < 3; k++) {
          const d = ex[k] / sum - (p.c === k ? 1 : 0)
          for (let j = 0; j < 3; j++) G[k][j] += d * ph[j]
        }
      }
      for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) W[k][j] -= lr * (G[k][j] / pts3.length + 0.01 * W[k][j])
    }
    W[0][0] += priorBias
    return W
  }

  const ro = readout([
    ['st', '最適化ステップ / モード'],
    ['ce', '交差エントロピー誤差 $E(\\mathbf w)$', true],
  ])

  const plot = new Plot(canvas, { aspect: 0.72, x: [-2.6, 2.6], y: [-2.4, 2.4], onDraw: (g, P) => {
    const nx = 44, ny = 38
    if (mode === 'irls') {
      const { w, loss } = runIRLS(irlsStep)
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x = P.xr[0] + ((i + 0.5) / nx) * (P.xr[1] - P.xr[0])
        const y = P.yr[0] + ((j + 0.5) / ny) * (P.yr[1] - P.yr[0])
        const pr = sig(w[0] + w[1] * x + w[2] * y)
        g.fillStyle = pr >= 0.5 ? `rgba(255,142,110,${0.08 + 0.35 * (pr - 0.5) * 2})` : `rgba(111,214,184,${0.08 + 0.35 * (0.5 - pr) * 2})`
        g.fillRect(P.pad[3] + (i / nx) * P.iw, P.pad[0] + (1 - (j + 1) / ny) * P.ih, P.iw / nx + 1, P.ih / ny + 1)
      }
      P.axes({ xt: 4, yt: 4, xl: 'x₁', yl: 'x₂', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
      ;[0.2, 0.5, 0.8].forEach(pr => {
        const c = Math.log(pr / (1 - pr))
        if (Math.abs(w[2]) > 1e-4) P.fn(x => (c - w[0] - w[1] * x) / w[2], { color: pr === 0.5 ? COL.ink : COL.ink3, width: pr === 0.5 ? 3.5 : 1.5, dash: pr === 0.5 ? null : [5, 5] })
      })
      pts2.forEach(p => P.dot(p.x, p.y, { r: 6.2, fill: p.c === 1 ? COL.coral : COL.mint }))
      ro.set('st', `IRLS 反復 ${irlsStep} 回目`)
      ro.set('ce', `${loss.toFixed(3)}  （点線は事後確率 0.2 / 0.8 のグレーゾーン）`, irlsStep >= 4 ? 'good' : '')
    } else {
      const W = fitSoftmax3()
      const pal = ['255,142,110', '111,214,184', '185,167,255']
      let ce = 0
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const x = P.xr[0] + ((i + 0.5) / nx) * (P.xr[1] - P.xr[0])
        const y = P.yr[0] + ((j + 0.5) / ny) * (P.yr[1] - P.yr[0])
        const as = W.map(wk => wk[0] + wk[1] * x + wk[2] * y)
        const m = Math.max(...as), ex = as.map(a => Math.exp(a - m)), sum = ex[0] + ex[1] + ex[2]
        const ps = ex.map(e => e / sum)
        const k = ps.indexOf(Math.max(...ps))
        g.fillStyle = `rgba(${pal[k]}, ${0.14 + 0.32 * ps[k]})`
        g.fillRect(P.pad[3] + (i / nx) * P.iw, P.pad[0] + (1 - (j + 1) / ny) * P.ih, P.iw / nx + 1, P.ih / ny + 1)
      }
      P.axes({ xt: 4, yt: 4, xl: 'x₁', yl: 'x₂', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
      const dotCols = [COL.coral, COL.mint, COL.lav]
      pts3.forEach(p => {
        P.dot(p.x, p.y, { r: 6.2, fill: dotCols[p.c] })
        const as = W.map(wk => wk[0] + wk[1] * p.x + wk[2] * p.y)
        const m = Math.max(...as), ex = as.map(a => Math.exp(a - m)), sum = ex[0] + ex[1] + ex[2]
        ce -= Math.log(Math.max(1e-6, ex[p.c] / sum))
      })
      ro.set('st', '3クラス・ソフトマックス分類')
      ro.set('ce', `${ce.toFixed(3)}  （各領域の境界はすべて直線！）`, 'good')
    }
  } })

  const sBias = slider({ label: 'クラス1の事前対数オッズシフト $\\Delta w_0$', min: -2.5, max: 2.5, step: 0.1, value: 0, fmt: v => v.toFixed(1), onInput: v => { priorBias = v; plot.draw() } })
  side.append(
    seg({ label: '実験モード', options: [['irls', '2クラス IRLS'], ['soft', '3クラス Softmax']], value: mode, onChange: v => { mode = v; plot.draw() } }),
    h('div.btn-row',
      button('▶ IRLS +1ステップ', () => { mode = 'irls'; irlsStep = Math.min(8, irlsStep + 1); plot.draw(); if (irlsStep === 4) toast('たった4回のニュートン反復でほぼ完全収束！', { kind: 'ok' }) }, 'butter'),
      button('↺ 初期重みへ', () => { irlsStep = 0; priorBias = 0; sBias.set(0); plot.draw() }),
    ),
    sBias,
    button('🎲 データを再生成', () => { gen(); irlsStep = 4; plot.draw() }),
    ro,
    h('div.lab-hint', { html: 'IRLS（ニュートン法）は2階微分ヘッセ行列 $H=\\Phi^{\\mathsf T}R\\Phi$ を使うため<b>わずか4〜5回で収束</b>！ また $\\Delta w_0$（事前確率の比）を動かすと、向き $\\mathbf w$ を保ったまま<b>決定境界が平行移動</b>する。' }),
  )
  irlsStep = 3
  plot.draw()
  return () => plot.destroy()
}
