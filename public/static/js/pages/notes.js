import { h, $, $$, tex, rich, onVisible, reduced, splitChars, confetti } from '../lib/ui.js'
import { swipeable, toast, autocomplete, score, highlight, openSheet } from '../lib/patterns.js'
import { saved } from '../lib/saved.js'

export function renderNotes(root, chapters) {
  const cleanups = []
  const title = h('h1', '公式ノート')
  const all = []
  chapters.forEach(ch => (ch.notes || []).forEach(n => all.push({ ch, n, key: 'f:' + ch.slug + ':' + n.h })))

  // ───── filters ─────
  let filter = 'all', chFilter = 0, q = new URLSearchParams(location.search).get('q') || ''
  const tabs = h('div.note-tabs', { role: 'tablist' })
  const mkTab = (v, label) => { const b = h('button.note-tab', { type: 'button', role: 'tab', onclick: () => { filter = v; apply() } }, label); b.dataset.v = v; return b }
  const tabAll = mkTab('all', 'すべて'), tabStar = mkTab('star', '★ 保存'), tabTodo = mkTab('todo', 'まだ'), tabDone = mkTab('done', '✓ 覚えた')
  tabs.append(tabAll, tabStar, tabTodo, tabDone)
  const chips = h('div.note-chips', h('button.chip.on', { type: 'button', onclick: (e) => setCh(0, e.currentTarget) }, '全章'), chapters.map(c => h('button.chip', { type: 'button', style: { '--c': c.color }, onclick: (e) => setCh(c.no, e.currentTarget) }, `第${c.no}回`)))
  const setCh = (no, btn) => { chFilter = no; $$('.chip', chips).forEach(x => x.classList.toggle('on', x === btn)); apply() }

  // ───── progress ─────
  const prog = h('div.note-prog', h('div.np-ring', { html: '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="27" fill="none" stroke="#FFEFDC" stroke-width="8"/><circle class="np-arc" cx="32" cy="32" r="27" fill="none" stroke="#6FD6B8" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1" transform="rotate(-90 32 32)"/></svg>' }, h('b.np-num', '0%')), h('div', h('b', '暗記の進みぐあい'), h('div.np-sub', '')))

  // ───── search with autocomplete ─────
  const input = h('input', { type: 'search', placeholder: '公式を探す（例：ベイズ、分散、F値）', 'aria-label': '公式を検索', value: q })
  const { list } = autocomplete(input, {
    source: (s) => {
      if (!s) return []
      return all.map(x => ({ x, s: score(s, x.n.h, x.ch.title + ' ' + (x.n.p || '')) })).filter(o => o.s > 0).sort((a, b) => b.s - a.s).slice(0, 6).map(o => ({ ...o.x, complete: o.x.n.h }))
    },
    render: (it, s) => `<span class="ac-ic" style="background:${it.ch.color}">∑</span><span class="ac-main"><span class="ac-label">${highlight(it.n.h, s)}</span><span class="ac-sub">${tex(it.n.f)}</span></span><span class="ac-type">第${it.ch.no}回</span>`,
    onPick: (it) => { input.value = it.n.h; q = it.n.h; list.innerHTML = ''; input.blur(); apply(); setTimeout(() => { const el = all.find(x => x.key === it.key)?.el; el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.classList.add('flash'); setTimeout(() => el?.classList.remove('flash'), 1400) }, 80) },
    empty: () => '一致する公式はありません',
  })
  input.addEventListener('input', () => { q = input.value.trim(); apply() })
  input.addEventListener('blur', () => setTimeout(() => (list.innerHTML = ''), 150))
  const searchBox = h('div.search.ac-host', h('span', '🔍'), input, list)

  // ───── cards ─────
  const grid = h('div.notes-grid')
  all.forEach(item => {
    const { ch, n, key } = item
    const card = h('article.note.reveal', { style: { '--c': ch.color }, tabindex: '0' },
      h('div.note-top', h('div.from', `第${ch.no}回 · ${ch.title}`), h('div.note-badges', h('span.nb-star', '★'), h('span.nb-done', '✓'))),
      h('h3', n.h), h('div.f', { html: tex(n.f, true) }), n.p ? h('p', { html: rich(n.p) }) : null,
      h('div.note-hint', '← 覚えた　｜　保存 →'))
    item.el = card
    grid.append(card)
    const paint = () => { card.classList.toggle('starred', saved.has(key)); card.classList.toggle('learned', saved.learned(key)) }
    paint()
    const star = () => {
      const v = saved.toggle(key, { kind: 'formula', label: n.h }); paint()
      toast(v ? `「${n.h}」を保存しました` : `保存を外しました`, { kind: v ? 'star' : 'info', icon: v ? '★' : '☆', action: { label: '元に戻す', fn: () => { saved.toggle(key); paint(); apply() } } })
      apply()
    }
    const learn = () => {
      const v = !saved.learned(key); saved.setLearned(key, v, { kind: 'formula', label: n.h }); paint()
      if (v) { const r = card.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + 30, 18) }
      toast(v ? `「${n.h}」覚えた！` : '「まだ」に戻しました', { kind: v ? 'ok' : 'info', action: { label: '元に戻す', fn: () => { saved.setLearned(key, !v); paint(); apply() } } })
      apply()
    }
    swipeable(card, {
      right: { label: '保存', icon: '★', color: '#FFD66B', fn: star },
      left: { label: '覚えた', icon: '✓', color: '#6FD6B8', fn: learn },
    })
    // desktop/keyboard: tap → bottom sheet with actions; S / L shortcuts
    card.addEventListener('click', () => openFormula(item, star, learn))
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter') openFormula(item, star, learn); if (e.key.toLowerCase() === 's') star(); if (e.key.toLowerCase() === 'l') learn() })
  })
  const empty = h('div.notes-empty', { style: { display: 'none' } }, h('div', { html: '🫥' }), h('b', 'ここにはまだ何もありません'), h('p', 'カードを右にスワイプすると保存、左にスワイプすると「覚えた」になります。'))

  function apply() {
    const nq = q.toLowerCase(); let n = 0
    all.forEach(({ ch, n: note, key, el }) => {
      let on = (!chFilter || ch.no === chFilter)
      if (filter === 'star') on = on && saved.has(key)
      if (filter === 'done') on = on && saved.learned(key)
      if (filter === 'todo') on = on && !saved.learned(key)
      if (nq) on = on && score(nq, note.h, ch.title + ' ' + (note.p || '') + note.f) > 0
      el.style.display = on ? '' : 'none'; if (on) { n++; el.classList.add('in') }
    })
    empty.style.display = n ? 'none' : ''
    $$('.note-tab', tabs).forEach(t => { const on = t.dataset.v === filter; t.classList.toggle('on', on); t.setAttribute('aria-selected', on) })
    const c = saved.count(), learned = all.filter(x => saved.learned(x.key)).length, starred = all.filter(x => saved.has(x.key)).length
    tabStar.textContent = `★ 保存 ${starred}`; tabDone.textContent = `✓ 覚えた ${learned}`; tabTodo.textContent = `まだ ${all.length - learned}`
    const p = learned / all.length
    $('.np-arc', prog).style.strokeDashoffset = 1 - p
    $('.np-num', prog).textContent = Math.round(p * 100) + '%'
    $('.np-sub', prog).textContent = `${all.length} 本中 ${learned} 本を覚えた`
  }

  root.append(h('section.ch-hero.wrap', { style: { '--c': '#FFD66B' } },
    h('div.bignum', { 'aria-hidden': 'true' }, 'Σ'),
    h('div.crumb', h('a', { href: '/', 'data-link': '' }, 'HOME'), h('span', '／'), h('span', 'FORMULA NOTES')),
    title, h('p.sub', `全 ${all.length} 本。スワイプで仕分ける、じぶん専用の公式カード。`)),
    h('section.wrap', { style: { paddingBottom: '80px' } },
      h('div.notes-toolbar', searchBox, prog),
      h('div.notes-filter', tabs, chips),
      h('div.swipe-tip', h('span.st-hand', '👆'), h('span', { html: '<b>スワイプ</b>で仕分け：右 → <b class="c-butter">★ 保存</b>、左 → <b class="c-mint">✓ 覚えた</b>。PC はクリックか <kbd>S</kbd>/<kbd>L</kbd> キー。' })),
      empty, grid))
  apply()
  const chars = splitChars(title)
  if (!reduced && window.gsap) gsap.from(chars, { yPercent: 110, opacity: 0, rotate: () => gsap.utils.random(-20, 20), duration: .8, stagger: .05, ease: 'back.out(2)' })
  $$('.reveal', root).forEach(el => onVisible(el, t => t.classList.add('in'), { threshold: .05 }))
  // first-visit swipe demo on the first card
  if (!reduced && !localStorage.getItem('marutto-swipe-demo')) {
    setTimeout(() => { const first = $('.note .swipe-inner', grid); if (!first) return; first.parentElement.classList.add('demo'); setTimeout(() => first.parentElement.classList.remove('demo'), 2400); localStorage.setItem('marutto-swipe-demo', '1') }, 1200)
  }
  cleanups.push(saved.on(apply))
  return () => cleanups.forEach(f => f())
}

function openFormula({ ch, n, key }, star, learn) {
  const body = h('div.gl-body',
    h('div.gl-f', { style: { fontSize: '1.25em' }, html: tex(n.f, true) }),
    n.p ? h('div.gl-talk', h('div.face', { html: '<span style="font-size:26px;display:grid;place-items:center;height:100%">∑</span>' }), h('div.bubble', { html: rich(n.p) })) : null,
    h('div.gl-actions',
      h('button.btn.sm.butter', { type: 'button', onclick: () => { star(); refresh() } }, saved.has(key) ? '★ 保存済み' : '☆ 保存'),
      h('button.btn.sm.mint', { type: 'button', onclick: () => { learn(); refresh() } }, saved.learned(key) ? '✓ 覚えた' : '覚えた！'),
      h('a.btn.sm.ghost', { href: '/ch/' + ch.slug, 'data-link': '' }, `第${ch.no}回へ`, h('span.arr', '→'))))
  const refresh = () => { const [a, b] = $$('button', body); a.textContent = saved.has(key) ? '★ 保存済み' : '☆ 保存'; b.textContent = saved.learned(key) ? '✓ 覚えた' : '覚えた！' }
  openSheet({ title: n.h, eyebrow: `FORMULA · 第${ch.no}回 ${ch.title}`, body, color: ch.color })
}
