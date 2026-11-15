import { h, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, solve, clamp, rr } from '../lib/plot.js'
import { slider, readout, button, layout } from '../lib/labkit.js'

function gaussBasis(x, M) {
  const out = [1]
  const s = 1 / Math.max(2, M - 1)
  for (let j = 1; j < M; j++) {
    const mu = (j - 0.5) / (M - 1)
    out.push(Math.exp(-((x - mu) ** 2) / (2 * s * s)))
  }
  return out
}

// Symmetric Jacobi eigenvalue solver for small M×M matrix
function symEig(B) {
  const n = B.length
  const A = B.map(r => [...r])
  for (let it = 0; it < 60; it++) {
    let p = 0, q = 1, mx = 0
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (Math.abs(A[i][j]) > mx) { mx = Math.abs(A[i][j]); p = i; q = j }
    }
    if (mx < 1e-10) break
    const tau = (A[q][q] - A[p][p]) / (2 * A[p][q])
    const t = Math.sign(tau || 1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau))
    const c = 1 / Math.sqrt(1 + t * t), s = t * c
    const app = A[p][p], aqq = A[q][q], apq = A[p][q]
    A[p][p] = app - t * apq; A[q][q] = aqq + t * apq; A[p][q] = A[q][p] = 0
    for (let k = 0; k < n; k++) if (k !== p && k !== q) {
      const akp = A[k][p], akq = A[k][q]
      A[k][p] = A[p][k] = c * akp - s * akq
      A[k][q] = A[q][k] = s * akp + c * akq
    }
  }
  return Array.from({ length: n }, (_, i) => Math.max(0, A[i][i]))
}

// ═════════ エビデンス近似ラボ：対数エビデンス ln p(t|α,β) と有効パラメータ数 γ ═════════
export function evidenceLab(body) {
  const { canvas, side } = layout(body)
  let M = 8, logAlpha = 0, beta = 14 // noise variance ~ 0.07
  let seed = 12, pts = []
  const gen = () => {
    const r = mulberry(seed++)
    pts = Array.from({ length: 15 }, (_, i) => {
      const x = (i + 0.5) / 15
      return { x, t: Math.sin(2 * Math.PI * x) + randn(r) * 0.25 }
    })
  }
  gen()

  function evalModel(alpha) {
    const N = pts.length
    const Phi = pts.map(p => gaussBasis(p.x, M))
    const B = Array.from({ length: M }, (_, i) =>
      Array.from({ length: M }, (__, j) => {
        let s = 0
        for (let n = 0; n < N; n++) s += beta * Phi[n][i] * Phi[n][j]
        return s
      }),
    )
    const A = B.map((row, i) => row.map((v, j) => v + (i === j ? alpha : 0)))
    const rhs = Array.from({ length: M }, (_, i) => {
      let s = 0
      for (let n = 0; n < N; n++) s += beta * Phi[n][i] * pts[n].t
      return s
    })
    const mN = solve(A, rhs)
    const lams = symEig(B)
    const logDetA = lams.reduce((s, l) => s + Math.log(Math.max(1e-12, l + alpha)), 0)
    const gamma = lams.reduce((s, l) => s + l / (l + alpha), 0)
    const sse = pts.reduce((s, p, n) => {
      const pred = Phi[n].reduce((acc, v, j) => acc + mN[j] * v, 0)
      return s + (p.t - pred) ** 2
    }, 0)
    const mNorm2 = mN.reduce((s, w) => s + w * w, 0)
    const EmN = 0.5 * beta * sse + 0.5 * alpha * mNorm2
    const logEv = 0.5 * M * Math.log(alpha) + 0.5 * N * Math.log(beta) - EmN - 0.5 * logDetA - 0.5 * N * Math.log(2 * Math.PI)
    return { mN, lams, gamma, mNorm2, sse, logEv }
  }

  const ro = readout([
    ['gam', '有効パラメータ数 $\\gamma$（総数 $M$ 中）'],
    ['ev', '対数エビデンス $\\ln p(\\mathbf t\\mid\\alpha,\\beta)$'],
    ['ab', '現在の $\\alpha,\\ \\beta$', true],
  ])
  const sAlpha = slider({ label: '$\\log_{10}\\alpha$（事前精度）', min: -2.5, max: 2.5, step: 0.05, value: logAlpha, fmt: v => `α=${(10 ** v).toFixed(2)}`, onInput: v => { logAlpha = v; plot.draw() } })

  const plot = new Plot(canvas, { aspect: 0.64, x: [0, 1], y: [-1.8, 1.8], onDraw: (g, P) => {
    P.axes({ xt: 5, yt: 4, xl: 'x', yl: 't', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    const alpha = 10 ** logAlpha
    const cur = evalModel(alpha)
    P.fn(x => Math.sin(2 * Math.PI * x), { color: COL.mintD, width: 2.4, dash: [7, 6] })
    P.fn(x => { const ph = gaussBasis(x, M); return ph.reduce((s, v, j) => s + cur.mN[j] * v, 0) }, { color: COL.coralD, width: 4.2, n: 220 })
    pts.forEach(p => P.dot(p.x, p.t, { r: 6, fill: COL.butter }))
    // Inset: log evidence curve vs log10(alpha)
    const iw = Math.min(200, P.W * 0.38), ih = iw * 0.6, ix = P.W - P.pad[1] - iw - 8, iy = P.pad[0] + 6
    g.save(); g.fillStyle = 'rgba(255,255,255,.94)'; g.strokeStyle = COL.ink; g.lineWidth = 2.2
    rr(g, ix, iy, iw, ih, 11); g.fill(); g.stroke()
    const grid = []
    for (let i = 0; i <= 40; i++) { const la = -2.5 + (5 * i) / 40; grid.push([la, evalModel(10 ** la).logEv]) }
    const ymax = Math.max(...grid.map(d => d[1])), ymin = Math.max(ymax - 18, Math.min(...grid.map(d => d[1])))
    const mx = la => ix + 10 + ((la + 2.5) / 5) * (iw - 20)
    const my = v => iy + 22 + (1 - (clamp(v, ymin, ymax) - ymin) / Math.max(1e-3, ymax - ymin)) * (ih - 32)
    g.strokeStyle = COL.skyD; g.lineWidth = 2.8; g.beginPath()
    grid.forEach(([la, v], i) => (i ? g.lineTo(mx(la), my(v)) : g.moveTo(mx(la), my(v))))
    g.stroke()
    g.beginPath(); g.arc(mx(logAlpha), my(cur.logEv), 5.5, 0, 7); g.fillStyle = COL.butter; g.fill(); g.lineWidth = 2; g.strokeStyle = COL.ink; g.stroke()
    g.font = '700 10.5px "Zen Maru Gothic", sans-serif'; g.fillStyle = COL.ink2
    g.fillText('対数エビデンス ln p(t|α)', ix + 10, iy + 15)
    g.restore()
    ro.set('gam', `${cur.gamma.toFixed(2)} / ${M}`)
    ro.set('ev', cur.logEv.toFixed(2), cur.logEv >= ymax - 0.15 ? 'good' : '')
    ro.set('ab', `α = ${alpha.toFixed(3)},   β = ${beta.toFixed(1)} (σ ≈ ${(1 / Math.sqrt(beta)).toFixed(2)})`)
  } })

  const autoFit = () => {
    let a = 10 ** logAlpha, b = beta
    for (let it = 0; it < 18; it++) {
      beta = b
      const st = evalModel(a)
      a = clamp(st.gamma / Math.max(1e-4, st.mNorm2), 1e-2, 200)
      const denom = Math.max(1, pts.length - st.gamma)
      b = clamp(denom / Math.max(1e-3, st.sse), 2, 60)
    }
    beta = b
    logAlpha = clamp(Math.log10(a), -2.5, 2.5)
    sAlpha.set(logAlpha)
    plot.draw()
    toast(`収束！ α=${(10 ** logAlpha).toFixed(2)}, β=${beta.toFixed(1)}（エビデンス最大）`, { kind: 'ok' })
  }

  side.append(
    sAlpha,
    slider({ label: '基底の総数 $M$', min: 4, max: 12, step: 1, value: M, fmt: v => v, onInput: v => { M = v; plot.draw() } }),
    h('div.btn-row',
      button('⚡ α, β を自動反復（経験ベイズ）', autoFit, 'butter'),
      button('🎲 再生成', () => { gen(); plot.draw() }),
    ),
    ro,
    h('div.lab-hint', { html: '右上の小窓が $\\ln p(\\mathbf t\\mid\\alpha)$ の山。「自動反復」を押すと $\\alpha=\\gamma/\\|\\mathbf m_N\\|^2$ と $\\beta^{-1}=\\text{SSE}/(N-\\gamma)$ の不動点反復で山頂へピタッと収束する！' }),
  )
  plot.draw()
  return () => plot.destroy()
}
