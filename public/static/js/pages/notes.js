import { h, $$, tex, rich, onVisible, reduced, splitChars } from '../lib/ui.js'

export function renderNotes(root, chapters) {
  const title = h('h1', '公式ノート')
  const input = h('input', { type: 'search', placeholder: 'キーワードで絞りこみ（例：ベイズ、分散、F値）', 'aria-label': '公式を検索' })
  const grid = h('div.notes-grid')
  const all = []
  chapters.forEach(ch => (ch.notes || []).forEach(n => {
    const el = h('article.note.reveal', { style: { borderTop: `8px solid ${ch.color}` } },
      h('div.from', `第${ch.no}回 · ${ch.title}`), h('h3', n.h), h('div.f', { html: tex(n.f, true) }), n.p ? h('p', { html: rich(n.p) }) : null)
    el.dataset.k = (n.h + ch.title + (n.p || '') + n.f).toLowerCase()
    all.push(el); grid.append(el)
  }))
  const empty = h('p', { style: { display: 'none', fontWeight: 900 } }, '見つかりませんでした…')
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase(); let n = 0
    all.forEach(el => { const on = !q || el.dataset.k.includes(q); el.style.display = on ? '' : 'none'; if (on) n++ })
    empty.style.display = n ? 'none' : ''
  })
  root.append(h('section.ch-hero.wrap', { style: { '--c': '#FFD66B' } },
    h('div.bignum', { 'aria-hidden': 'true' }, 'Σ'),
    h('div.crumb', h('a', { href: '/', 'data-link': '' }, 'HOME'), h('span', '／'), h('span', 'FORMULA NOTES')),
    title, h('p.sub', `全 ${all.length} 本。テスト前の総ざらいに。`)),
    h('section.wrap', { style: { paddingBottom: '80px' } }, h('div.search', h('span', '🔍'), input), empty, grid))
  const chars = splitChars(title)
  if (!reduced && window.gsap) gsap.from(chars, { yPercent: 110, opacity: 0, rotate: () => gsap.utils.random(-20, 20), duration: .8, stagger: .05, ease: 'back.out(2)' })
  $$('.reveal', root).forEach(el => onVisible(el, t => t.classList.add('in'), { threshold: .05 }))
  return () => {}
}
