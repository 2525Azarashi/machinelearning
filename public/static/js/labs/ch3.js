import { h, rich, toast } from '../lib/ui.js'
import { Plot, COL, mulberry, randn, gauss, betaPdf, clamp, rr } from '../lib/plot.js'
import { slider, seg, readout, button, layout, tweenTo } from '../lib/labkit.js'

// ═════════ 確率モデル t = w x + ε : データ生成を見る ═════════
export function generative(body) {
  const { canvas, side } = layout(body)
  let w = 0.8, sigma = 0.4, pts = [], seed = 1
  const xs = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5]
  const plot = new Plot(canvas, { aspect: .6, x: [0, 5], y: [-1, 5], onDraw: (g, P) => {
    P.axes({ xt: 5, yt: 6, xl: 'x（説明変数）', yl: 't（目標変数）', fmtX: v => +v.toFixed(1), fmtY: v => +v.toFixed(1) })
    // vertical gaussian "bells" at each x
    xs.forEach(x => {
      const m = w * x
      g.save(); g.fillStyle = 'rgba(185,167,255,.35)'; g.strokeStyle = COL.lavD; g.lineWidth = 1.5; g.beginPath()
      g.moveTo(P.X(x), P.Y(m - 3 * sigma))
      for (let t = m - 3 * sigma; t <= m + 3 * sigma; t += sigma / 10) g.lineTo(P.X(x) + gauss(t, m, sigma) * sigma * 38, P.Y(t))
      g.lineTo(P.X(x), P.Y(m + 3 * sigma)); g.closePath(); g.fill(); g.stroke(); g.restore()
    })
    P.fn(x => w * x, { color: COL.ink, width: 3.5 })
    pts.forEach(p => P.dot(p.x, p.t, { r: 6.5, fill: COL.butter }))
    P.label(`t = ${w.toFixed(1)}x + ε,   ε ~ N(0, ${sigma.toFixed(2)}²)`, P.pad[3] + 8, P.pad[0] + 12, { align: 'left', bg: '#fff' })
  } })
  const gen = () => { const r = mulberry(seed++); pts = xs.map(x => ({ x, t: w * x + randn(r) * sigma })); plot.draw() }
  side.append(
    slider({ label: 'モデルパラメータ $w$', min: 0, max: 1.2, step: .05, value: w, fmt: v => v.toFixed(2), onInput: v => { w = v; pts = []; plot.draw() } }),
    slider({ label: 'ノイズの大きさ $\\sigma$', min: .1, max: 1, step: .05, value: sigma, fmt: v => v.toFixed(2), onInput: v => { sigma = v; pts = []; plot.draw() } }),
    button('🎲 データを生成（実現値をとる）', gen, 'butter'),
    h('div.lab-hint', { html: '紫の山＝各 $x$ での $t$ の分布 $\\mathcal N(wx,\\sigma^2)$。ボタンを押すたびに<b>同じモデルから違うデータ</b>が出てくる。データは「確率変数の実現値」。' }))
  gen()
}

// ═════════ 尤度：w を動かして「データの出やすさ」を最大に ═════════
export function likelihood(body) {
  const { canvas, side } = layout(body)
  const r = mulberry(21), sigma = .45
  const pts = [0.6, 1.1, 1.7, 2.2, 2.8, 3.3, 3.9, 4.4].map(x => ({ x, t: .9 * x + randn(r) * sigma }))
  const st = { w: .4 }
  const wML = pts.reduce((s, p) => s + p.x * p.t, 0) / pts.reduce((s, p) => s + p.x * p.x, 0)
  const logL = w => pts.reduce((s, p) => s + Math.log(gauss(p.t, w * p.x, sigma)), 0)
  const plot = new Plot(canvas, { aspect: .62, x: [0, 5], y: [-1, 5.5], onDraw: (g, P) => {
    P.axes({ xt: 5, yt: 6, xl: 'x', yl: 't', fmtX: v => +v.toFixed(1), fmtY: v => +v.toFixed(1) })
    pts.forEach(p => {
      const m = st.w * p.x, dens = gauss(p.t, m, sigma)
      // bell
      g.save(); g.strokeStyle = 'rgba(139,115,242,.6)'; g.lineWidth = 1.5; g.beginPath()
      for (let t = m - 3 * sigma; t <= m + 3 * sigma; t += sigma / 12) { const px = P.X(p.x) + gauss(t, m, sigma) * 40; t === m - 3 * sigma ? g.moveTo(px, P.Y(t)) : g.lineTo(px, P.Y(t)) }
      g.stroke()
      // density bar at data point
      g.strokeStyle = COL.coralD; g.lineWidth = 5; g.lineCap = 'round'
      g.beginPath(); g.moveTo(P.X(p.x), P.Y(p.t)); g.lineTo(P.X(p.x) + dens * 40, P.Y(p.t)); g.stroke(); g.restore()
    })
    P.fn(x => st.w * x, { color: COL.ink, width: 3.5 })
    pts.forEach(p => P.dot(p.x, p.t, { r: 6.5, fill: COL.mint }))
    // inset log-likelihood curve
    const iw = Math.min(180, P.W * .34), ih = iw * .6, ix = P.pad[3] + 10, iy = P.pad[0] + 4
    g.fillStyle = '#fff'; g.strokeStyle = COL.ink; g.lineWidth = 2.5; rr(g, ix, iy, iw, ih, 12); g.fill(); g.stroke()
    const lo = .2, hi = 1.6, vals = []; for (let i = 0; i <= 60; i++) { const w = lo + (hi - lo) * i / 60; vals.push([w, logL(w)]) }
    const ymax = logL(wML), ymin = Math.max(-80, Math.min(...vals.map(v => v[1])))
    const mx = w => ix + 10 + (w - lo) / (hi - lo) * (iw - 20), my = v => iy + 22 + (1 - (clamp(v, ymin, ymax) - ymin) / (ymax - ymin)) * (ih - 34)
    g.strokeStyle = COL.coral; g.lineWidth = 3; g.beginPath(); vals.forEach(([w, v], i) => i ? g.lineTo(mx(w), my(v)) : g.moveTo(mx(w), my(v))); g.stroke()
    g.beginPath(); g.arc(mx(clamp(st.w, lo, hi)), my(logL(st.w)), 6, 0, 7); g.fillStyle = COL.butter; g.fill(); g.lineWidth = 2.5; g.strokeStyle = COL.ink; g.stroke()
    g.font = '700 11px "Zen Maru Gothic"'; g.fillStyle = COL.ink2; g.fillText('対数尤度 ln p(t|w) の山', ix + 10, iy + 15)
  } })
  const ro = readout([['L', '尤度 $\\prod_n \\mathcal N(t_n|wx_n,\\sigma^2)$', true], ['lL', '対数尤度'], ['w', '最尤推定 $w_{ML}$']])
  const sw = slider({ label: 'パラメータ $w$', min: .2, max: 1.6, step: .01, value: st.w, fmt: v => v.toFixed(2), onInput: v => { st.w = v; update() } })
  function update() {
    const l = logL(st.w)
    ro.set('L', Math.exp(l).toExponential(2), Math.abs(st.w - wML) < .02 ? 'good' : '')
    ro.set('lL', l.toFixed(2)); ro.set('w', wML.toFixed(3))
    plot.draw()
  }
  side.append(sw, ro, button('⛰ 尤度の山頂へ', () => tweenTo(st, 'w', wML, 900, () => { sw.set(st.w); update() }).then(() => toast('最尤推定！ 最小2乗の解と同じ値')), 'butter'),
    h('div.lab-hint', { html: '赤いバー＝各データ点での<b>確率密度</b>。全部の積が尤度。線がデータに近づくほどバーが長くなる。' }))
  update()
}

// ═════════ コイン：最尤 vs ベイズ（ベータ事前分布） ═════════
export function coinBayes(body, { opts }) {
  const { canvas, side } = layout(body)
  let heads = 3, tails = 0, a = opts.a ?? 2, b = opts.b ?? 2
  const plot = new Plot(canvas, { aspect: .58, x: [0, 1], y: [0, 5], onDraw: (g, P) => {
    const post = x => betaPdf(x, a + heads, b + tails), prior = x => betaPdf(x, a, b)
    let mx = 0; for (let i = 1; i < 200; i++) mx = Math.max(mx, post(i / 200), prior(i / 200))
    P.yr = [0, Math.min(14, mx * 1.15 + .3)]
    P.axes({ xt: 5, yt: 4, xl: 'θ（表が出る確率）', yl: '確率密度', fmtY: v => v.toFixed(1) })
    P.area(post, { color: 'rgba(111,214,184,.35)', n: 300 })
    P.fn(prior, { color: COL.lavD, width: 3, dash: [7, 6], n: 300 })
    P.fn(post, { color: COL.mintD, width: 4.5, n: 300 })
    const n = heads + tails
    if (n) { const ml = heads / n; P.vline(ml, { color: COL.coralD, dash: [], width: 3.5 }); P.label(`最尤 θ = ${ml.toFixed(2)}`, P.X(ml), P.pad[0] + 12, { bg: COL.coral }) }
    const map = (a + heads - 1) / (a + b + n - 2)
    if (a + heads > 1 && b + tails > 1) { P.vline(map, { color: COL.mintD, dash: [4, 4], width: 2.5 }); P.label(`MAP θ = ${map.toFixed(2)}`, P.X(map), P.pad[0] + 40, { bg: '#C9F1E3' }) }
    // coins row
    const coins = [...Array(heads).fill(1), ...Array(tails).fill(0)].slice(0, 24)
    coins.forEach((c, i) => { const x = P.pad[3] + 14 + i * 18, y = P.H - P.pad[2] - 14; g.beginPath(); g.arc(x, y, 7.5, 0, 7); g.fillStyle = c ? COL.butter : '#fff'; g.fill(); g.lineWidth = 2; g.strokeStyle = COL.ink; g.stroke() })
  } })
  const ro = readout([['n', '表 / 裏'], ['ml', '最尤推定値'], ['post', '事後分布', true]])
  function update() {
    ro.set('n', `${heads} / ${tails}`)
    const n = heads + tails
    ro.set('ml', n ? (heads / n).toFixed(2) : '—', n && (heads === n || tails === n) ? 'bad' : '')
    ro.set('post', `Beta(${a + heads}, ${b + tails})`)
    plot.draw()
  }
  const r = mulberry(5)
  side.append(
    h('div.btn-row', button('🪙 表', () => { heads++; update() }, 'butter'), button('⚪ 裏', () => { tails++; update() }), button('↺', () => { heads = 0; tails = 0; update() })),
    slider({ label: '事前分布 $\\alpha$', min: 1, max: 10, step: 1, value: a, fmt: v => v, onInput: v => { a = v; update() } }),
    slider({ label: '事前分布 $\\beta$', min: 1, max: 10, step: 1, value: b, fmt: v => v, onInput: v => { b = v; update() } }),
    ro, h('div.lab-hint', { html: '3回とも表 → 最尤推定は <b>θ = 1</b>（「絶対に表しか出ない」）と言い切ってしまう。ベイズは事前分布（点線）が<b>いかり</b>になって極端に振れない。' }))
  update()
}

// ═════════ MAP = 正則化：事前の強さ α で w が引き戻される ═════════
export function mapReg(body) {
  const { canvas, side } = layout(body)
  const sigma = .5
  const r = mulberry(8)
  let pts = [0.8, 1.6, 2.4].map(x => ({ x, t: 1.1 * x + randn(r) * sigma }))
  let alpha = 1 // prior std
  const ro = readout([['ml', '$w_{ML}$'], ['map', '$w_{MAP}$'], ['lam', '対応する正則化 $\\lambda=\\sigma^2/\\alpha^2$', true]])
  const plot = new Plot(canvas, { aspect: .58, x: [-1, 2.5], y: [0, 1], onDraw: (g, P) => {
    const sxx = pts.reduce((s, p) => s + p.x * p.x, 0), sxt = pts.reduce((s, p) => s + p.x * p.t, 0)
    const lik = w => Math.exp(-(sxx * w * w - 2 * sxt * w) / (2 * sigma * sigma))
    const wml = sxt / sxx
    const lmax = lik(wml)
    const prior = w => gauss(w, 0, alpha)
    const postPrec = sxx / (sigma * sigma) + 1 / (alpha * alpha)
    const postMean = (sxt / (sigma * sigma)) / postPrec, postSd = 1 / Math.sqrt(postPrec)
    const post = w => gauss(w, postMean, postSd)
    const pm = post(postMean), prm = prior(0)
    P.yr = [0, 1.15]
    P.axes({ xt: 7, yt: 2, xl: 'w', yl: '（高さはそれぞれ正規化して表示）', fmtX: v => v.toFixed(1), fmtY: v => '' })
    P.fn(w => prior(w) / prm, { color: COL.lavD, width: 3, dash: [7, 6], n: 300 })
    P.fn(w => lik(w) / lmax, { color: COL.coral, width: 3, n: 300 })
    P.area(w => post(w) / pm, { color: 'rgba(111,214,184,.35)', n: 300 })
    P.fn(w => post(w) / pm, { color: COL.mintD, width: 4.5, n: 300 })
    P.vline(wml, { color: COL.coralD, width: 2 }); P.vline(postMean, { color: COL.mintD, width: 2, dash: [] })
    P.label('事前 p(w)', P.X(0), P.Y(1.06), { bg: '#ECE6FF' })
    P.label(`尤度 → w_ML = ${wml.toFixed(2)}`, P.X(wml) + 70, P.Y(.75), { bg: '#FFE3D6' })
    P.label(`事後 → w_MAP = ${postMean.toFixed(2)}`, P.X(postMean) - 40, P.Y(.4), { bg: '#C9F1E3' })
    ro.set('ml', wml.toFixed(3)); ro.set('map', postMean.toFixed(3)); ro.set('lam', (sigma * sigma / (alpha * alpha)).toFixed(3))
  } })
  side.append(
    slider({ label: '事前分布の幅 $\\alpha$（小さい＝強い思い込み）', min: .1, max: 3, step: .05, value: alpha, fmt: v => v.toFixed(2), onInput: v => { alpha = v; plot.draw() } }),
    ro, button('🎲 データを3点取り直す', () => { const r = mulberry(Math.random() * 1e6 | 0); pts = [0.8, 1.6, 2.4].map(x => ({ x, t: 1.1 * x + randn(r) * sigma })); plot.draw() }),
    h('div.lab-hint', { html: '事後 ∝ 尤度 × 事前。$\\alpha$ を小さくすると $w_{MAP}$ が <b>0 に引き戻される</b>。これが正則化項 $\\frac{\\lambda}{2}w^2$ の正体。' }))
  plot.draw()
}

// ═════════ 共役事前分布：ガウス平均の逐次更新 ═════════
export function conjugate(body) {
  const { canvas, side } = layout(body)
  const trueMu = 1.2
  let mu0 = -1, s0 = 1, data = []
  const r = mulberry(33)
  const posterior = () => { const N = data.length, prec = 1 / (s0 * s0) + N; const mean = (mu0 / (s0 * s0) + data.reduce((a, b) => a + b, 0)) / prec; return [mean, 1 / Math.sqrt(prec)] }
  const plot = new Plot(canvas, { aspect: .58, x: [-3, 3.5], y: [0, 1], onDraw: (g, P) => {
    const [m, s] = posterior()
    P.yr = [0, Math.max(gauss(m, m, s), gauss(mu0, mu0, s0)) * 1.15]
    P.axes({ xt: 6, yt: 3, xl: 'μ', yl: 'p(μ | データ)', fmtX: v => v.toFixed(1), fmtY: v => v.toFixed(1) })
    P.fn(x => gauss(x, mu0, s0), { color: COL.lavD, width: 3, dash: [7, 6] })
    P.area(x => gauss(x, m, s), { color: 'rgba(111,214,184,.35)' })
    P.fn(x => gauss(x, m, s), { color: COL.mintD, width: 4.5 })
    P.vline(trueMu, { color: COL.coralD, width: 2 })
    P.label('真の μ', P.X(trueMu), P.pad[0] + 10, { bg: COL.coral })
    data.slice(-40).forEach((d, i) => P.dot(d, P.yr[1] * .03, { r: 4.5, fill: COL.butter, lw: 1.5 }))
  } })
  const ro = readout([['n', 'データ数 $N$'], ['post', '事後 $\\mathcal N(\\mu_N, \\sigma_N^2)$']])
  const upd = () => { const [m, s] = posterior(); ro.set('n', data.length); ro.set('post', `${m.toFixed(2)}, ${(s * s).toFixed(3)}`); plot.draw() }
  side.append(
    h('div.btn-row', button('＋1 データ', () => { data.push(trueMu + randn(r)); upd() }, 'butter'), button('＋10', () => { for (let i = 0; i < 10; i++) data.push(trueMu + randn(r)); upd() }), button('↺', () => { data = []; upd() })),
    slider({ label: '事前の平均 $\\mu_0$', min: -2.5, max: 2.5, step: .1, value: mu0, fmt: v => v.toFixed(1), onInput: v => { mu0 = v; upd() } }),
    slider({ label: '事前の標準偏差 $\\sigma_0$', min: .2, max: 2, step: .05, value: s0, fmt: v => v.toFixed(2), onInput: v => { s0 = v; upd() } }),
    ro, h('div.lab-hint', { html: 'ガウス × ガウス ＝ <b>ガウス</b>。形が変わらないから、正規化定数を積分しなくても事後分布が書ける。データが増えるほど山は真の μ に集まって細くなる。' }))
  upd()
}
