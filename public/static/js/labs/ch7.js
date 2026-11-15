import { h, toast } from '../lib/ui.js'
import { Plot, COL, clamp, rr } from '../lib/plot.js'
import { slider, readout, button, layout, tweenTo } from '../lib/labkit.js'

// ═════════ 2次形式 f(x) = (x-μ)^T A (x-μ) と勾配ベクトル ∇f = 2A(x-μ) ═════════
export function quadGrad(body) {
  const { canvas, side } = layout(body)
  let a11 = 2.0, a22 = 1.0, a12 = 0.5
  const mu = [0.5, 0.5]
  const st = { x: -1.4, y: 1.3 }
  const val = (x, y) => {
    const dx = x - mu[0], dy = y - mu[1]
    return a11 * dx * dx + 2 * a12 * dx * dy + a22 * dy * dy
  }
  const grad = (x, y) => {
    const dx = x - mu[0], dy = y - mu[1]
    return [2 * (a11 * dx + a12 * dy), 2 * (a12 * dx + a22 * dy)]
  }
  const ro = readout([
    ['f', '$f(\\mathbf x)$'],
    ['g', '勾配 $\\nabla f = 2A(\\mathbf x-\\boldsymbol\\mu)$', true],
  ])
  const plot = new Plot(canvas, { aspect: 0.72, x: [-2.5, 3], y: [-2, 2.8], onDraw: (g, P) => {
    P.axes({ xt: 5, yt: 5, xl: 'x₁', yl: 'x₂', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    // draw analytical ellipse contours for (x-mu)^T A (x-mu) = c
    const tr = a11 + a22, det = a11 * a22 - a12 * a12
    const disc = Math.sqrt(Math.max(0, (a11 - a22) ** 2 + 4 * a12 * a12))
    const l1 = Math.max(0.08, (tr + disc) / 2), l2 = Math.max(0.08, (tr - disc) / 2)
    const ang = 0.5 * Math.atan2(2 * a12, a11 - a22)
    ;[0.4, 1.2, 2.5, 4.5, 7.5, 11.5].forEach((c, ci) => {
      g.save()
      g.beginPath(); g.rect(P.pad[3], P.pad[0], P.iw, P.ih); g.clip()
      g.strokeStyle = ci === 2 ? COL.lavD : 'rgba(139,115,242,.38)'
      g.lineWidth = ci === 2 ? 2.4 : 1.5
      g.beginPath()
      const r1 = Math.sqrt(c / l1), r2 = Math.sqrt(c / l2)
      for (let i = 0; i <= 120; i++) {
        const th = (i / 120) * Math.PI * 2
        const u = r1 * Math.cos(th), v = r2 * Math.sin(th)
        const x = mu[0] + u * Math.cos(ang) - v * Math.sin(ang)
        const y = mu[1] + u * Math.sin(ang) + v * Math.cos(ang)
        i ? g.lineTo(P.X(x), P.Y(y)) : g.moveTo(P.X(x), P.Y(y))
      }
      g.stroke(); g.restore()
    })
    // valley minimum mu
    P.dot(mu[0], mu[1], { r: 7, fill: COL.mint, lw: 2.5 })
    P.label('極小点 μ', P.X(mu[0]), P.Y(mu[1]) + 22, { bg: '#D7F5EC' })
    // gradient arrow from st
    const [gx, gy] = grad(st.x, st.y)
    const scale = 0.16
    const tx = st.x + gx * scale, ty = st.y + gy * scale
    const x0 = P.X(st.x), y0 = P.Y(st.y), x1 = P.X(tx), y1 = P.Y(ty)
    if (Math.hypot(x1 - x0, y1 - y0) > 3) {
      g.save(); g.strokeStyle = COL.coralD; g.fillStyle = COL.coralD; g.lineWidth = 3.5; g.lineCap = 'round'
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke()
      const a = Math.atan2(y1 - y0, x1 - x0)
      g.beginPath()
      g.moveTo(x1, y1)
      g.lineTo(x1 - 11 * Math.cos(a - 0.45), y1 - 11 * Math.sin(a - 0.45))
      g.lineTo(x1 - 11 * Math.cos(a + 0.45), y1 - 11 * Math.sin(a + 0.45))
      g.closePath(); g.fill(); g.restore()
    }
    P.dot(st.x, st.y, { r: 8.5, fill: COL.butter, lw: 2.8 })
    P.label('x (ドラッグ)', P.X(st.x), P.Y(st.y) - 20, { bg: COL.butter })
    const f = val(st.x, st.y)
    ro.set('f', f.toFixed(3), f < 0.03 ? 'good' : '')
    ro.set('g', `(${gx.toFixed(2)}, ${gy.toFixed(2)})ᵀ`)
  } })
  const move = p => { st.x = clamp(p.x, -2.3, 2.8); st.y = clamp(p.y, -1.8, 2.6); plot.draw() }
  plot.pointer({ down: move, drag: move })
  const stepGD = () => {
    const [gx, gy] = grad(st.x, st.y)
    tweenTo(st, 'x', mu[0], 700, () => plot.draw())
    tweenTo(st, 'y', mu[1], 700, () => plot.draw()).then(() => toast('∇f(x) = 0 の谷底 μ に到達！', { kind: 'ok' }))
    void gx; void gy
  }
  side.append(
    slider({ label: '対角成分 $a_{11}$', min: 0.6, max: 3.5, step: 0.1, value: a11, fmt: v => v.toFixed(1), onInput: v => { a11 = v; a12 = clamp(a12, -0.8 * Math.sqrt(a11 * a22), 0.8 * Math.sqrt(a11 * a22)); plot.draw() } }),
    slider({ label: '非対角（傾き）$a_{12}$', min: -1.1, max: 1.1, step: 0.05, value: a12, fmt: v => v.toFixed(2), onInput: v => { const lim = 0.85 * Math.sqrt(a11 * a22); a12 = clamp(v, -lim, lim); plot.draw() } }),
    ro,
    button('⛰ −∇f 方向へ谷底まで降下', stepGD, 'butter'),
    h('div.lab-hint', { html: '赤い矢印＝勾配 $\\nabla f(\\mathbf x)=2A(\\mathbf x-\\boldsymbol\\mu)$（関数がいちばん急激に増える向き）。その逆向きに進めば極小点 $\\boldsymbol\\mu$ へたどり着く。' }),
  )
  plot.draw()
  return () => plot.destroy()
}

// ═════════ 2×2 行列の空間変換・固有値・トレース・行列式 ═════════
export function matTransform(body) {
  const { canvas, side } = layout(body)
  let a11 = 1.6, a22 = 0.8, a12 = 0.5
  const ro = readout([
    ['tr', 'トレース $\\mathrm{Tr}(A)$'],
    ['det', '行列式 $|A|$'],
    ['eig', '固有値 $\\lambda_1, \\lambda_2$', true],
  ])
  const plot = new Plot(canvas, { aspect: 0.74, x: [-2.6, 2.6], y: [-2.4, 2.4], onDraw: (g, P) => {
    P.axes({ xt: 4, yt: 4, xl: 'x₁', yl: 'x₂', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    // unit circle dashed
    g.save(); g.setLineDash([6, 5]); g.strokeStyle = COL.ink3; g.lineWidth = 2
    g.beginPath()
    for (let i = 0; i <= 100; i++) {
      const th = (i / 100) * Math.PI * 2
      const px = P.X(Math.cos(th)), py = P.Y(Math.sin(th))
      i ? g.lineTo(px, py) : g.moveTo(px, py)
    }
    g.stroke(); g.restore()
    // transformed unit circle -> filled ellipse
    g.save(); g.fillStyle = 'rgba(255,184,107,.32)'; g.strokeStyle = COL.coralD; g.lineWidth = 3.5
    g.beginPath()
    for (let i = 0; i <= 120; i++) {
      const th = (i / 120) * Math.PI * 2
      const cx = Math.cos(th), cy = Math.sin(th)
      const ux = a11 * cx + a12 * cy, uy = a12 * cx + a22 * cy
      i ? g.lineTo(P.X(ux), P.Y(uy)) : g.moveTo(P.X(ux), P.Y(uy))
    }
    g.closePath(); g.fill(); g.stroke(); g.restore()
    // eigenvectors of symmetric A = [[a11,a12],[a12,a22]]
    const tr = a11 + a22, det = a11 * a22 - a12 * a12
    const disc = Math.sqrt(Math.max(0, (a11 - a22) ** 2 + 4 * a12 * a12))
    const l1 = (tr + disc) / 2, l2 = (tr - disc) / 2
    const ang = 0.5 * Math.atan2(2 * a12, a11 - a22)
    const dirs = [[Math.cos(ang), Math.sin(ang), l1, COL.lavD, 'λ₁u₁'], [-Math.sin(ang), Math.cos(ang), l2, COL.mintD, 'λ₂u₂']]
    dirs.forEach(([ux, uy, lam, col, lb]) => {
      g.save(); g.strokeStyle = col; g.lineWidth = 3.2; g.lineCap = 'round'
      g.beginPath(); g.moveTo(P.X(0), P.Y(0)); g.lineTo(P.X(ux * lam), P.Y(uy * lam)); g.stroke()
      P.dot(ux * lam, uy * lam, { r: 6, fill: col })
      P.label(lb, P.X(ux * lam) + (ux >= 0 ? 22 : -22), P.Y(uy * lam) - 14, { bg: '#fff', color: col })
      g.restore()
    })
    // matrix badge
    g.save(); g.fillStyle = '#fff'; g.strokeStyle = COL.ink; g.lineWidth = 2
    rr(g, P.pad[3] + 8, P.pad[0] + 6, 138, 48, 10); g.fill(); g.stroke()
    g.font = '700 12px "DM Mono", monospace'; g.fillStyle = COL.ink
    g.fillText(`A = [${a11.toFixed(1)}  ${a12.toFixed(1)}]`, P.pad[3] + 16, P.pad[0] + 24)
    g.fillText(`    [${a12.toFixed(1)}  ${a22.toFixed(1)}]`, P.pad[3] + 16, P.pad[0] + 44)
    g.restore()
    ro.set('tr', `${tr.toFixed(2)}`)
    ro.set('det', `${det.toFixed(2)}`, det > 0 ? 'good' : 'bad')
    ro.set('eig', `λ₁ = ${l1.toFixed(2)},  λ₂ = ${l2.toFixed(2)}  （和=${(l1 + l2).toFixed(2)}, 積=${(l1 * l2).toFixed(2)}）`)
  } })
  side.append(
    slider({ label: '成分 $a_{11}$', min: 0.2, max: 2.2, step: 0.1, value: a11, fmt: v => v.toFixed(1), onInput: v => { a11 = v; plot.draw() } }),
    slider({ label: '成分 $a_{22}$', min: 0.2, max: 2.2, step: 0.1, value: a22, fmt: v => v.toFixed(1), onInput: v => { a22 = v; plot.draw() } }),
    slider({ label: '対称成分 $a_{12}=a_{21}$', min: -1.2, max: 1.2, step: 0.1, value: a12, fmt: v => v.toFixed(1), onInput: v => { a12 = v; plot.draw() } }),
    ro,
    h('div.lab-hint', { html: '対称行列 $A$ の固有ベクトル $\\mathbf u_1,\\mathbf u_2$ は<b>つねに直交</b>！ $\\mathrm{Tr}(A)=\\lambda_1+\\lambda_2$、$|A|=\\lambda_1\\lambda_2$ になることも数値で確かめよう。' }),
  )
  plot.draw()
  return () => plot.destroy()
}
