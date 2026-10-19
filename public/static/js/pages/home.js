import { h, $, $$, avatar, mascot, splitChars, reduced, onVisible, countUp, tilt, store } from '../lib/ui.js'
import { talk } from './chapter.js'
import { mulberry, randn, polyfit, polyval } from '../lib/plot.js'

const ICONS = {
  curve: (c) => `<svg viewBox="0 0 200 120"><path d="M10 60 C 40 0, 70 0, 100 60 S 160 120, 190 60" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" class="draw" pathLength="1"/>${[[20, 44], [52, 18], [84, 34], [116, 82], [148, 100], [180, 70]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="#2A2540" stroke-width="3" class="pop" style="--d:${i * .06}s"/>`).join('')}</svg>`,
  bell: (c) => `<svg viewBox="0 0 200 120"><path d="M10 110 C 60 110, 70 14, 100 14 S 140 110, 190 110 Z" fill="${c}" fill-opacity=".35" stroke="#2A2540" stroke-width="4"/>${[40, 70, 100, 130, 160].map((x, i) => { const hh = [16, 54, 90, 54, 16][i]; return `<rect x="${x - 9}" y="${110 - hh}" width="18" height="${hh}" rx="4" fill="#fff" stroke="#2A2540" stroke-width="2.5" class="grow" style="--d:${i * .06}s"/>` }).join('')}</svg>`,
  peak: (c) => `<svg viewBox="0 0 200 120"><path d="M10 110 Q 100 -40 190 110" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" class="draw" pathLength="1"/><path d="M100 36 V 110" stroke="#2A2540" stroke-width="2.5" stroke-dasharray="5 5"/><circle cx="100" cy="36" r="10" fill="#FFD66B" stroke="#2A2540" stroke-width="3" class="pop"/><text x="114" y="30" font-family="Fredoka" font-weight="700" font-size="16" fill="#2A2540">ML</text></svg>`,
  valley: (c) => `<svg viewBox="0 0 200 120"><path d="M10 10 Q 100 200 190 10" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" class="draw" pathLength="1"/><circle cx="100" cy="99" r="11" fill="#FF8E6E" stroke="#2A2540" stroke-width="3" class="roll"/></svg>`,
  split: (c) => `<svg viewBox="0 0 200 120"><path d="M10 110 C 40 110, 50 20, 75 20 S 110 110, 140 110" stroke="#FF8E6E" stroke-width="5" fill="none" class="draw" pathLength="1"/><path d="M60 110 C 90 110, 100 30, 125 30 S 160 110, 190 110" stroke="${c}" stroke-width="5" fill="none" class="draw" pathLength="1"/><path d="M100 0 V 120" stroke="#2A2540" stroke-width="4" class="slide"/></svg>`,
  roc: (c) => `<svg viewBox="0 0 200 120"><rect x="40" y="6" width="120" height="108" rx="8" fill="#fff" stroke="#2A2540" stroke-width="3"/><path d="M40 114 L160 6" stroke="#8E88A6" stroke-width="2" stroke-dasharray="5 5"/><path d="M40 114 C 46 40, 80 14, 160 6" stroke="${c}" stroke-width="6" fill="none" stroke-linecap="round" class="draw" pathLength="1"/></svg>`,
}

export function renderHome(root, chapters) {
  const cleanups = []
  const prog = store.get()

  // ═════ HERO ═════
  const t1 = h('span.row', h('span.split', 'さわって'))
  const t2 = h('span.row', h('span.accent', h('span.split', 'わかる')), h('span.split', '、'))
  const t3 = h('span.row.en-row', h('span.split.en', 'Machine Learning'))
  const lblM = h('div.stage-label', { style: { left: '-4%', bottom: '20%' } }, 'M = 0')
  const lblE = h('div.stage-label', { style: { right: '0%', top: '6%', background: '#FFF0B8' } }, '単純すぎ 🙃')
  const badge = h('div.hero-badge', { html: `<svg viewBox="0 0 120 120"><g class="spin"><path id="circ" d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0" fill="none"/><text><textPath href="#circ">MACHINE LEARNING I · PART I · </textPath></text></g><circle cx="60" cy="60" r="26" fill="#FFD66B" stroke="#2A2540" stroke-width="3"/><text x="60" y="67" text-anchor="middle" font-family="Fredoka" font-weight="700" font-size="20" fill="#2A2540">ML</text></svg>` })
  const stage = h('div.hero-stage', h('div.ring'), h('canvas#hero-canvas', { role: 'img', 'aria-label': 'データ点に多項式曲線がフィットし、次数を上げると過学習するアニメーション' }), lblM, lblE, badge)
  stage.insertAdjacentHTML('beforeend', mascot('hero-mascot'))

  const hero = h('section.hero#hero-section',
    h('div.wrap.hero-grid',
      h('div',
        h('span.chip.hero-chip', '🧠 機械学習 I ・ Part I 基礎'),
        h('h1.hero-title', t1, t2, t3),
        h('p.hero-lead', { html: '数式を読む前に、<b>動かして</b>つかむ。<br><b>サカイ</b>先輩と<b>リョウガ</b>くんのおしゃべりを聞きながら、点を動かし、曲線を曲げ、確率をふくらませる——機械学習の、ちいさな実験室です。' }),
        h('div.hero-cta',
          h('a.btn', { href: '/ch/' + chapters[0].slug, 'data-link': '' }, '第1回からはじめる', h('span.arr', '→')),
          h('a.btn.ghost', { href: '/#chapters', 'data-link': '' }, '講義一覧を見る'))),
      stage),
    h('div.scroll-cue', h('i'), 'SCROLL'))
  root.append(hero)

  const words = ['分類', '回帰', '最小2乗法', '過学習', '正則化', 'ベイズの定理', 'ガウス分布', '最尤推定', 'MAP推定', '期待損失', '決定理論', 'ROC-AUC']
  const mq = (alt) => h('div.marquee' + (alt ? '.alt' : ''), { 'aria-hidden': 'true' }, h('div.marquee-track', [...words, ...words].map(w => h('span', w))))
  root.append(mq(false), mq(true))

  // ═════ KINETIC ═════
  const kinWords = ['機械学習とは、', ['データ', 'pop'], 'から', ['関数', 'pop3'], 'を', 'つくること。', 'むずかしいのは、', ['まだ見ぬ', 'pop2'], ['データ', 'pop2'], 'に', '強いこと。']
  const kin = h('section.kinetic.wrap#statement',
    h('p.kinetic-line', kinWords.map(w => Array.isArray(w) ? h('span.w.' + w[1], w[0]) : h('span.w', w))),
    h('div.kinetic-sub', '— 汎化（はんか）。この科目のすべては、ここに向かっていきます。'))
  root.append(kin)
  const kws = $$('.w', kin)
  const onK = () => { const r = kin.getBoundingClientRect(); const p = Math.max(0, Math.min(1, (innerHeight * .85 - r.top) / (innerHeight * .55))); kws.forEach((w, i) => w.classList.toggle('on', i < Math.round(p * kws.length))) }
  addEventListener('scroll', onK, { passive: true }); cleanups.push(() => removeEventListener('scroll', onK)); setTimeout(onK, 60)

  // ═════ HOW ═════
  const pipe = h('section.section.wrap#how',
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'How it works'), h('h2', '学び方は、3ステップ')), h('p', '各回は「対話で直感 → ラボで手を動かす → POINT と演習で言葉にする」の順番。式は最後に、意味がわかってから。')),
    h('div.pipeline',
      h('div.pipe-card.reveal', h('div.num', '01'), h('div.viz#viz-talk'), h('h3', '💬 対話で直感'), h('p', 'リョウガくんの素朴なギモンに、サカイ先輩がたとえ話で答える。')),
      h('div.pipe-card.reveal', h('div.num', '02'), h('div.viz#viz-lab'), h('h3', '🧪 さわれるラボ'), h('p', 'スライダー、ドラッグ、ボタン。式が「動く絵」になる。')),
      h('div.pipe-card.reveal', h('div.num', '03'), h('div.viz#viz-point'), h('h3', '📝 POINT と演習'), h('p', '要点カード、式の部品ハイライト、ステップ解答つき演習、確認クイズ。'))))
  root.append(pipe)

  const count = (pred) => chapters.reduce((s, c) => s + c.sections.reduce((a, sec) => a + sec.blocks.reduce((q, b) => q + pred(b), 0), 0), 0)
  const nLabs = count(b => b.t === 'lab' ? 1 : 0), nQuiz = count(b => (b.t === 'quiz' || b.t === 'exer') ? 1 : 0), nTalk = count(b => b.t === 'talk' ? b.lines.length : 0)
  const statsData = [[chapters.length, '公開中の回', '#FF8E6E', chapters.length / 14], [nLabs, 'さわれるラボ', '#6FD6B8', nLabs / 30], [nTalk, '対話のセリフ', '#B9A7FF', 1], [nQuiz, 'クイズ・演習', '#FFD66B', nQuiz / 40]]
  const stats = h('div.stats', statsData.map(([n, l, c, p]) => { const el = h('div.stat.reveal', h('div.n', '0'), h('div.l', l), h('div.bar', h('i', { style: { background: c } }))); el.dataset.n = n; el.dataset.p = Math.min(1, p); return el }))
  pipe.append(stats)
  $$('.stat', stats).forEach(el => onVisible(el, () => { countUp($('.n', el), +el.dataset.n, { dur: 1.4 }); setTimeout(() => ($('.bar i', el).style.width = el.dataset.p * 100 + '%'), 100) }))

  // ═════ CAST ═════
  const castTalk = h('div.reveal', { style: { marginTop: '34px' } })
  castTalk.append(talk([
    ['R', 'think', 'ぼく、数式を見ると眠くなっちゃうんですよね……'],
    ['S', 'wink', 'だからこのサイトでは、まず**動かす**。式はそのあと。点を1個ドラッグするだけで、最小2乗法の気持ちはわかるよ。'],
    ['R', 'happy', 'それならいけそう！ じゃあ第1回から！'],
  ]))
  root.append(h('section.section.wrap#cast', { style: { paddingTop: 0 } },
    h('div.sec-head.reveal', h('div', h('div.eyebrow', 'Cast'), h('h2', 'ふたりと一緒に')), h('p', 'すべての回は、ふたりの対話で進みます。わからないところは、だいたいリョウガくんが先に聞いてくれます。')),
    h('div.cast',
      h('div.cast-card.s.reveal', h('div.av', { html: avatar('S', 'happy') }), h('div', h('h3', 'サカイ先輩', h('small', 'SENPAI ・ 解説役')), h('p', '去年この授業を通った先輩。定義を読む前に「なんでそう決めたのか」を話したがる。たとえ話が得意。'))),
      h('div.cast-card.r.reveal', h('div.av', { html: avatar('R', 'wow') }), h('div', h('h3', 'リョウガくん', h('small', 'KOUHAI ・ 質問役')), h('p', '受講中の2年生。直感派で、ときどき大胆な結論に飛びつく。「それって結局なにしてるんですか？」が口ぐせ。')))),
    castTalk))

  // ═════ CHAPTERS ═════
  const grid = h('div.ch-grid')
  chapters.forEach(ch => {
    const done = prog[ch.slug]?.read
    const nl = ch.sections.reduce((a, s) => a + s.blocks.filter(b => b.t === 'lab').length, 0)
    const card = h('a.ch-card.reveal', { href: '/ch/' + ch.slug, 'data-link': '', style: { '--c': ch.color } },
      h('div.top', h('span.no', `第${ch.no}回`), h('span.chip', ch.en)),
      h('div.ic', { html: (ICONS[ch.icon] || ICONS.curve)(ch.color) }),
      h('h3', ch.title), h('p', ch.lead),
      h('div.meta', h('span.chip', `🧪 ${nl} labs`), h('span.chip', `📚 ${ch.sections.length} sections`), done ? h('span.chip', { style: { background: '#C9F1E3' } }, '✓ 読了') : null))
    tilt(card, 7)
    grid.append(card)
  })
  const soon = h('div.ch-card.soon.reveal'); soon.insertAdjacentHTML('beforeend', mascot()); soon.append(h('h3', '第7回〜'), h('p', { style: { flex: 0 } }, '講義プリントが届いたら、ここに新しい回が増えます。'))
  grid.append(soon)
  root.append(h('section.section.wrap#chapters', h('div.sec-head.reveal', h('div', h('div.eyebrow', 'Chapters'), h('h2', '講義一覧')), h('p', 'Part I 基礎。どこからでも読めるけど、順番に進むとストーリーがつながります。')), grid))

  // ═════ animations ═════
  const chars = $$('.split', hero).flatMap(el => splitChars(el))
  const play = () => {
    hero.classList.add('ready')
    if (reduced || !window.gsap) return
    gsap.from(chars, { yPercent: 120, rotate: () => gsap.utils.random(-30, 30), opacity: 0, duration: 1, stagger: .04, ease: 'back.out(1.8)' })
    gsap.from('.hero-chip, .hero-lead, .hero-cta .btn', { y: 24, opacity: 0, duration: .8, stagger: .1, delay: .5, ease: 'power3.out', clearProps: 'transform,opacity' })
    gsap.from('.hero-stage', { scale: .6, rotate: -12, opacity: 0, duration: 1.2, delay: .2, ease: 'elastic.out(1, .6)' })
    gsap.from('.hero-stage .stage-label', { scale: 0, duration: .6, delay: 1.1, stagger: .15, ease: 'back.out(3)' })
    gsap.to('.hero-mascot', { y: -12, rotate: 6, duration: 1.6, yoyo: true, repeat: -1, ease: 'sine.inOut' })
    if (window.ScrollTrigger) {
      gsap.to('.hero-stage', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
      gsap.to('.hero-title', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } })
    }
    chars.forEach(c => c.addEventListener('pointerenter', () => gsap.fromTo(c, { y: 0, rotate: 0 }, { y: -18, rotate: gsap.utils.random(-20, 20), duration: .25, yoyo: true, repeat: 1, ease: 'power2.out' })))
  }
  if (window.__loaderDone) play(); else document.addEventListener('loader:done', play, { once: true })
  $$('.reveal', root).forEach(el => onVisible(el, t => t.classList.add('in'), { threshold: .12 }))
  cleanups.push(heroCanvas($('#hero-canvas'), lblM, lblE))
  cleanups.push(miniViz())
  return () => cleanups.forEach(f => f && f())
}

function heroCanvas(cv, lblM, lblE) {
  const g = cv.getContext('2d')
  const r = mulberry(2)
  const xs = Array.from({ length: 10 }, (_, i) => i / 9)
  const ts = xs.map(x => Math.sin(2 * Math.PI * x) + randn(r) * .22)
  const seq = [0, 1, 3, 9, 3]
  const fits = {}; seq.forEach(m => (fits[m] = polyfit(xs, ts, m)))
  let k = 0, from = fits[0], to = fits[0], t0 = performance.now(), raf, mouse = null
  const dpr = Math.min(2, devicePixelRatio || 1)
  const size = () => { const s = cv.clientWidth || 400; cv.width = s * dpr; cv.height = s * dpr }
  size(); const ro = new ResizeObserver(size); ro.observe(cv)
  cv.addEventListener('pointermove', (e) => { const b = cv.getBoundingClientRect(); mouse = [(e.clientX - b.left) / b.width, (e.clientY - b.top) / b.height] })
  cv.addEventListener('pointerleave', () => (mouse = null))
  const setLabel = (m) => {
    lblM.textContent = `M = ${m}`
    const [t, bg] = m === 9 ? ['過学習！ 😱', '#FFD9CE'] : m < 3 ? ['単純すぎ 🙃', '#FFF0B8'] : ['ちょうどいい 👍', '#C9F1E3']
    lblE.textContent = t; lblE.style.background = bg
    if (window.gsap && !reduced) gsap.fromTo([lblM, lblE], { scale: .7 }, { scale: 1, duration: .5, ease: 'back.out(3)' })
  }
  const frame = (now) => {
    const S = cv.width, pad = S * .16
    const X = x => pad + x * (S - 2 * pad), Y = y => S / 2 - y * (S - 2 * pad) * .32
    g.clearRect(0, 0, S, S)
    g.fillStyle = 'rgba(42,37,64,.12)'
    for (let i = 0; i < 14; i++) for (let j = 0; j < 14; j++) { g.beginPath(); g.arc(S * (i + .5) / 14, S * (j + .5) / 14, 1.4 * dpr, 0, 7); g.fill() }
    const el = (now - t0) / 1000
    if (el > 2.4) { k = (k + 1) % seq.length; from = to; to = fits[seq[k]]; t0 = now; setLabel(seq[k]) }
    const p = Math.min(1, el / .9), e = 1 - Math.pow(1 - p, 4)
    g.setLineDash([8 * dpr, 7 * dpr]); g.strokeStyle = '#2FB58E'; g.lineWidth = 2.5 * dpr; g.beginPath()
    for (let i = 0; i <= 100; i++) { const x = i / 100, y = Y(Math.sin(2 * Math.PI * x)); i ? g.lineTo(X(x), y) : g.moveTo(X(x), y) }
    g.stroke(); g.setLineDash([])
    g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 3 * dpr, 0, 7); g.clip()
    g.strokeStyle = '#FF8E6E'; g.lineWidth = 6 * dpr; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath()
    for (let i = 0; i <= 200; i++) { const x = -0.04 + i / 200 * 1.08; const y = polyval(from, x) * (1 - e) + polyval(to, x) * e; const yy = Math.max(-3, Math.min(3, y)); i ? g.lineTo(X(x), Y(yy)) : g.moveTo(X(x), Y(yy)) }
    g.stroke(); g.restore()
    xs.forEach((x, i) => {
      let px = X(x), py = Y(ts[i])
      if (mouse) { const dx = px - mouse[0] * S, dy = py - mouse[1] * S, d = Math.hypot(dx, dy) || 1; if (d < 60 * dpr) { px += dx / d * (60 * dpr - d) * .4; py += dy / d * (60 * dpr - d) * .4 } }
      const bob = Math.sin(now / 600 + i) * 2 * dpr
      g.beginPath(); g.arc(px, py + bob, 9 * dpr, 0, 7); g.fillStyle = ['#B9A7FF', '#FFD66B', '#8CC8FF', '#6FD6B8'][i % 4]; g.fill(); g.lineWidth = 3 * dpr; g.strokeStyle = '#2A2540'; g.stroke()
    })
    if (!reduced) raf = requestAnimationFrame(frame)
  }
  if (reduced) { from = to = fits[3]; setLabel(3); frame(performance.now()) } else raf = requestAnimationFrame(frame)
  return () => { cancelAnimationFrame(raf); ro.disconnect() }
}

function miniViz() {
  const vt = $('#viz-talk'), vl = $('#viz-lab'), vp = $('#viz-point')
  if (!vt) return
  vt.innerHTML = `<svg viewBox="0 0 240 120" width="100%" height="100%"><g class="b1"><rect x="14" y="16" width="130" height="34" rx="16" fill="#fff" stroke="#2A2540" stroke-width="2.5"/><rect x="28" y="29" width="80" height="8" rx="4" fill="#FF8E6E"/></g><g class="b2"><rect x="96" y="66" width="130" height="34" rx="16" fill="#EFFBF6" stroke="#2A2540" stroke-width="2.5"/><rect x="112" y="79" width="96" height="8" rx="4" fill="#6FD6B8"/></g></svg>`
  vl.innerHTML = `<svg viewBox="0 0 240 120" width="100%" height="100%"><path class="ln" d="M20 60 L220 90" stroke="#FF8E6E" stroke-width="5" stroke-linecap="round"/>${[[50, 80], [90, 66], [130, 58], [170, 44], [200, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="#B9A7FF" stroke="#2A2540" stroke-width="2.5"/>`).join('')}<rect x="30" y="104" width="180" height="8" rx="4" fill="#fff" stroke="#2A2540" stroke-width="2"/><circle class="knob" cx="50" cy="108" r="8" fill="#FFD66B" stroke="#2A2540" stroke-width="2.5"/></svg>`
  vp.innerHTML = `<svg viewBox="0 0 240 120" width="100%" height="100%"><rect x="24" y="14" width="192" height="92" rx="14" fill="#FFD66B" stroke="#2A2540" stroke-width="2.5"/>${[0, 1, 2].map(i => `<g class="li"><circle cx="46" cy="${40 + i * 24}" r="5" fill="#F2694A"/><rect x="60" y="${36 + i * 24}" width="${[120, 90, 136][i]}" height="8" rx="4" fill="#2A2540" opacity=".75"/></g>`).join('')}</svg>`
  if (reduced || !window.gsap) return
  const a = gsap.timeline({ repeat: -1, repeatDelay: .6 })
  a.fromTo('#viz-talk .b1', { scale: 0, opacity: 1, transformOrigin: '14px 33px' }, { scale: 1, duration: .5, ease: 'back.out(2)' })
    .fromTo('#viz-talk .b2', { scale: 0, opacity: 1, transformOrigin: '226px 83px' }, { scale: 1, duration: .5, ease: 'back.out(2)' }, '+=.4')
    .to('#viz-talk g', { opacity: 0, duration: .3 }, '+=1.4')
  const b = gsap.timeline({ repeat: -1, yoyo: true, repeatDelay: .4 })
  b.to('#viz-lab .knob', { attr: { cx: 170 }, duration: 1.6, ease: 'sine.inOut' }).to('#viz-lab .ln', { attr: { d: 'M20 94 L220 32' }, duration: 1.6, ease: 'sine.inOut' }, 0)
  const c = gsap.timeline({ repeat: -1, repeatDelay: .6 })
  c.fromTo('#viz-point .li', { x: -20, opacity: 0 }, { x: 0, opacity: 1, duration: .4, stagger: .25, ease: 'back.out(2)' }).to('#viz-point .li', { opacity: 0, duration: .3 }, '+=1.4')
  return () => [a, b, c].forEach(t => t.kill())
}
