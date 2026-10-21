import { h, $$, rich, tex, avatar } from './ui.js'
import { openSheet, closeSheet, toast } from './patterns.js'
import { GLOSSARY, GLOSS_MAP } from '../chapters/glossary.js'
import { saved } from './saved.js'

// 用語の Bottom Sheet
export function glossarySheet(term, chapters, go) {
  const g = GLOSS_MAP.get(term); if (!g) return
  const [name, yomi, desc, slug, secId, f] = g
  const ch = chapters.find(c => c.slug === slug)
  const sec = ch?.sections.find(s => s.id === secId)
  const en = yomi.split(' ').filter(w => /^[a-z]/i.test(w)).join(' / ')
  const kana = yomi.split(' ').find(w => /^[ぁ-ん]/.test(w)) || ''
  // related terms: same section, then same chapter
  const rel = GLOSSARY.filter(x => x[0] !== name && x[3] === slug).sort((a, b) => (b[4] === secId) - (a[4] === secId)).slice(0, 6)
  const key = 'g:' + name
  const isSaved = () => saved.has(key)
  const star = h('button.btn.sm' + (isSaved() ? '.butter' : '.ghost'), { type: 'button', 'aria-pressed': String(isSaved()) }, isSaved() ? '★ 保存済み' : '☆ 単語帳に保存')
  star.addEventListener('click', () => {
    const now = saved.toggle(key, { kind: 'term', label: name })
    star.className = 'btn sm ' + (now ? 'butter' : 'ghost'); star.textContent = now ? '★ 保存済み' : '☆ 単語帳に保存'; star.setAttribute('aria-pressed', now)
    toast(now ? `「${name}」を単語帳に保存` : `「${name}」を単語帳から外した`, { kind: now ? 'star' : 'info', action: { label: '元に戻す', fn: () => { saved.toggle(key, { kind: 'term', label: name }); star.click(); star.click() } } })
  })
  const body = h('div.gl-body',
    h('div.gl-kana', kana, en ? h('span', ' · ' + en) : null),
    h('div.gl-talk', h('div.face', { html: avatar('S', 'happy') }), h('div.bubble', { html: rich(desc) })),
    f ? h('div.gl-f', { html: tex(f, true) }) : null,
    h('div.gl-actions',
      sec ? h('a.btn.sm', { href: `/ch/${slug}#${secId}`, 'data-link': '', onclick: () => closeSheet() }, `📍 第${ch.no}回「${sec.title}」へ`, h('span.arr', '→')) : null,
      star),
    rel.length ? h('div.gl-rel', h('div.gl-rel-t', '関連する用語'), h('div.gl-chips', rel.map(r => h('button.chip', { type: 'button', onclick: () => glossarySheet(r[0], chapters, go) }, r[0])))) : null)
  openSheet({ title: name, eyebrow: ch ? `GLOSSARY · 第${ch.no}回 ${ch.title}` : 'GLOSSARY', body, color: ch?.color })
}

// 本文中の太字を用語リンク化
export function linkTerms(root, chapters, go) {
  $$('.txt b, .point li b, .cmp li b, .kinetic-sub b', root).forEach(b => {
    const t = b.textContent.trim()
    const hit = GLOSS_MAP.has(t) ? t : [...GLOSS_MAP.keys()].find(k => t === k + 'の' || t.replace(/[（(].*$/, '') === k)
    if (!hit || b.closest('.term')) return
    const btn = h('button.term', { type: 'button', 'aria-haspopup': 'dialog', title: `「${hit}」の解説を開く` })
    b.replaceWith(btn); btn.append(b)
    btn.addEventListener('click', () => glossarySheet(hit, chapters, go))
  })
}
