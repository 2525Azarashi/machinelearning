import { h, toast } from '../lib/ui.js'
import { COL, clamp, rr } from '../lib/plot.js'
import { seg, readout, button, layout } from '../lib/labkit.js'

const PATTERNS = {
  cross: [
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
  ],
  box: [
    [0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0],
  ],
  diag: [
    [1, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0],
    [0, 0, 0, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 0, 0],
    [0, 0, 0, 0, 0, 1, 0],
    [0, 0, 0, 0, 0, 0, 1],
  ],
}

const FILTERS = {
  vert: [[-1, 1, -1], [-1, 1, -1], [-1, 1, -1]],
  horiz: [[-1, -1, -1], [1, 1, 1], [-1, -1, -1]],
  lap: [[0, -1, 0], [-1, 4, -1], [0, -1, 0]],
}

// ═════════ たたみこみ演算 ＆ 0パディング ＆ 特徴マップ体験ラボ ═════════
export function convLab(body) {
  const { canvas, side } = layout(body)
  let patKey = 'cross', filKey = 'vert', padMode = 'zero'
  let img = PATTERNS.cross.map(r => [...r])
  let ker = FILTERS.vert.map(r => [...r])
  let hov = [2, 2]

  function computeMap() {
    const W = 7
    const outW = padMode === 'zero' ? W : W - 2
    const out = Array.from({ length: outW }, () => Array(outW).fill(0))
    for (let i = 0; i < outW; i++) {
      for (let j = 0; j < outW; j++) {
        let s = 0
        for (let p = 0; p < 3; p++) {
          for (let q = 0; q < 3; q++) {
            const ri = padMode === 'zero' ? i + p - 1 : i + p
            const rj = padMode === 'zero' ? j + q - 1 : j + q
            const v = ri >= 0 && ri < W && rj >= 0 && rj < W ? img[ri][rj] : 0
            s += v * ker[p][q]
          }
        }
        out[i][j] = s
      }
    }
    return out
  }

  const ro = readout([
    ['pos', '注目位置 $(i, j)$ の計算'],
    ['wt', '重み共有の比較（独立パラメータ数）', true],
  ])

  const host = document.createElement('canvas')
  canvas.append(host)
  const ctx = host.getContext('2d')

  let layoutRects = {}

  function draw() {
    const W = canvas.clientWidth || 560, H = Math.max(270, Math.min(360, W * 0.58))
    canvas.style.height = H + 'px'
    const d = Math.min(2, devicePixelRatio || 1)
    host.width = W * d; host.height = H * d
    host.style.width = W + 'px'; host.style.height = H + 'px'
    ctx.setTransform(d, 0, 0, d, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const fmap = computeMap()
    const outN = fmap.length
    hov = [clamp(hov[0], 0, outN - 1), clamp(hov[1], 0, outN - 1)]

    const cs = Math.min(28, (W - 90) / (7 + 3.6 + outN))
    const yTop = (H - cs * 7) / 2 + 8
    const xImg = 18
    const xKer = xImg + cs * 7 + 22
    const yKer = (H - cs * 3) / 2 + 8
    const xOut = xKer + cs * 3 + 24
    const yOut = (H - cs * outN) / 2 + 8
    layoutRects = { xImg, yTop, cs, xKer, yKer, xOut, yOut, outN }

    ctx.font = '800 12px "Zen Maru Gothic", sans-serif'
    ctx.fillStyle = COL.ink; ctx.textAlign = 'left'
    ctx.fillText('入力画像 (7×7)', xImg, yTop - 12)
    ctx.fillText('フィルタ h', xKer, yKer - 12)
    ctx.fillText(`特徴マップ u (${outN}×${outN})`, xOut, yOut - 12)

    // Draw input image
    for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) {
      const v = img[i][j]
      ctx.fillStyle = v > 0.5 ? COL.ink : '#fff'
      ctx.strokeStyle = COL.ink3; ctx.lineWidth = 1.2
      ctx.fillRect(xImg + j * cs, yTop + i * cs, cs, cs)
      ctx.strokeRect(xImg + j * cs, yTop + i * cs, cs, cs)
    }
    // Highlight receptive field on input
    const rfI = padMode === 'zero' ? hov[0] - 1 : hov[0]
    const rfJ = padMode === 'zero' ? hov[1] - 1 : hov[1]
    ctx.save()
    ctx.strokeStyle = COL.coralD; ctx.lineWidth = 3.2
    ctx.strokeRect(xImg + rfJ * cs, yTop + rfI * cs, cs * 3, cs * 3)
    ctx.restore()

    // Draw 3×3 filter (clickable!)
    for (let p = 0; p < 3; p++) for (let q = 0; q < 3; q++) {
      const v = ker[p][q]
      ctx.fillStyle = v > 0 ? '#FFE3D6' : v < 0 ? '#DDEBFF' : '#fff'
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 1.8
      ctx.fillRect(xKer + q * cs, yKer + p * cs, cs, cs)
      ctx.strokeRect(xKer + q * cs, yKer + p * cs, cs, cs)
      ctx.fillStyle = COL.ink; ctx.font = '700 11px "DM Mono", monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(String(v), xKer + (q + 0.5) * cs, yKer + (p + 0.5) * cs)
    }

    // Draw feature map
    let maxAbs = 1
    fmap.forEach(r => r.forEach(v => { maxAbs = Math.max(maxAbs, Math.abs(v)) }))
    for (let i = 0; i < outN; i++) for (let j = 0; j < outN; j++) {
      const v = fmap[i][j]
      const k = clamp(v / maxAbs, -1, 1)
      ctx.fillStyle = k >= 0
        ? `rgba(255,142,110,${0.12 + 0.85 * k})`
        : `rgba(140,200,255,${0.12 + 0.75 * (-k)})`
      ctx.fillRect(xOut + j * cs, yOut + i * cs, cs, cs)
      ctx.strokeStyle = (i === hov[0] && j === hov[1]) ? COL.ink : 'rgba(42,37,64,.25)'
      ctx.lineWidth = (i === hov[0] && j === hov[1]) ? 3 : 1.1
      ctx.strokeRect(xOut + j * cs, yOut + i * cs, cs, cs)
      ctx.fillStyle = COL.ink; ctx.font = '700 10px "DM Mono", monospace'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(v.toFixed(0), xOut + (j + 0.5) * cs, yOut + (i + 0.5) * cs)
    }

    const uVal = fmap[hov[0]][hov[1]]
    ro.set('pos', `u[${hov[0]},${hov[1]}] = ${uVal.toFixed(0)}  （ReLU後 = ${Math.max(0, uVal).toFixed(0)}）`, uVal >= 2 ? 'good' : '')
    ro.set('wt', `重み共有あり：H² = 9 個  ≪  全結合 W⁴ = ${7 ** 4} 個`)
  }

  host.addEventListener('pointermove', e => {
    const r = host.getBoundingClientRect()
    const px = e.clientX - r.left, py = e.clientY - r.top
    const { xOut, yOut, cs, outN, xImg, yTop } = layoutRects
    if (!cs) return
    if (px >= xOut && px < xOut + cs * outN && py >= yOut && py < yOut + cs * outN) {
      hov = [Math.floor((py - yOut) / cs), Math.floor((px - xOut) / cs)]
      draw()
    } else if (px >= xImg && px < xImg + cs * 7 && py >= yTop && py < yTop + cs * 7) {
      const i = Math.floor((py - yTop) / cs), j = Math.floor((px - xImg) / cs)
      hov = [clamp(padMode === 'zero' ? i : i - 1, 0, outN - 1), clamp(padMode === 'zero' ? j : j - 1, 0, outN - 1)]
      draw()
    }
  })

  host.addEventListener('pointerdown', e => {
    const r = host.getBoundingClientRect()
    const px = e.clientX - r.left, py = e.clientY - r.top
    const { xKer, yKer, cs, xImg, yTop } = layoutRects
    if (!cs) return
    if (px >= xKer && px < xKer + cs * 3 && py >= yKer && py < yKer + cs * 3) {
      const p = Math.floor((py - yKer) / cs), q = Math.floor((px - xKer) / cs)
      const seq = [-1, 0, 1, 2]
      ker[p][q] = seq[(seq.indexOf(ker[p][q]) + 1) % seq.length]
      draw()
      toast(`フィルタ h[${p},${q}] = ${ker[p][q]} に変更！`)
    } else if (px >= xImg && px < xImg + cs * 7 && py >= yTop && py < yTop + cs * 7) {
      const i = Math.floor((py - yTop) / cs), j = Math.floor((px - xImg) / cs)
      img[i][j] = img[i][j] ? 0 : 1
      draw()
    }
  })

  const roObs = new ResizeObserver(draw)
  roObs.observe(canvas)

  side.append(
    seg({ label: '入力画像パターン（クリックで画素反転も可）', options: [['cross', '十 十字'], ['box', '□ 四角'], ['diag', '＼ 斜め']], value: patKey, onChange: v => { patKey = v; img = PATTERNS[v].map(r => [...r]); draw() } }),
    seg({ label: '3×3 フィルタ（マスをクリックで編集可）', options: [['vert', '┃ 縦線'], ['horiz', '━ 横線'], ['lap', '◎ 輪郭']], value: filKey, onChange: v => { filKey = v; ker = FILTERS[v].map(r => [...r]); draw() } }),
    seg({ label: 'パディング', options: [['zero', '0パディング (7×7)'], ['none', 'なし (5×5)']], value: padMode, onChange: v => { padMode = v; draw() } }),
    ro,
    h('div.lab-hint', { html: '「縦線フィルタ」を「十字」に当てると、<b>縦の棒だけが強く反応（オレンジ）</b>し、横棒は消える！ パディングなしだと特徴マップが $5\\times 5$ に縮むことも確認しよう。' }),
  )
  draw()
  return () => roObs.disconnect()
}

// ═════════ プーリング層の位置不変性 ＆ 最大プーリング逆伝播ルート実験 ═════════
export function shiftInvarianceLab(body) {
  const { canvas, side } = layout(body)
  let dx = 0, dy = 0, poolMode = 'max', showBackprop = false

  function makeShifted() {
    // 6x6 input with a vertical bar that can shift by (dx, dy)
    const g = Array.from({ length: 6 }, () => Array(6).fill(0))
    for (let r = 1; r <= 4; r++) {
      const i = clamp(r + dy, 0, 5), j = clamp(2 + dx, 0, 5)
      g[i][j] = 1
    }
    return g
  }

  function runConvPool(inp) {
    // 3x3 vertical detector with 0-padding -> 6x6 ReLU map -> 2x2 stride 2 pooling -> 3x3
    const ker = [[-0.5, 1, -0.5], [-0.5, 1, -0.5], [-0.5, 1, -0.5]]
    const cmap = Array.from({ length: 6 }, () => Array(6).fill(0))
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      let s = 0
      for (let p = 0; p < 3; p++) for (let q = 0; q < 3; q++) {
        const ri = i + p - 1, rj = j + q - 1
        const v = ri >= 0 && ri < 6 && rj >= 0 && rj < 6 ? inp[ri][rj] : 0
        s += v * ker[p][q]
      }
      cmap[i][j] = Math.max(0, s) // ReLU
    }
    const pmap = Array.from({ length: 3 }, () => Array(3).fill(0))
    const winners = Array.from({ length: 6 }, () => Array(6).fill(0))
    for (let pi = 0; pi < 3; pi++) for (let pj = 0; pj < 3; pj++) {
      let mx = -1, mi = pi * 2, mj = pj * 2, sum = 0
      for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
        const v = cmap[pi * 2 + a][pj * 2 + b]
        sum += v
        if (v > mx) { mx = v; mi = pi * 2 + a; mj = pj * 2 + b }
      }
      if (poolMode === 'max') {
        pmap[pi][pj] = mx
        winners[mi][mj] = 1
      } else {
        pmap[pi][pj] = sum / 4
        for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) winners[pi * 2 + a][pj * 2 + b] = 0.25
      }
    }
    return { cmap, pmap, winners }
  }

  const ro = readout([
    ['sh', '入力画像の平行移動 $(\\Delta x, \\Delta y)$'],
    ['diff', '中心位置からのプーリング出力類似度', true],
  ])

  const host = document.createElement('canvas')
  canvas.append(host)
  const ctx = host.getContext('2d')

  function draw() {
    const W = canvas.clientWidth || 560, H = Math.max(250, Math.min(340, W * 0.56))
    canvas.style.height = H + 'px'
    const d = Math.min(2, devicePixelRatio || 1)
    host.width = W * d; host.height = H * d
    host.style.width = W + 'px'; host.style.height = H + 'px'
    ctx.setTransform(d, 0, 0, d, 0, 0)
    ctx.clearRect(0, 0, W, H)

    const base = runConvPool(Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (__, j) => (i >= 1 && i <= 4 && j === 2 ? 1 : 0))))
    const inp = makeShifted()
    const { cmap, pmap, winners } = runConvPool(inp)

    const cs = Math.min(27, (W - 88) / 16)
    const y6 = (H - cs * 6) / 2 + 10
    const x1 = 18, x2 = x1 + cs * 6 + 24, x3 = x2 + cs * 6 + 24
    const y3 = (H - cs * 2 * 3) / 2 + 10

    ctx.font = '800 12px "Zen Maru Gothic", sans-serif'; ctx.fillStyle = COL.ink; ctx.textAlign = 'left'
    ctx.fillText('① 入力 (6×6)', x1, y6 - 12)
    ctx.fillText(showBackprop ? '② 逆伝播の重み (6×6)' : '② 特徴マップ (6×6)', x2, y6 - 12)
    ctx.fillText('③ プーリング (3×3)', x3, y3 - 12)

    // 1. Input
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      ctx.fillStyle = inp[i][j] ? COL.ink : '#fff'
      ctx.fillRect(x1 + j * cs, y6 + i * cs, cs, cs)
      ctx.strokeStyle = COL.ink3; ctx.lineWidth = 1; ctx.strokeRect(x1 + j * cs, y6 + i * cs, cs, cs)
    }

    // 2. Conv map (with 2x2 pool blocks outlined)
    for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) {
      const v = cmap[i][j]
      const w = winners[i][j]
      ctx.fillStyle = showBackprop
        ? (w > 0.5 ? '#FFD66B' : w > 0 ? '#FFF4CC' : '#F6F4FA')
        : `rgba(111,214,184,${0.1 + 0.28 * v})`
      ctx.fillRect(x2 + j * cs, y6 + i * cs, cs, cs)
      ctx.strokeStyle = 'rgba(42,37,64,.2)'; ctx.lineWidth = 1; ctx.strokeRect(x2 + j * cs, y6 + i * cs, cs, cs)
      ctx.fillStyle = COL.ink; ctx.font = '700 9.5px "DM Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(showBackprop ? (w === 1 ? '1' : w === 0.25 ? '¼' : '0') : v.toFixed(1), x2 + (j + 0.5) * cs, y6 + (i + 0.5) * cs)
    }
    ctx.strokeStyle = COL.ink; ctx.lineWidth = 2.2
    for (let pi = 0; pi < 3; pi++) for (let pj = 0; pj < 3; pj++) {
      ctx.strokeRect(x2 + pj * 2 * cs, y6 + pi * 2 * cs, cs * 2, cs * 2)
    }

    // 3. Pooled 3x3 (drawn at 2*cs size for visual alignment!)
    const pcs = cs * 1.65
    const y3b = (H - pcs * 3) / 2 + 10
    for (let pi = 0; pi < 3; pi++) for (let pj = 0; pj < 3; pj++) {
      const v = pmap[pi][pj]
      ctx.fillStyle = `rgba(255,142,110,${0.12 + 0.28 * v})`
      ctx.fillRect(x3 + pj * pcs, y3b + pi * pcs, pcs, pcs)
      ctx.strokeStyle = COL.ink; ctx.lineWidth = 2; ctx.strokeRect(x3 + pj * pcs, y3b + pi * pcs, pcs, pcs)
      ctx.fillStyle = COL.ink; ctx.font = '800 12px "DM Mono", monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(v.toFixed(1), x3 + (pj + 0.5) * pcs, y3b + (pi + 0.5) * pcs)
    }

    // Cosine similarity between base.pmap and pmap
    let dot = 0, n1 = 0, n2 = 0
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      dot += base.pmap[i][j] * pmap[i][j]
      n1 += base.pmap[i][j] ** 2; n2 += pmap[i][j] ** 2
    }
    const sim = dot / (Math.sqrt(n1 * n2) || 1)
    ro.set('sh', `(Δx = ${dx}, Δy = ${dy})`)
    ro.set('diff', `一致度 ${(sim * 100).toFixed(0)}%  ${sim > 0.95 ? '（ズレても不変！）' : ''}`, sim > 0.9 ? 'good' : '')
  }

  const roObs = new ResizeObserver(draw)
  roObs.observe(canvas)

  side.append(
    seg({ label: 'プーリング方式', options: [['max', '🏆 最大プーリング'], ['avg', '⚖️ 平均プーリング']], value: poolMode, onChange: v => { poolMode = v; draw() } }),
    h('div.btn-row',
      button('← 左へ', () => { dx = clamp(dx - 1, -2, 2); draw() }),
      button('右へ →', () => { dx = clamp(dx + 1, -1, 2); draw(); if (dx === 1 && dy === 0) toast('1マス右にズレたのに、最大プーリング出力は100%同じ！（位置不変性）', { kind: 'ok' }) }, 'butter'),
      button('↑↓ 縦ズレ', () => { dy = dy === 0 ? 1 : 0; draw() }),
      button('↺ 中央', () => { dx = 0; dy = 0; draw() }),
    ),
    button('⬅️ 逆伝播のリンク重み (1 / 0 / ¼) 表示切替', () => { showBackprop = !showBackprop; draw() }, 'lav'),
    ro,
    h('div.lab-hint', { html: '「右へ →」を1回押してみて！ $2\\times 2$ ブロックの中で縦線が左列から右列へ移っても、<b>最大プーリング後の $3\\times 3$ はまったく同じ値（一致度100%）</b>を保つ！ 逆伝播表示に切り替えると、最大プーリングでは最大値をとったマスだけに重み $1$ で誤差が戻ることもわかる。' }),
  )
  draw()
  return () => roObs.disconnect()
}
