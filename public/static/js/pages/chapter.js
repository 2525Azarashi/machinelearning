import { h, $, $$, rich, tex, avatar, CAST, splitChars, reduced, onVisible, confetti, toast, store, tilt } from '../lib/ui.js'
import { LABS } from '../labs/index.js'
import { skeletonLab, openSheet, closeSheet } from '../lib/patterns.js'

export function renderChapter(root, ch, all) {
  const cleanups = []
  const page = h('article.chapter', { style: { '--c': ch.color } })

  // ───── hero ─────
  const title = h('h1', ch.title)
  const hero = h('section.ch-hero.wrap#chapter-hero',
    h('div.bignum', { 'aria-hidden': 'true' }, String(ch.no).padStart(2, '0')),
    h('div.crumb', h('a', { href: '/', 'data-link': '' }, 'HOME'), h('span', '／'), h('a', { href: '/#chapters', 'data-link': '' }, 'CHAPTERS'), h('span', '／'), h('span', `No.${String(ch.no).padStart(2, '0')} · ${ch.en}`)),
    title,
    h('p.sub', ch.sub),
    h('div.goals', ch.goals.map((g, i) => h('span.chip', h('b', `GOAL ${i + 1}`), g))),
  )
  page.append(hero)

  // ───── layout ─────
  const tocList = h('ol')
  const tocBar = h('i')
  const toc = h('aside.toc', { 'aria-label': '目次' },
    h('div.toc-title', 'CONTENTS'), tocList,
    h('div.toc-progress', h('div', '読んだところ'), h('div.bar', tocBar)))
  const body = h('div.ch-body')
  page.append(h('div.wrap.ch-layout', toc, body))

  let labCount = 0
  ch.sections.forEach((sec, si) => {
    const s = h('section.block-sec#' + sec.id, { 'aria-labelledby': sec.id + '-h' },
      h('h2#' + sec.id + '-h.reveal', h('span.idx', String(si + 1).padStart(2, '0')), h('span', sec.title)))
    sec.blocks.forEach(b => {
      const el = renderBlock(b, ch, cleanups, () => ++labCount)
      if (el) s.append(el)
    })
    body.append(s)
    tocList.append(h('li', h('a', { href: '#' + sec.id, onclick: (e) => { e.preventDefault(); s.scrollIntoView({ behavior: 'smooth' }) } }, sec.title)))
  })

  // prev / next
  const idx = all.findIndex(c => c.slug === ch.slug)
  const prev = all[idx - 1], next = all[idx + 1]
  body.append(h('nav.ch-nav', { 'aria-label': '前後の章' },
    prev ? h('a.prev', { href: '/ch/' + prev.slug, 'data-link': '' }, h('small', '← PREV'), h('b', `${prev.no}. ${prev.title}`)) : h('span'),
    next ? h('a.next', { href: '/ch/' + next.slug, 'data-link': '' }, h('small', 'NEXT →'), h('b', `${next.no}. ${next.title}`)) : h('a.next', { href: '/notes', 'data-link': '' }, h('small', 'NEXT →'), h('b', '公式ノートでふりかえる'))))

  root.append(page)

  // ───── スマホ用：目次 Bottom Sheet ─────
  const fab = h('button.toc-fab', { type: 'button', 'aria-label': '目次を開く', 'aria-haspopup': 'dialog' },
    h('span.toc-fab-ring', { html: '<svg viewBox="0 0 44 44" width="44" height="44"><circle cx="22" cy="22" r="19" fill="none" stroke="rgba(42,37,64,.15)" stroke-width="4"/><circle class="tf-arc" cx="22" cy="22" r="19" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 22 22)"/></svg>' }),
    h('span.toc-fab-ic', '☰'), h('span.toc-fab-lb', '目次'))
  fab.addEventListener('click', () => {
    const list = h('ol.sheet-toc')
    ch.sections.forEach((sec, i) => {
      const done = seen.has(i), cur = links[i]?.classList.contains('on')
      const nl = sec.blocks.filter(b => b.t === 'lab').length, nq = sec.blocks.filter(b => b.t === 'quiz' || b.t === 'exer').length
      list.append(h('li' + (cur ? '.cur' : '') + (done ? '.done' : ''), h('button', { type: 'button', onclick: () => { closeSheet(); setTimeout(() => document.getElementById(sec.id).scrollIntoView({ behavior: 'smooth' }), 250) } },
        h('span.st-no', done ? '✓' : String(i + 1).padStart(2, '0')),
        h('span.st-t', sec.title),
        h('span.st-meta', nl ? `🧪${nl}` : '', nq ? ` 📝${nq}` : ''))))
    })
    openSheet({ title: ch.title, eyebrow: `第${ch.no}回 · CONTENTS · ${Math.round(seen.size / secs.length * 100)}% 読了`, body: list, color: ch.color })
  })
  page.append(fab)

  // ───── animations ─────
  const chars = splitChars(title)
  if (!reduced && window.gsap) {
    gsap.from(chars, { yPercent: 110, rotate: () => gsap.utils.random(-25, 25), opacity: 0, duration: .9, stagger: .035, ease: 'back.out(2)', delay: .15 })
    gsap.from('.ch-hero .bignum', { xPercent: 30, opacity: 0, duration: 1.4, ease: 'expo.out' })
    gsap.from('.ch-hero .sub, .ch-hero .crumb', { y: 20, opacity: 0, duration: .8, delay: .5, stagger: .1, ease: 'power3.out' })
    gsap.from('.ch-hero .goals .chip', { scale: 0, opacity: 0, duration: .6, delay: .8, stagger: .08, ease: 'back.out(2.5)' })
    gsap.to('.ch-hero .bignum', { yPercent: 40, rotate: -6, ease: 'none', scrollTrigger: { trigger: '.ch-hero', start: 'top top', end: 'bottom top', scrub: true } })
  }
  $$('.reveal', page).forEach(el => onVisible(el, (t) => t.classList.add('in'), { threshold: .12 }))

  // toc spy + progress
  const links = $$('a', tocList)
  const secs = ch.sections.map(s => document.getElementById(s.id))
  const seen = new Set()
  const spy = () => {
    if (document.documentElement.classList.contains('sheet-open') || document.documentElement.classList.contains('search-open')) return
    let cur = 0
    secs.forEach((s, i) => { if (s.getBoundingClientRect().top < innerHeight * .4) cur = i })
    // 「読んだ」は、そのセクションに 1.2 秒以上とどまったときだけ（ジャンプで一気に既読にならない）
    clearTimeout(dwell); dwell = setTimeout(() => { if (!document.documentElement.classList.contains('sheet-open')) { seen.add(cur); paint() } }, 1200)
    links.forEach((a, i) => a.classList.toggle('on', i === cur))
  }
  let dwell
  cleanups.push(() => clearTimeout(dwell))
  const paint = () => {
    tocBar.style.width = (seen.size / secs.length) * 100 + '%'
    const arc = page.querySelector('.tf-arc'); if (arc) arc.style.strokeDashoffset = 1 - seen.size / secs.length
    if (seen.size === secs.length) store.mark(ch.slug, 'read')
  }
  addEventListener('scroll', spy, { passive: true }); spy()
  cleanups.push(() => removeEventListener('scroll', spy))

  return () => cleanups.forEach(f => { try { f() } catch (e) { console.warn(e) } })
}

// ═════════ blocks ═════════
function renderBlock(b, ch, cleanups, nextLab) {
  switch (b.t) {
    case 'talk': return talk(b.lines)
    case 'point': return h('div.point.reveal' + (b.tone ? '.' + b.tone : ''), b.title && h('h4', { html: rich(b.title) }), h('ul', b.items.map(i => h('li', { html: rich(i) }))))
    case 'formula': return formula(b)
    case 'lab': return lab(b, ch, cleanups, nextLab())
    case 'quiz': return quiz(b, ch)
    case 'exer': return exer(b)
    case 'compare': return h('div.compare.reveal', b.items.map((c, i) => h('div.cmp.' + (c.tone || 'abcd'[i]), h('h4', h('span.em', c.em || ''), h('span', { html: rich(c.title) })), h('ul', c.items.map(x => h('li', { html: rich(x) }))))))
    case 'flow': return flow(b)
    case 'kinetic': return kinetic(b, cleanups)
    case 'html': return h('div.reveal', { html: b.html })
  }
}

export function talk(lines) {
  const wrap = h('div.talk')
  const els = lines.map(([who, mood, text]) => {
    const c = CAST[who]
    return h('div.line.' + c.cls + '.pending',
      h('div.face', { html: avatar(who, mood) }),
      h('div.bubble', h('div.who', `${c.en} · ${c.name}${c.role}`), h('div.txt', { html: rich(text) })))
  })
  wrap.append(...els)
  if (reduced) { els.forEach(e => e.classList.replace('pending', 'shown')); return wrap }
  onVisible(wrap, () => {
    els.forEach((e, i) => setTimeout(() => e.classList.replace('pending', 'shown'), i * 260))
  }, { threshold: .05, rootMargin: '0px 0px -10% 0px' })
  return wrap
}

function formula(b) {
  const note = h('div.f-note', { html: rich(b.note || 'チップにカーソルを合わせると、式のどこが何なのか光ります。') })
  const bodyEl = h('div.f-body', { html: tex(b.tex, true) })
  const parts = h('div.f-parts', (b.parts || []).map(([cls, label, desc]) => {
    const chip = h('button.chip', { type: 'button', html: rich(label) })
    const on = () => {
      $$('.f-parts .chip', el).forEach(c => c.classList.remove('on')); chip.classList.add('on')
      $$('[class*="fp-"]', bodyEl).forEach(n => n.classList.remove('fp-lit'))
      $$('.' + cls, bodyEl).forEach(n => n.classList.add('fp-lit'))
      note.innerHTML = rich(desc)
    }
    chip.addEventListener('pointerenter', on); chip.addEventListener('focus', on); chip.addEventListener('click', on)
    return chip
  }))
  const el = h('div.formula.reveal', h('div.f-head', h('span', { html: rich(b.title || '式') }), h('span.chip', b.tag || 'FORMULA')), bodyEl, b.parts ? parts : null, note)
  return el
}

function lab(b, ch, cleanups, n) {
  const body = h('div.lab-body')
  const foot = b.foot ? h('div.lab-foot', { html: rich(b.foot) }) : null
  const el = h('div.lab.reveal', { style: { '--c': b.color || ch.color }, id: 'lab-' + b.id },
    h('div.lab-head', h('span.tag', `LAB ${String(n).padStart(2, '0')}`), h('h3', { html: rich(b.title) }), h('div.dots', h('i'), h('i'), h('i'))),
    body, foot)
  const fn = LABS[b.id]
  if (fn) {
    // Skeleton Screen → 画面に近づいたら Canvas を組み立ててフェードイン
    const sk = skeletonLab()
    body.append(sk)
    onVisible(el, () => {
      setTimeout(() => {
        sk.remove()
        try {
          const c = fn(body, { ch, color: b.color || ch.color, opts: b.opts || {} }); if (c) cleanups.push(c)
          $$('.lab-hint', body).forEach(x => { if (x.innerHTML.includes('$')) x.innerHTML = rich(x.innerHTML) })
          body.classList.add('lab-ready')
        } catch (e) { console.error('lab error', b.id, e); body.append(h('p', 'ラボの読み込みに失敗しました')) }
      }, reduced ? 0 : 380)
    }, { rootMargin: '120px 0px' })
  } else body.append(h('p', `(lab ${b.id} not found)`))
  return el
}

function quiz(b, ch) {
  const expl = h('div.expl', h('div.face', { html: avatar('S', 'happy') }), h('div.bubble', { html: rich(b.explain) }))
  const keys = 'ABCDEF'
  const opts = b.options.map((o, i) => h('button.opt', { type: 'button' }, h('span.k', keys[i]), h('span', { html: rich(o) })))
  opts.forEach((btn, i) => btn.addEventListener('click', (e) => {
    const ok = i === b.answer
    btn.classList.add(ok ? 'right' : 'wrong')
    if (ok) {
      opts.forEach(o => (o.disabled = true))
      expl.classList.add('show')
      confetti(e.clientX, e.clientY)
      toast('せいかい！ 🎉')
      store.mark(ch.slug, 'q-' + b.q.slice(0, 12))
    } else {
      btn.disabled = true
      toast('おしい… もう一回！', 'ng')
    }
  }))
  return h('div.quiz.reveal', h('div.q-no', 'CHECK QUIZ'), h('div.q', { html: rich(b.q) }), h('div.opts', opts), expl)
}

function exer(b) {
  return h('div.exer.reveal',
    h('div.exer-head', h('span.tag', 'EXERCISE'), h('span', { html: rich(b.title) })),
    h('div.exer-q', { html: rich(b.q) }),
    h('div.exer-steps',
      b.hint ? h('details', h('summary', '💡 ヒントを見る'), h('div', { html: rich(b.hint) })) : null,
      h('details', h('summary', '📝 解答（ステップごと）'), h('div', b.steps.map((s, i) => h('div.step', h('span.sn', i + 1), h('div', { html: rich(s) })))))))
}

function flow(b) {
  const el = h('div.flow.reveal')
  b.nodes.forEach((n, i) => {
    if (i) el.append(h('div.arrow', { html: '<svg viewBox="0 0 40 20"><path d="M2 10 H34" stroke="#2A2540" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M28 3 L36 10 L28 17" stroke="#2A2540" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>' }))
    el.append(h('div.node', { style: n.bg ? { background: n.bg } : {} }, n.em && h('span.em', n.em), h('span', { html: rich(n.t) }), n.s && h('small', { html: rich(n.s) })))
  })
  onVisible(el, () => {
    if (reduced || !window.gsap) return
    gsap.from($$('.node', el), { y: 30, scale: .8, opacity: 0, duration: .6, stagger: .15, ease: 'back.out(2)' })
    gsap.from($$('.arrow', el), { scaleX: 0, opacity: 0, duration: .4, stagger: .15, delay: .2 })
  })
  return el
}

function kinetic(b, cleanups) {
  const line = h('p.kinetic-line')
  b.words.forEach((w, i) => {
    const [txt, pop] = Array.isArray(w) ? w : [w, '']
    line.append(h('span.w' + (pop ? '.' + pop : ''), txt))
  })
  const el = h('div.kinetic', line, b.sub && h('div.kinetic-sub', b.sub))
  const ws = $$('.w', line)
  const on = () => {
    const r = el.getBoundingClientRect()
    const p = Math.max(0, Math.min(1, (innerHeight * .85 - r.top) / (innerHeight * .6)))
    const k = Math.round(p * ws.length)
    ws.forEach((w, i) => w.classList.toggle('on', i < k))
  }
  addEventListener('scroll', on, { passive: true }); setTimeout(on, 50)
  cleanups.push(() => removeEventListener('scroll', on))
  return el
}
