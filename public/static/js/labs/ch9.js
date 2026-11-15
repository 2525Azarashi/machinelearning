import { h } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, solve, clamp } from '../lib/plot.js'
import { slider, seg, readout, button, layout } from '../lib/labkit.js'

const sig = a => 1 / (1 + Math.exp(-clamp(a, -30, 30)))

function makePhi(x, M, kind) {
  const out = [1]
  if (kind === 'poly') {
    const u = 2 * x - 1
    for (let j = 1; j < M; j++) out.push(u ** j)
  } else if (kind === 'gauss') {
    const s = 1 / Math.max(2, M - 1)
    for (let j = 1; j < M; j++) {
      const mu = (j - 0.5) / (M - 1)
      out.push(Math.exp(-((x - mu) ** 2) / (2 * s * s)))
    }
  } else {
    const s = 0.7 / Math.max(2, M - 1)
    for (let j = 1; j < M; j++) {
      const mu = (j - 0.5) / (M - 1)
      out.push(sig((x - mu) / s))
    }
  }
  return out
}

function fitBasis(pts, M, kind, ridge = 1e-5) {
  const Phi = pts.map(p => makePhi(p.x, M, kind))
  const A = Array.from({ length: M }, (_, i) =>
    Array.from({ length: M }, (__, j) => {
      let s = i === j ? ridge : 0
      for (let n = 0; n < pts.length; n++) s += Phi[n][i] * Phi[n][j]
      return s
    }),
  )
  const b = Array.from({ length: M }, (_, i) => {
    let s = 0
    for (let n = 0; n < pts.length; n++) s += Phi[n][i] * pts[n].t
    return s
  })
  return solve(A, b)
}

// ═════════ 基底関数切り替え＆最尤フィッティング ═════════
export function basisLab(body) {
  const { canvas, side } = layout(body)
  let kind = 'gauss', M = 6, seed = 4
  let pts = []
  const gen = () => {
    const r = mulberry(seed++)
    pts = Array.from({ length: 14 }, (_, i) => {
      const x = (i + 0.4) / 14
      return { x, t: Math.sin(2 * Math.PI * x) + 0.22 * randn(r) }
    })
  }
  gen()
  const ro = readout([
    ['m', '基底数 $M$'],
    ['s2', '最尤分散 $\\sigma^2_{\\mathrm{ML}}$'],
    ['rms', 'RMSE（学習データ）', true],
  ])
  const plot = new Plot(canvas, { aspect: 0.62, x: [0, 1], y: [-1.8, 1.8], onDraw: (g, P) => {
    P.axes({ xt: 5, yt: 4, xl: 'x', yl: 't', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    const w = fitBasis(pts, M, kind, 1e-5)
    // draw weighted basis components w_j * phi_j(x) for j>=1
    const cols = [COL.lavD, COL.skyD, COL.mintD, COL.coralD, '#C79400', '#E05B8C']
    for (let j = 1; j < M; j++) {
      P.fn(x => clamp(w[j] * makePhi(x, M, kind)[j], -1.7, 1.7), { color: cols[(j - 1) % cols.length], width: 1.6, dash: [4, 4], n: 180 })
    }
    P.fn(x => Math.sin(2 * Math.PI * x), { color: COL.mintD, width: 2.5, dash: [7, 6] })
    const pred = x => { const ph = makePhi(x, M, kind); return ph.reduce((s, v, j) => s + w[j] * v, 0) }
    P.fn(pred, { color: COL.coralD, width: 4.2, n: 240 })
    pts.forEach(p => P.dot(p.x, p.t, { r: 6, fill: COL.butter }))
    const mse = pts.reduce((s, p) => s + (p.t - pred(p.x)) ** 2, 0) / pts.length
    ro.set('m', `${M} 個（w₀ 含む）`)
    ro.set('s2', mse.toFixed(4))
    ro.set('rms', Math.sqrt(mse).toFixed(4))
    void g
  } })
  side.append(
    seg({ label: '基底関数の種類', options: [['gauss', '🔔 ガウス'], ['poly', '📈 多項式'], ['sig', '〰️ シグモイド']], value: kind, onChange: v => { kind = v; plot.draw() } }),
    slider({ label: '基底関数の総数 $M$', min: 2, max: 11, step: 1, value: M, fmt: v => v, onInput: v => { M = v; plot.draw() } }),
    button('🎲 データを取り直す', () => { gen(); plot.draw() }, 'butter'),
    ro,
    h('div.lab-hint', { html: '点線＝各基底 $w_j\\phi_j(x)$、太い赤線＝それらの和 $y(x,\\mathbf w)=\\mathbf w^{\\mathsf T}\\boldsymbol\\phi(x)$。どの基底でも重み $\\mathbf w$ に関して線形なので、計画行列 $\\Phi$ の正規方程式で一発計算！' }),
  )
  plot.draw()
  return () => plot.destroy()
}

// ═════════ ベイズ線形回帰：予測分布と不確実性バンド ═════════
function invertSym(A) {
  const M = A.length
  return Array.from({ length: M }, (_, i) => {
    const e = Array(M).fill(0); e[i] = 1
    return solve(A, e)
  })
}

export function bayesRegLab(body) {
  const { canvas, side } = layout(body)
  const M = 7
  let alpha = 1.5, beta = 16.0 // noise sd = 0.25
  let pts = [{ x: 0.15, t: Math.sin(2 * Math.PI * 0.15) + 0.05 }, { x: 0.25, t: Math.sin(2 * Math.PI * 0.25) - 0.08 }]
  let seed = 9
  const ro = readout([
    ['n', 'データ数 $N$'],
    ['unc', '$x=0.8$ での予測標準偏差 $\\sigma_N(0.8)$', true],
  ])
  const plot = new Plot(canvas, { aspect: 0.64, x: [0, 1], y: [-2, 2], onDraw: (g, P) => {
    P.axes({ xt: 5, yt: 4, xl: 'x（クリックで観測点を追加！）', yl: 't', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    const Phi = pts.map(p => makePhi(p.x, M, 'gauss'))
    const A = Array.from({ length: M }, (_, i) =>
      Array.from({ length: M }, (__, j) => {
        let s = i === j ? alpha : 0
        for (let n = 0; n < pts.length; n++) s += beta * Phi[n][i] * Phi[n][j]
        return s
      }),
    )
    const SN = invertSym(A)
    const b = Array.from({ length: M }, (_, i) => {
      let s = 0
      for (let n = 0; n < pts.length; n++) s += beta * Phi[n][i] * pts[n].t
      return s
    })
    const mN = solve(A, b)
    const meanAt = x => { const ph = makePhi(x, M, 'gauss'); return ph.reduce((s, v, i) => s + mN[i] * v, 0) }
    const sdAt = x => {
      const ph = makePhi(x, M, 'gauss')
      let q = 1 / beta
      for (let i = 0; i < M; i++) for (let j = 0; j < M; j++) q += ph[i] * SN[i][j] * ph[j]
      return Math.sqrt(Math.max(1e-6, q))
    }
    // ±1σ predictive band
    g.save()
    g.beginPath(); g.rect(P.pad[3], P.pad[0], P.iw, P.ih); g.clip()
    g.fillStyle = 'rgba(255,158,174,.38)'
    g.beginPath()
    const K = 160
    for (let i = 0; i <= K; i++) { const x = i / K; g.lineTo(P.X(x), P.Y(meanAt(x) + sdAt(x))) }
    for (let i = K; i >= 0; i--) { const x = i / K; g.lineTo(P.X(x), P.Y(meanAt(x) - sdAt(x))) }
    g.closePath(); g.fill()
    // 4 sampled curves from posterior using diagonal + Cholesky-like approx
    const rng = mulberry(77)
    for (let s = 0; s < 4; s++) {
      const z = Array.from({ length: M }, () => randn(rng))
      // L from Cholesky of SN
      const L = Array.from({ length: M }, () => Array(M).fill(0))
      for (let i = 0; i < M; i++) {
        for (let j = 0; j <= i; j++) {
          let sum = SN[i][j]
          for (let k = 0; k < j; k++) sum -= L[i][k] * L[j][k]
          L[i][j] = i === j ? Math.sqrt(Math.max(1e-9, sum)) : sum / (L[j][j] || 1e-6)
        }
      }
      const ws = mN.map((mv, i) => mv + L[i].reduce((acc, lij, j) => acc + lij * z[j], 0))
      P.fn(x => { const ph = makePhi(x, M, 'gauss'); return ph.reduce((acc, v, i) => acc + ws[i] * v, 0) }, { color: 'rgba(139,115,242,.55)', width: 1.8, n: 160 })
    }
    g.restore()
    P.fn(x => Math.sin(2 * Math.PI * x), { color: COL.mintD, width: 2.5, dash: [7, 6] })
    P.fn(meanAt, { color: COL.coralD, width: 4, n: 200 })
    pts.forEach(p => P.dot(p.x, p.t, { r: 6.5, fill: COL.butter }))
    ro.set('n', `${pts.length}`)
    ro.set('unc', `±${sdAt(0.8).toFixed(3)}  （ノイズ下限 √(1/β) = ${(1 / Math.sqrt(beta)).toFixed(3)}）`)
  } })
  plot.pointer({
    down: p => {
      pts.push({ x: clamp(p.x, 0.02, 0.98), t: clamp(p.y, -1.9, 1.9) })
      plot.draw()
    },
  })
  const addSin = () => {
    const r = mulberry(seed++)
    const x = 0.05 + 0.9 * r()
    pts.push({ x, t: Math.sin(2 * Math.PI * x) + randn(r) / Math.sqrt(beta) })
    plot.draw()
  }
  side.append(
    h('div.btn-row',
      button('➕ 真の曲線から1点観測', addSin, 'butter'),
      button('↺ 0点に戻す', () => { pts = []; plot.draw() }),
    ),
    slider({ label: '事前精度 $\\alpha$', min: 0.2, max: 6, step: 0.2, value: alpha, fmt: v => v.toFixed(1), onInput: v => { alpha = v; plot.draw() } }),
    slider({ label: 'ノイズ精度 $\\beta=1/\\sigma^2$', min: 4, max: 40, step: 2, value: beta, fmt: v => v.toFixed(0), onInput: v => { beta = v; plot.draw() } }),
    ro,
    h('div.lab-hint', { html: 'ピンクの帯＝予測分布の $\\pm 1\\sigma_N(x)$。左だけに点があるときは右側の帯が大きく膨らみ、右をクリックして点を足すと<b>その周りの帯だけがキュッと締まる</b>！' }),
  )
  plot.draw()
  return () => plot.destroy()
}
