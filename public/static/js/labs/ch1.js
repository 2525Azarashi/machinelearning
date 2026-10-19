import { h, rich, tex, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, polyfit, polyval, clamp, rr } from '../lib/plot.js'
import { slider, seg, readout, button, layout, visibleLoop, tweenTo } from '../lib/labkit.js'

// ═════════ 教師あり / 教師なし ═════════
export function supervised(body) {
  const { canvas, side } = layout(body)
  const rng = mulberry(7)
  const centers = [[0.28, 0.68, COL.coral], [0.72, 0.7, COL.mint], [0.5, 0.26, COL.lav]]
  const pts = []
  centers.forEach(([cx, cy], k) => { for (let i = 0; i < 14; i++) pts.push({ x: cx + randn(rng) * .075, y: cy + randn(rng) * .075, k, a: k }) })
  let mode = 'sup'
  let means = [[0.2, 0.2], [0.8, 0.3], [0.5, 0.85]]
  let probe = null
  let kmRunning = false, step0 = true
  const plot = new Plot(canvas, { aspect: .66, pad: [14, 14, 14, 14], onDraw: draw })
  function centroid(k, key) { const s = pts.filter(p => p[key] === k); return [s.reduce((a, p) => a + p.x, 0) / s.length, s.reduce((a, p) => a + p.y, 0) / s.length] }
  function draw(g, P) {
    // decision regions (supervised: nearest centroid)
    if (mode === 'sup') {
      const cs = [0, 1, 2].map(k => centroid(k, 'k'))
      const step = 12
      for (let px = P.pad[3]; px < P.W - P.pad[1]; px += step) for (let py = P.pad[0]; py < P.H - P.pad[2]; py += step) {
        const x = P.invX(px + step / 2), y = P.invY(py + step / 2)
        let b = 0, bd = 9; cs.forEach(([cx, cy], k) => { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd) { bd = d; b = k } })
        g.fillStyle = centers[b][2] + '2a'; g.fillRect(px, py, step, step)
      }
    }
    pts.forEach(p => {
      const c = mode === 'sup' ? centers[p.k][2] : (p.a >= 0 ? centers[p.a][2] : '#fff')
      P.dot(p.x, p.y, { r: 7, fill: mode === 'unsup' && !kmRunning && step0 ? '#fff' : c })
    })
    if (mode === 'unsup') means.forEach(([mx, my], k) => {
      g.save(); g.translate(P.X(mx), P.Y(my)); g.rotate(Math.PI / 4)
      g.fillStyle = centers[k][2]; g.strokeStyle = COL.ink; g.lineWidth = 3
      g.fillRect(-9, -9, 18, 18); g.strokeRect(-9, -9, 18, 18); g.restore()
    })
    if (probe) {
      g.save(); g.strokeStyle = COL.ink; g.lineWidth = 3; g.setLineDash([4, 4])
      g.beginPath(); g.arc(P.X(probe.x), P.Y(probe.y), 16, 0, 7); g.stroke(); g.restore()
      P.dot(probe.x, probe.y, { r: 9, fill: centers[probe.k][2] })
      P.label(mode === 'sup' ? `→ クラス ${'ABC'[probe.k]} と判定！` : `→ グループ ${probe.k + 1} っぽい`, P.X(probe.x), P.Y(probe.y) - 30)
    }
  }
  async function kmeans() {
    if (kmRunning) return
    kmRunning = true; step0 = false
    means = [[0.15, 0.15], [0.85, 0.2], [0.5, 0.9]]
    for (let it = 0; it < 6; it++) {
      pts.forEach(p => { let b = 0, bd = 9; means.forEach(([mx, my], k) => { const d = (p.x - mx) ** 2 + (p.y - my) ** 2; if (d < bd) { bd = d; b = k } }); p.a = b })
      plot.draw(); await new Promise(r => setTimeout(r, 380))
      const target = [0, 1, 2].map(k => pts.some(p => p.a === k) ? centroid(k, 'a') : means[k])
      const from = means.map(m => [...m]); const st = { t: 0 }
      await tweenTo(st, 't', 1, 420, () => { means = from.map((m, k) => [m[0] + (target[k][0] - m[0]) * st.t, m[1] + (target[k][1] - m[1]) * st.t]); plot.draw() })
    }
    kmRunning = false
    toast('グループ分けが落ち着いた！')
  }
  plot.pointer({ down: (p) => {
    const x = clamp(p.x, 0, 1), y = clamp(p.y, 0, 1)
    const cs = mode === 'sup' ? [0, 1, 2].map(k => centroid(k, 'k')) : means
    let b = 0, bd = 9; cs.forEach(([cx, cy], k) => { const d = (x - cx) ** 2 + (y - cy) ** 2; if (d < bd) { bd = d; b = k } })
    probe = { x, y, k: b }; plot.draw()
  } })
  const sg = seg({ label: 'モード', options: [['sup', '教師あり'], ['unsup', '教師なし']], value: 'sup', onChange: v => {
    mode = v; probe = null; step0 = true; pts.forEach(p => (p.a = -1)); means = [[0.15, 0.15], [0.85, 0.2], [0.5, 0.9]]
    run.style.display = v === 'unsup' ? '' : 'none'
    hint.innerHTML = v === 'sup' ? hintSup : hintUn; plot.draw()
  } })
  const run = button('▶ 似たものどうしに分ける', kmeans, 'mint'); run.style.display = 'none'
  const hintSup = '色＝正解ラベル。<b>キャンバスをタップ</b>すると、新しい入力がどのクラスか判定するよ。背景の色が「分類器」そのもの。'
  const hintUn = 'ラベル（色）が無い！ ボタンを押すと、◆ が動いて<b>似たものどうし</b>をまとめていく（k-means）。'
  const hint = h('div.lab-hint', { html: hintSup })
  side.append(sg, run, hint)
}

// ═════════ 最小2乗法 ═════════
export function lsq(body) {
  const { canvas, side } = layout(body)
  const rng = mulberry(3)
  const trueW = 0.8
  let pts = Array.from({ length: 8 }, (_, i) => { const x = 0.7 + i * 0.55; return { x, t: trueW * x + randn(rng) * .35 } })
  const st = { w: 0.3 }
  const optW = () => pts.reduce((s, p) => s + p.x * p.t, 0) / pts.reduce((s, p) => s + p.x * p.x, 0)
  const E = (w) => 0.5 * pts.reduce((s, p) => s + (w * p.x - p.t) ** 2, 0)
  let showSq = true, drag = -1
  const plot = new Plot(canvas, { aspect: .62, x: [0, 5], y: [0, 5], onDraw: (g, P) => {
    P.axes({ xt: 5, yt: 5, xl: 'x（力・電流…）', yl: 't（伸び・電圧…）', fmtX: v => +v.toFixed(1), fmtY: v => +v.toFixed(1) })
    // squares of residuals
    if (showSq) pts.forEach(p => {
      const y = st.w * p.x, r = p.t - y
      const side = Math.abs(P.Y(y) - P.Y(p.t))
      const x0 = P.X(p.x), y0 = Math.min(P.Y(y), P.Y(p.t))
      g.fillStyle = r > 0 ? 'rgba(255,142,110,.28)' : 'rgba(185,167,255,.32)'
      g.strokeStyle = r > 0 ? COL.coralD : COL.lavD; g.lineWidth = 1.5
      g.fillRect(x0, y0, side, side); g.strokeRect(x0, y0, side, side)
    })
    pts.forEach(p => { g.strokeStyle = COL.ink; g.lineWidth = 2; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(P.X(p.x), P.Y(p.t)); g.lineTo(P.X(p.x), P.Y(st.w * p.x)); g.stroke(); g.setLineDash([]) })
    P.fn(x => st.w * x, { color: COL.ink, width: 4 })
    pts.forEach((p, i) => P.dot(p.x, p.t, { r: i === drag ? 9 : 7, fill: COL.mint }))
    P.label(`y = ${st.w.toFixed(2)} x`, P.X(4.2), P.Y(st.w * 4.2) - 20, { bg: COL.butter })
    // mini E(w) plot inset
    const iw = Math.min(170, P.W * .32), ih = iw * .62, ix = P.pad[3] + 10, iy = P.pad[0] + 4
    g.fillStyle = '#fff'; g.strokeStyle = COL.ink; g.lineWidth = 2.5; rr(g, ix, iy, iw, ih, 12); g.fill(); g.stroke()
    const ws = [0, 1.6], emax = Math.max(E(0), E(1.6))
    const mx = w => ix + 10 + (w - ws[0]) / (ws[1] - ws[0]) * (iw - 20), my = e => iy + ih - 12 - (e / emax) * (ih - 30)
    g.strokeStyle = COL.coral; g.lineWidth = 3; g.beginPath()
    for (let i = 0; i <= 60; i++) { const w = ws[0] + (ws[1] - ws[0]) * i / 60; i ? g.lineTo(mx(w), my(E(w))) : g.moveTo(mx(w), my(E(w))) }
    g.stroke()
    const ow = optW()
    g.setLineDash([3, 3]); g.strokeStyle = COL.ink3; g.lineWidth = 1.5; g.beginPath(); g.moveTo(mx(ow), iy + 18); g.lineTo(mx(ow), iy + ih - 10); g.stroke(); g.setLineDash([])
    g.beginPath(); g.arc(mx(clamp(st.w, 0, 1.6)), my(E(clamp(st.w, 0, 1.6))), 6, 0, 7); g.fillStyle = COL.butter; g.fill(); g.lineWidth = 2.5; g.strokeStyle = COL.ink; g.stroke()
    g.font = '700 11px "Zen Maru Gothic"'; g.fillStyle = COL.ink2; g.fillText('E(w) の谷', ix + 10, iy + 15)
  } })
  plot.pointer({
    down: (p) => { drag = pts.findIndex(q => Math.hypot(plot.X(q.x) - p.px, plot.Y(q.t) - p.py) < 16); plot.draw() },
    drag: (p) => { if (drag < 0) return; pts[drag].t = clamp(p.y, 0, 5); pts[drag].x = clamp(p.x, 0.2, 4.9); update() },
    up: () => { drag = -1; plot.draw() },
  })
  const sw = slider({ label: '傾き $w$', min: 0, max: 1.6, step: .01, value: st.w, fmt: v => v.toFixed(2), onInput: v => { st.w = v; update() } })
  const ro = readout([['e', '2乗和誤差 $E(w)$'], ['o', '最適な $w^*$']])
  const fit = button('✨ 誤差を最小にする', () => tweenTo(st, 'w', optW(), 900, () => { sw.set(st.w); update() }).then(() => toast('谷底に到着！ これが最小2乗法')), 'butter')
  const tg = seg({ label: '誤差の見せ方', options: [['sq', '正方形'], ['ln', '線だけ']], value: 'sq', onChange: v => { showSq = v === 'sq'; plot.draw() } })
  function update() {
    const e = E(st.w), o = optW()
    ro.set('e', e.toFixed(3), Math.abs(st.w - o) < .02 ? 'good' : '')
    ro.set('o', o.toFixed(3))
    plot.draw()
  }
  side.append(sw, ro, fit, tg, h('div.lab-hint', { html: '正方形の<b>面積の合計</b>（の半分）が $E(w)$。点は<b>ドラッグ</b>で動かせるよ。' }))
  update()
}

// ═════════ 多項式フィッティング（M / N / λ） ═════════
export function polyLab(body, { opts }) {
  const mode = opts.mode || 'M'
  const { canvas, side } = layout(body)
  let seed = 11, N = opts.N || 10, M = opts.M ?? 3, logL = opts.logL ?? -30
  const sigma = 0.25
  let train = [], val = []
  const truth = x => Math.sin(2 * Math.PI * x)
  function sample() {
    const r = mulberry(seed)
    train = Array.from({ length: N }, (_, i) => { const x = N === 1 ? .5 : i / (N - 1); return { x, t: truth(x) + randn(r) * sigma } })
    const r2 = mulberry(seed + 999)
    val = Array.from({ length: 40 }, () => { const x = r2(); return { x, t: truth(x) + randn(r2) * sigma } })
  }
  const lam = () => logL <= -30 ? 0 : Math.exp(logL)
  const rms = (w, D) => Math.sqrt(D.reduce((s, p) => s + (polyval(w, p.x) - p.t) ** 2, 0) / D.length)
  let w = [], showTruth = true, showVal = mode !== 'N', curveT = 1, prevW = null
  const fit = () => polyfit(train.map(p => p.x), train.map(p => p.t), M, lam())
  const plot = new Plot(canvas, { aspect: .58, x: [0, 1], y: [-1.6, 1.6], onDraw: (g, P) => {
    P.axes({ xt: 4, yt: 4, xl: 'x', yl: 't' })
    if (showTruth) P.fn(truth, { color: COL.mintD, width: 3, dash: [8, 7] })
    if (showVal) val.forEach(p => P.dot(p.x, p.t, { r: 4, fill: '#fff', lw: 1.6, stroke: COL.ink3 }))
    const cur = x => prevW && curveT < 1 ? polyval(prevW, x) * (1 - curveT) + polyval(w, x) * curveT : polyval(w, x)
    P.fn(cur, { color: COL.coral, width: 4.5, n: 400 })
    train.forEach(p => P.dot(p.x, p.t, { r: N > 40 ? 5 : 7, fill: COL.lav }))
    P.label(mode === 'lambda' ? `M = ${M},  ln λ = ${logL <= -30 ? '−∞' : logL.toFixed(0)}` : `M = ${M},  N = ${N}`, P.W - P.pad[1] - 6, P.pad[0] + 14, { align: 'right', bg: COL.butter })
  } })
  // error-vs-complexity mini chart
  let cd = []
  const chartBox = h('div.lab-canvas', { style: { marginTop: '0' } })
  const chart = new Plot(chartBox, { aspect: .62, minH: 150, maxH: 200, pad: [16, 10, 26, 34], onDraw: drawChart })
  function curveData() {
    if (mode === 'lambda') {
      const xs = []; for (let l = -36; l <= 0; l += 2) xs.push(l)
      return xs.map(l => { const ww = polyfit(train.map(p => p.x), train.map(p => p.t), M, Math.exp(l)); return [l, rms(ww, train), rms(ww, val)] })
    }
    if (mode === 'N') {
      return [5, 8, 10, 15, 20, 30, 50, 80, 100].map(n => {
        const r = mulberry(seed + n); const tr = Array.from({ length: n }, (_, i) => { const x = i / (n - 1); return { x, t: truth(x) + randn(r) * sigma } })
        const ww = polyfit(tr.map(p => p.x), tr.map(p => p.t), M, 0); return [n, rms(ww, tr), rms(ww, val)]
      })
    }
    return Array.from({ length: 10 }, (_, m) => { const ww = polyfit(train.map(p => p.x), train.map(p => p.t), m, lam()); return [m, rms(ww, train), rms(ww, val)] })
  }
  function drawChart(g, P) {
    if (!cd.length) return
    const xs = cd.map(d => d[0])
    P.xr = [Math.min(...xs), Math.max(...xs)]; P.yr = [0, 1.2]
    P.axes({ xt: mode === 'M' ? 9 : 4, yt: 2, grid: false, fmtX: v => mode === 'lambda' ? Math.round(v) : Math.round(v), fmtY: v => v.toFixed(1) })
    const line = (k, c) => { g.strokeStyle = c; g.lineWidth = 3; g.beginPath(); cd.forEach((d, i) => { const y = Math.min(1.2, d[k]); i ? g.lineTo(P.X(d[0]), P.Y(y)) : g.moveTo(P.X(d[0]), P.Y(y)) }); g.stroke(); cd.forEach(d => P.dot(d[0], Math.min(1.2, d[k]), { r: 3.5, fill: c, lw: 1.5 })) }
    line(1, COL.lavD); line(2, COL.coralD)
    const cx = mode === 'M' ? M : mode === 'N' ? N : (logL <= -30 ? -36 : logL)
    P.vline(clamp(cx, P.xr[0], P.xr[1]), { color: COL.ink, dash: [4, 4] })
    g.font = '700 10.5px "Zen Maru Gothic"'; g.fillStyle = COL.ink2; g.textAlign = 'right'
    g.fillText(mode === 'M' ? '次数 M →' : mode === 'N' ? 'データ数 N →' : 'ln λ →', P.W - P.pad[1], P.H - 2)
  }
  const ro = readout([['tr', '学習用 $E_{RMS}$'], ['va', '確認用 $E_{RMS}$'], ['st', '判定', true]])
  function update(anim = true) {
    const nw = fit()
    prevW = w.length ? w : nw; w = nw
    if (anim && !matchMedia('(prefers-reduced-motion: reduce)').matches) { curveT = 0; tweenTo({ get t() { return curveT }, set t(v) { curveT = v } }, 't', 1, 420, () => plot.draw()) } else { curveT = 1; plot.draw() }
    const a = rms(w, train), b = rms(w, val)
    ro.set('tr', a.toFixed(3)); ro.set('va', b.toFixed(3), b < .33 ? 'good' : b > .6 ? 'bad' : '')
    let s = 'ちょうどいい感じ 👍'
    if (a < .05 && b > .45) s = '過学習！ 点は全部通るのに予測はボロボロ 😱'
    else if (a > .45) s = '単純すぎ… データの形をつかめてない 🙃'
    else if (b > .45) s = '予測が不安定 🤔'
    ro.set('st', `<span style="font-family:var(--fj);font-size:15px;font-weight:900">${s}</span>`)
    cd = curveData(); chart.draw()
  }
  const ctlM = slider({ label: '多項式の次数 $M$', min: 0, max: 9, step: 1, value: M, fmt: v => v, onInput: v => { M = v; update() } })
  const ctlN = slider({ label: 'データ数 $N$', min: 5, max: 100, step: 1, value: N, fmt: v => v, onInput: v => { N = v; sample(); update(false) } })
  const ctlL = slider({ label: '正則化 $\\ln\\lambda$', min: -30, max: 0, step: 1, value: logL, fmt: v => v <= -30 ? '−∞' : v, onInput: v => { logL = v; update() } })
  const re = button('🎲 データを取り直す', () => { seed = (seed * 7 + 3) % 9973; sample(); update() })
  const tg = seg({ label: '表示', options: [['t', '真の関数'], ['v', '確認用'], ['n', 'なし']], value: 't', onChange: v => { showTruth = v === 't'; showVal = v === 'v'; plot.draw() } })
  side.append(ctlM)
  if (mode === 'N') side.append(ctlN)
  if (mode === 'lambda') side.append(ctlL)
  side.append(ro, h('div', { html: `<div class="legend" style="margin-bottom:4px"><span><i style="background:${COL.lavD}"></i>学習用</span><span><i style="background:${COL.coralD}"></i>確認用</span></div>` }), chartBox, h('div.btn-row', re), tg)
  sample(); update(false)
}

// ═════════ 次元の呪い ═════════
export function curse(body) {
  const { canvas, side } = layout(body)
  let D = 2, Np = 60, K = 6
  const rng = mulberry(5)
  let data = []
  const regen = () => { const r = mulberry(5 + Np); data = Array.from({ length: Np }, () => Array.from({ length: 6 }, () => r())) }
  regen()
  const occ = () => { const s = new Set(data.map(p => p.slice(0, D).map(v => Math.floor(v * K)).join(','))); return s.size }
  const plot = new Plot(canvas, { aspect: .62, pad: [20, 20, 20, 20], onDraw: (g, P) => {
    const cells = K ** D, filled = occ()
    const W = P.W - 40, Hh = P.H - 40
    if (D === 1) {
      const cw = W / K, y = P.H / 2
      for (let i = 0; i < K; i++) { const has = data.some(p => Math.floor(p[0] * K) === i); g.fillStyle = has ? COL.butter : '#fff'; g.strokeStyle = COL.ink; g.lineWidth = 2.5; g.fillRect(20 + i * cw, y - 30, cw, 60); g.strokeRect(20 + i * cw, y - 30, cw, 60) }
      data.forEach((p, i) => { g.beginPath(); g.arc(20 + p[0] * W, y + ((i * 37) % 40) - 20, 4, 0, 7); g.fillStyle = COL.lavD; g.fill() })
    } else if (D === 2) {
      const s = Math.min(W, Hh), ox = (P.W - s) / 2, oy = (P.H - s) / 2, c = s / K
      for (let i = 0; i < K; i++) for (let j = 0; j < K; j++) {
        const has = data.some(p => Math.floor(p[0] * K) === i && Math.floor(p[1] * K) === j)
        g.fillStyle = has ? COL.butter : '#fff'; g.fillRect(ox + i * c, oy + (K - 1 - j) * c, c, c)
        g.strokeStyle = COL.ink; g.lineWidth = 1.5; g.strokeRect(ox + i * c, oy + (K - 1 - j) * c, c, c)
      }
      data.forEach(p => { g.beginPath(); g.arc(ox + p[0] * s, oy + (1 - p[1]) * s, 3.6, 0, 7); g.fillStyle = COL.lavD; g.fill() })
    } else {
      // waffle: each square = 1% of cells
      const cols = 20, rows = 10, c = Math.min(W / cols, Hh / rows) - 3, ox = (P.W - (c + 3) * cols) / 2, oy = (P.H - (c + 3) * rows) / 2
      const pct = filled / cells
      for (let i = 0; i < 200; i++) {
        const x = ox + (i % cols) * (c + 3), y = oy + Math.floor(i / cols) * (c + 3)
        g.fillStyle = i < Math.round(pct * 200) ? COL.butter : '#fff'; g.strokeStyle = COL.ink; g.lineWidth = 1.5
        rr(g, x, y, c, c, 4); g.fill(); g.stroke()
      }
      P.label(`1マス = 全体の 0.5%  ／  データが入ったマスは ${(pct * 100).toFixed(pct < .01 ? 3 : 1)}%`, P.W / 2, P.H - 12)
    }
  } })
  const ro = readout([['c', 'マス目の数 $K^D$'], ['f', 'データ入りのマス'], ['n', '各マス平均データ数', true]])
  function update() {
    const cells = K ** D, f = occ()
    ro.set('c', cells.toLocaleString())
    ro.set('f', `${f} <small>(${(f / cells * 100).toFixed(cells > 1e4 ? 3 : 1)}%)</small>`, f / cells < .1 ? 'bad' : f / cells > .6 ? 'good' : '')
    ro.set('n', `${(Np / cells).toPrecision(3)} 個 → 全マス埋めるには ≈ ${(cells * 3).toLocaleString()} 個ほしい`)
    plot.draw()
  }
  side.append(
    slider({ label: '次元 $D$', min: 1, max: 6, step: 1, value: D, fmt: v => v, onInput: v => { D = v; update() } }),
    slider({ label: 'データ数 $N$', min: 10, max: 300, step: 10, value: Np, fmt: v => v, onInput: v => { Np = v; regen(); update() } }),
    ro, h('div.lab-hint', { html: '各軸を <b>6 等分</b>。次元が 1 増えるたびマス目は <b>6 倍</b>。データ数を固定すると、黄色（データ入り）がみるみる消えていく。' }))
  update()
}
