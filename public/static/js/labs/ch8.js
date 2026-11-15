import { h, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, lgamma, clamp } from '../lib/plot.js'
import { slider, readout, button, layout } from '../lib/labkit.js'

// ═════════ 2次元ガウス分布の最尤推定（クリックで点追加・平均と共分散楕円をリアルタイム推定） ═════════
export function gaussMle2d(body) {
  const { canvas, side } = layout(body)
  let seed = 11
  let pts = []
  const resetSample = () => {
    const r = mulberry(seed++)
    pts = []
    for (let i = 0; i < 16; i++) {
      const z1 = randn(r), z2 = randn(r)
      pts.push({ x: 0.4 + 0.9 * z1, y: 0.2 + 0.55 * z1 + 0.55 * z2 })
    }
  }
  resetSample()
  const ro = readout([
    ['n', 'データ数 $N$'],
    ['mu', '標本平均 $\\boldsymbol\\mu_{\\mathrm{ML}}$'],
    ['cov', '標本共分散 $\\Sigma_{\\mathrm{ML}}$', true],
  ])
  const plot = new Plot(canvas, { aspect: 0.72, x: [-3, 3.5], y: [-2.8, 3.2], onDraw: (g, P) => {
    P.axes({ xt: 6, yt: 6, xl: 'x₁', yl: 'x₂', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    const N = pts.length
    if (N >= 2) {
      const mx = pts.reduce((s, p) => s + p.x, 0) / N
      const my = pts.reduce((s, p) => s + p.y, 0) / N
      let s11 = 0, s22 = 0, s12 = 0
      pts.forEach(p => { const dx = p.x - mx, dy = p.y - my; s11 += dx * dx; s22 += dy * dy; s12 += dx * dy })
      s11 = s11 / N + 1e-4; s22 = s22 / N + 1e-4; s12 /= N
      const tr = s11 + s22
      const disc = Math.sqrt(Math.max(0, (s11 - s22) ** 2 + 4 * s12 * s12))
      const l1 = Math.max(1e-3, (tr + disc) / 2), l2 = Math.max(1e-3, (tr - disc) / 2)
      const ang = 0.5 * Math.atan2(2 * s12, s11 - s22)
      ;[2, 1].forEach(k => {
        g.save()
        g.beginPath(); g.rect(P.pad[3], P.pad[0], P.iw, P.ih); g.clip()
        g.fillStyle = k === 1 ? 'rgba(111,214,184,.28)' : 'rgba(111,214,184,.12)'
        g.strokeStyle = k === 1 ? COL.mintD : COL.ink3
        g.lineWidth = k === 1 ? 3.5 : 2
        if (k === 2) g.setLineDash([6, 5])
        g.beginPath()
        for (let i = 0; i <= 120; i++) {
          const th = (i / 120) * Math.PI * 2
          const u = k * Math.sqrt(l1) * Math.cos(th), v = k * Math.sqrt(l2) * Math.sin(th)
          const x = mx + u * Math.cos(ang) - v * Math.sin(ang)
          const y = my + u * Math.sin(ang) + v * Math.cos(ang)
          i ? g.lineTo(P.X(x), P.Y(y)) : g.moveTo(P.X(x), P.Y(y))
        }
        g.closePath(); g.fill(); g.stroke(); g.restore()
      })
      P.dot(mx, my, { r: 8.5, fill: COL.coral, lw: 2.8 })
      P.label('μ_ML', P.X(mx), P.Y(my) - 20, { bg: '#FFE3D6' })
      ro.set('n', `${N}`)
      ro.set('mu', `(${mx.toFixed(2)}, ${my.toFixed(2)})ᵀ`)
      ro.set('cov', `[[${s11.toFixed(2)}, ${s12.toFixed(2)}], [${s12.toFixed(2)}, ${s22.toFixed(2)}]]`)
    }
    pts.forEach(p => P.dot(p.x, p.y, { r: 5.5, fill: COL.butter }))
  } })
  plot.pointer({
    down: p => {
      pts.push({ x: clamp(p.x, -2.9, 3.4), y: clamp(p.y, -2.7, 3.1) })
      plot.draw()
    },
  })
  side.append(
    h('div.btn-row',
      button('🎲 サンプル再生成', () => { resetSample(); plot.draw() }, 'butter'),
      button('🧹 3点まで減らす', () => { pts = pts.slice(0, 3); plot.draw(); toast('点が少ないと共分散推定が不安定に！', { kind: 'info' }) }),
    ),
    ro,
    h('div.lab-hint', { html: 'キャンバスを<b>クリック</b>するとその場所にデータが追加され、$\\boldsymbol\\mu_{\\mathrm{ML}}$ と $\\Sigma_{\\mathrm{ML}}$（実線 $1\\sigma$・点線 $2\\sigma$）が即座に再計算されるよ。' }),
  )
  plot.draw()
  return () => plot.destroy()
}

// ═════════ ガンマ分布 Gam(λ|a,b) とガウス精度 λ=1/σ² のベイズ更新 ═════════
const gamPdf = (lam, a, b) => lam <= 0 ? 0 : Math.exp(a * Math.log(b) + (a - 1) * Math.log(lam) - b * lam - lgamma(a))

export function gammaPrecision(body) {
  const { canvas, side } = layout(body)
  const trueMu = 0, trueLam = 1.6 // true sigma^2 = 0.625
  let a0 = 2.0, b0 = 2.0
  let xs = [], seed = 31
  const addData = k => {
    const r = mulberry(seed++)
    for (let i = 0; i < k; i++) xs.push(trueMu + randn(r) / Math.sqrt(trueLam))
    plot.draw()
  }
  const ro = readout([
    ['n', 'データ数 $N$'],
    ['ab', '事後 $(a_N, b_N)$'],
    ['mean', '事後期待値 $\\mathbb E[\\lambda]=a_N/b_N$（真の $\\lambda=1.60$）', true],
  ])
  const plot = new Plot(canvas, { aspect: 0.6, x: [0, 4], y: [0, 2.2], onDraw: (g, P) => {
    const N = xs.length
    const ss = xs.reduce((s, x) => s + (x - trueMu) ** 2, 0)
    const aN = a0 + N / 2, bN = b0 + ss / 2
    const prior = l => gamPdf(l, a0, b0)
    const post = l => gamPdf(l, aN, bN)
    let mx = 0.5
    for (let i = 1; i <= 200; i++) { const l = (i / 200) * 4; mx = Math.max(mx, prior(l), post(l)) }
    P.yr = [0, Math.min(8, mx * 1.18)]
    P.axes({ xt: 4, yt: 4, xl: '精度 λ = 1/σ²', yl: '確率密度', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    P.area(post, { color: 'rgba(111,214,184,.35)', n: 260 })
    P.fn(prior, { color: COL.lavD, width: 3, dash: [7, 5], n: 260 })
    P.fn(post, { color: COL.mintD, width: 4.2, n: 260 })
    P.vline(trueLam, { color: COL.coralD, dash: [4, 4], width: 2.5 })
    P.label('真の λ = 1.6', P.X(trueLam), P.pad[0] + 14, { bg: '#FFE3D6' })
    P.label('事前 Gam(a₀,b₀)', P.X(Math.min(3.5, a0 / b0)), P.pad[0] + 42, { bg: '#ECE6FF' })
    const est = aN / bN
    ro.set('n', `${N}`)
    ro.set('ab', `(${aN.toFixed(1)}, ${bN.toFixed(2)})`)
    ro.set('mean', `${est.toFixed(3)}  （推定 σ² ≈ ${(1 / est).toFixed(3)}）`, Math.abs(est - trueLam) < 0.2 ? 'good' : '')
    void g
  } })
  side.append(
    h('div.btn-row',
      button('➕ データ +1個', () => addData(1), 'butter'),
      button('🚀 +10個', () => addData(10), 'mint'),
      button('↺ リセット', () => { xs = []; plot.draw() }),
    ),
    slider({ label: '事前パラメータ $a_0$', min: 1, max: 8, step: 0.5, value: a0, fmt: v => v.toFixed(1), onInput: v => { a0 = v; plot.draw() } }),
    slider({ label: '事前パラメータ $b_0$', min: 0.5, max: 6, step: 0.5, value: b0, fmt: v => v.toFixed(1), onInput: v => { b0 = v; plot.draw() } }),
    ro,
    h('div.lab-hint', { html: '点線紫＝事前分布 $\\mathrm{Gam}(\\lambda\\mid a_0,b_0)$、緑＝事後分布 $\\mathrm{Gam}(\\lambda\\mid a_N,b_N)$。データを足すごとに $a_N=a_0+N/2$ が増え、真の精度 $\\lambda=1.6$ のまわりに細く集中していく！' }),
  )
  addData(2)
  return () => plot.destroy()
}
