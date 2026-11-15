import { h, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, clamp, rr } from '../lib/plot.js'
import { slider, seg, readout, button, layout, visibleLoop } from '../lib/labkit.js'

const sig = x => 1 / (1 + Math.exp(-clamp(x, -30, 30)))

function actFn(kind) {
  if (kind === 'relu') return [u => (u > 0 ? u : 0.02 * u), u => (u > 0 ? 1 : 0.02)]
  if (kind === 'sig') return [u => sig(u), u => { const s = sig(u); return s * (1 - s) }]
  return [u => Math.tanh(u), u => 1 - Math.tanh(u) ** 2]
}

// ═════════ 3層パーセプトロン実験室：XOR・同心円を曲げて分類 ═════════
export function mlpPlayground(body) {
  const { canvas, side } = layout(body)
  let dataset = 'xor', act = 'tanh', M = 6, lr = 0.15, running = true
  let epoch = 0, seed = 7, pts = [], W1 = [], W2 = []

  function makeData() {
    const r = mulberry(seed++)
    pts = []
    if (dataset === 'xor') {
      const cs = [[-0.9, -0.9, 0], [0.9, 0.9, 0], [-0.9, 0.9, 1], [0.9, -0.9, 1]]
      cs.forEach(([cx, cy, t]) => {
        for (let i = 0; i < 8; i++) pts.push({ x: cx + randn(r) * 0.28, y: cy + randn(r) * 0.28, t })
      })
    } else {
      for (let i = 0; i < 16; i++) {
        const th = (i / 16) * Math.PI * 2
        const rad = 0.42 + randn(r) * 0.12
        pts.push({ x: rad * Math.cos(th), y: rad * Math.sin(th), t: 1 })
      }
      for (let i = 0; i < 20; i++) {
        const th = (i / 20) * Math.PI * 2
        const rad = 1.35 + randn(r) * 0.16
        pts.push({ x: rad * Math.cos(th), y: rad * Math.sin(th), t: 0 })
      }
    }
  }

  function initWeights() {
    const r = mulberry(seed + 100)
    // W1: M × 3 (bias, x1, x2), W2: 1 × (M+1)
    W1 = Array.from({ length: M }, () => [randn(r) * 0.5, randn(r) * 1.1, randn(r) * 1.1])
    W2 = Array.from({ length: M + 1 }, () => randn(r) * 0.6)
    epoch = 0
  }

  function forward(x, y, f) {
    const u1 = Array(M), z1 = Array(M + 1)
    z1[0] = 1
    for (let j = 0; j < M; j++) {
      u1[j] = W1[j][0] + W1[j][1] * x + W1[j][2] * y
      z1[j + 1] = f(u1[j])
    }
    let u2 = 0
    for (let j = 0; j <= M; j++) u2 += W2[j] * z1[j]
    return { u1, z1, u2, y: sig(u2) }
  }

  function trainStep(steps = 8) {
    const [f, df] = actFn(act)
    const N = pts.length
    for (let s = 0; s < steps; s++) {
      const gW1 = Array.from({ length: M }, () => [0, 0, 0])
      const gW2 = Array(M + 1).fill(0)
      for (const p of pts) {
        const fw = forward(p.x, p.y, f)
        const dk = fw.y - p.t // output error δ_k = y_k - t_k
        for (let j = 0; j <= M; j++) gW2[j] += dk * fw.z1[j]
        for (let j = 0; j < M; j++) {
          const dj = df(fw.u1[j]) * W2[j + 1] * dk // backprop formula!
          gW1[j][0] += dj
          gW1[j][1] += dj * p.x
          gW1[j][2] += dj * p.y
        }
      }
      for (let j = 0; j <= M; j++) W2[j] -= (lr / N) * gW2[j]
      for (let j = 0; j < M; j++) for (let i = 0; i < 3; i++) W1[j][i] -= (lr / N) * gW1[j][i]
      epoch++
    }
  }

  makeData(); initWeights()

  const ro = readout([
    ['ep', 'エポック数'],
    ['acc', '正解率'],
    ['loss', '交差エントロピー誤差', true],
  ])

  const plot = new Plot(canvas, { aspect: 0.72, x: [-1.9, 1.9], y: [-1.9, 1.9], onDraw: (g, P) => {
    const [f] = actFn(act)
    const nx = 42, ny = 42
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
      const x = P.xr[0] + ((i + 0.5) / nx) * (P.xr[1] - P.xr[0])
      const y = P.yr[0] + ((j + 0.5) / ny) * (P.yr[1] - P.yr[0])
      const pr = forward(x, y, f).y
      g.fillStyle = pr >= 0.5
        ? `rgba(255,142,110,${0.08 + 0.38 * (pr - 0.5) * 2})`
        : `rgba(111,214,184,${0.08 + 0.38 * (0.5 - pr) * 2})`
      g.fillRect(P.pad[3] + (i / nx) * P.iw, P.pad[0] + (1 - (j + 1) / ny) * P.ih, P.iw / nx + 1, P.ih / ny + 1)
    }
    P.axes({ xt: 4, yt: 4, xl: 'x₁', yl: 'x₂', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    // faint hidden unit lines w_j0 + w_j1 x + w_j2 y = 0
    for (let j = 0; j < M; j++) {
      const [b0, b1, b2] = W1[j]
      if (Math.abs(b2) > 0.05) P.fn(x => -(b0 + b1 * x) / b2, { color: 'rgba(42,37,64,.16)', width: 1.2, dash: [4, 4] })
    }
    let ok = 0, ce = 0
    pts.forEach(p => {
      const pr = clamp(forward(p.x, p.y, f).y, 1e-6, 1 - 1e-6)
      if ((pr >= 0.5 ? 1 : 0) === p.t) ok++
      ce -= p.t * Math.log(pr) + (1 - p.t) * Math.log(1 - pr)
      P.dot(p.x, p.y, { r: 6.2, fill: p.t === 1 ? COL.coral : COL.mint })
    })
    ro.set('ep', `${epoch}`)
    ro.set('acc', `${Math.round((ok / pts.length) * 100)}% (${ok}/${pts.length})`, ok === pts.length ? 'good' : '')
    ro.set('loss', (ce / pts.length).toFixed(4))
  } })

  const playBtn = button('⏸ 一時停止', () => {
    running = !running
    playBtn.textContent = running ? '⏸ 一時停止' : '▶ 学習スタート'
  }, 'butter')

  const stopLoop = visibleLoop(body, () => {
    if (running && epoch < 1200) {
      trainStep(6)
      plot.draw()
    }
  })

  side.append(
    seg({ label: 'データ形状', options: [['xor', '✖ XOR（線形分離不可）'], ['circle', '◎ 同心円']], value: dataset, onChange: v => { dataset = v; makeData(); initWeights(); running = true; playBtn.textContent = '⏸ 一時停止'; plot.draw() } }),
    seg({ label: '中間層の活性化関数 $f_1$', options: [['tanh', 'tanh'], ['relu', 'ReLU'], ['sig', 'σ(u)']], value: act, onChange: v => { act = v; initWeights(); running = true; playBtn.textContent = '⏸ 一時停止'; plot.draw() } }),
    slider({ label: '中間層ユニット数 $M$', min: 2, max: 12, step: 1, value: M, fmt: v => v, onInput: v => { M = v; initWeights(); running = true; plot.draw() } }),
    h('div.btn-row', playBtn, button('↺ 重みリセット', () => { initWeights(); running = true; playBtn.textContent = '⏸ 一時停止'; toast('重みを再初期化して学習再開！'); plot.draw() })),
    ro,
    h('div.lab-hint', { html: '薄い点線＝各中間ユニットが作る直線 $u_j=0$。これらを適応的に動かし組み合わせることで、1本の直線では絶対に分けられない XOR や同心円をきれいに分離する！' }),
  )
  plot.draw()
  return () => { stopLoop(); plot.destroy() }
}

// ═════════ 順伝播・誤差逆伝播のステップ図解ラボ（2入力 → 2中間 → 1出力） ═════════
export function backpropFlow(body) {
  const { canvas, side } = layout(body)
  let phase = 0 // 0: forward, 1: output delta, 2: backprop hidden delta, 3: weight update
  const x = [0.8, -0.5], t = 1.0, eta = 0.5
  let w1 = [[0.6, -0.4], [-0.5, 0.9]] // 2×2 (no bias for crystal-clear diagram)
  let w2 = [0.8, -0.7]

  const phases = [
    ['① 順伝播', '入力 $x_i$ から活性 $u_j=\\sum w_{ji}x_i$ と出力 $z_j=\\tanh(u_j)$、最終出力 $y$ を右へ計算！'],
    ['② 出力誤差 $\\delta_k$', '出力層で $\\delta_1 = y - t$（予測と正解のズレ）を計算！'],
    ['③ 逆伝播 $\\delta_j$', 'チェインルール $\\delta_j = (1-z_j^2)\\,w_{1j}\\,\\delta_1$ で誤差を左の中間層へ逆向きに伝播！'],
    ['④ 勾配と重み更新', '各リンクで $\\frac{\\partial E}{\\partial w_{ji}} = \\delta_j z_i$ を掛け算し、$w \\leftarrow w - \\eta\\,\\delta_j z_i$ で誤差 $E$ が減少！'],
  ]

  function compute() {
    const u1 = [w1[0][0] * x[0] + w1[0][1] * x[1], w1[1][0] * x[0] + w1[1][1] * x[1]]
    const z1 = u1.map(u => Math.tanh(u))
    const u2 = w2[0] * z1[0] + w2[1] * z1[1]
    const y = u2 // regression identity output
    const E = 0.5 * (y - t) ** 2
    const dk = y - t
    const d1 = [0, 1].map(j => (1 - z1[j] ** 2) * w2[j] * dk)
    return { u1, z1, u2, y, E, dk, d1 }
  }

  const ro = readout([
    ['ph', '現在のフェーズ', true],
    ['y', '出力 $y$（目標 $t=1.00$）'],
    ['e', '2乗誤差 $E = \\frac12(y-t)^2$'],
  ])

  const host = document.createElement('canvas')
  canvas.append(host)
  const ctx = host.getContext('2d')

  function draw() {
    const W = canvas.clientWidth || 560, H = Math.max(260, Math.min(360, W * 0.6))
    canvas.style.height = H + 'px'
    const d = Math.min(2, devicePixelRatio || 1)
    host.width = W * d; host.height = H * d
    host.style.width = W + 'px'; host.style.height = H + 'px'
    ctx.setTransform(d, 0, 0, d, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const c = compute()
    const posX = [W * 0.16, W * 0.52, W * 0.84]
    const posIn = [[posX[0], H * 0.3], [posX[0], H * 0.72]]
    const posHid = [[posX[1], H * 0.3], [posX[1], H * 0.72]]
    const posOut = [posX[2], H * 0.51]

    const link = (p1, p2, wt, gradVal, hiFwd, hiBwd) => {
      ctx.save()
      ctx.strokeStyle = hiBwd ? COL.coralD : hiFwd ? COL.skyD : COL.ink
      ctx.lineWidth = (hiBwd || hiFwd) ? 4 : 2.5
      ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke()
      const mx = (p1[0] + p2[0]) / 2, my = (p1[1] + p2[1]) / 2
      const txt = phase === 3 ? `∂E/∂w=${gradVal.toFixed(2)}` : `w=${wt.toFixed(2)}`
      ctx.font = '700 11px "DM Mono", monospace'
      const tw = ctx.measureText(txt).width + 10
      ctx.fillStyle = phase === 3 ? '#FFF0B8' : '#fff'; ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.8
      rr(ctx, mx - tw / 2, my - 11, tw, 20, 8); ctx.fill(); ctx.stroke()
      ctx.fillStyle = COL.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(txt, mx, my - 1)
      ctx.restore()
    }

    for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) {
      link(posIn[i], posHid[j], w1[j][i], c.d1[j] * x[i], phase === 0, phase >= 2)
    }
    for (let j = 0; j < 2; j++) {
      link(posHid[j], posOut, w2[j], c.dk * c.z1[j], phase === 0, phase >= 1)
    }

    const node = (p, title, sub, bg, badge) => {
      ctx.save()
      ctx.beginPath(); ctx.arc(p[0], p[1], 27, 0, Math.PI * 2)
      ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = COL.ink; ctx.stroke()
      ctx.font = '800 12px "DM Mono", monospace'; ctx.fillStyle = COL.ink; ctx.textAlign = 'center'
      ctx.fillText(title, p[0], p[1] - 4)
      ctx.font = '600 10.5px "DM Mono", monospace'; ctx.fillStyle = COL.ink2
      ctx.fillText(sub, p[0], p[1] + 12)
      if (badge) {
        const bw = ctx.measureText(badge).width + 12
        ctx.fillStyle = COL.coral; ctx.strokeStyle = COL.ink; ctx.lineWidth = 2
        rr(ctx, p[0] - bw / 2, p[1] - 46, bw, 20, 9); ctx.fill(); ctx.stroke()
        ctx.fillStyle = COL.ink; ctx.font = '700 11px "DM Mono", monospace'
        ctx.fillText(badge, p[0], p[1] - 33)
      }
      ctx.restore()
    }

    posIn.forEach((p, i) => node(p, `x${i + 1}`, x[i].toFixed(2), '#DDEBFF', null))
    posHid.forEach((p, j) => node(p, `z${j + 1}`, c.z1[j].toFixed(2), '#ECE6FF', phase >= 2 ? `δ=${c.d1[j].toFixed(2)}` : null))
    node(posOut, 'y', c.y.toFixed(2), '#D7F5EC', phase >= 1 ? `δ=${c.dk.toFixed(2)}` : `t=${t.toFixed(1)}`)

    ro.set('ph', `${phases[phase][0]}`)
    ro.set('y', c.y.toFixed(3))
    ro.set('e', c.E.toFixed(4), c.E < 0.005 ? 'good' : '')
  }

  const roObs = new ResizeObserver(draw)
  roObs.observe(canvas)

  const stepNext = () => {
    if (phase < 3) {
      phase++
    } else {
      const c = compute()
      for (let j = 0; j < 2; j++) w2[j] -= eta * c.dk * c.z1[j]
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) w1[j][i] -= eta * c.d1[j] * x[i]
      phase = 0
      toast('重みを更新しました！ 誤差 E が小さくなったよ！', { kind: 'ok' })
    }
    draw()
  }

  side.append(
    h('div.btn-row',
      button('▶ 次のフェーズへ進める', stepNext, 'butter'),
      button('↺ 初期重み', () => { w1 = [[0.6, -0.4], [-0.5, 0.9]]; w2 = [0.8, -0.7]; phase = 0; draw() }),
    ),
    ro,
    h('div.lab-hint', { html: 'ボタンを押すたびに <b>①順伝播 → ②出力誤差 $\\delta_k=y-t$ → ③逆伝播 $\\delta_j$ → ④勾配 $\\delta_j z_i$ で重み更新</b> が1サイクル回り、出力 $y$ が目標 $t=1.00$ にどんどん近づく！' }),
  )
  draw()
  return () => roObs.disconnect()
}
