// グローバル検索：Auto Complete（⌘K / ヘッダー）
import { h, $, rich, tex } from './ui.js'
import { autocomplete, score, highlight, openSheet, closeSheet } from './patterns.js'
import { GLOSSARY } from '../chapters/glossary.js'
import { glossarySheet } from './glossary-ui.js'

let INDEX = null
const RECENT_KEY = 'marutto-ml-recent-v1'
const getRecent = () => { try { return JSON.parse(localStorage.getItem(RECENT_KEY)) || [] } catch { return [] } }
const pushRecent = (it) => { const r = getRecent().filter(x => x.key !== it.key); r.unshift({ key: it.key, label: it.label, type: it.type, href: it.href, term: it.term }); localStorage.setItem(RECENT_KEY, JSON.stringify(r.slice(0, 5))) }

function build(chapters) {
  const idx = []
  GLOSSARY.forEach(([term, yomi, desc, slug]) => {
    const ch = chapters.find(c => c.slug === slug)
    idx.push({ type: 'term', key: 't:' + term, label: term, alt: yomi, sub: desc.replace(/\$[^$]*\$/g, '…').slice(0, 44), color: ch?.color, chNo: ch?.no, term })
  })
  chapters.forEach(ch => {
    idx.push({ type: 'chapter', key: 'c:' + ch.slug, label: `第${ch.no}回 ${ch.title}`, alt: ch.en + ' ' + ch.lead, sub: ch.sub, href: '/ch/' + ch.slug, color: ch.color, chNo: ch.no })
    ch.sections.forEach(sec => {
      idx.push({ type: 'section', key: 's:' + ch.slug + sec.id, label: sec.title, alt: ch.title, sub: `第${ch.no}回 ${ch.title}`, href: `/ch/${ch.slug}#${sec.id}`, color: ch.color, chNo: ch.no })
      sec.blocks.forEach(b => {
        if (b.t === 'lab') idx.push({ type: 'lab', key: 'l:' + ch.slug + b.id + (b.opts?.mode || ''), label: b.title.replace(/\$[^$]*\$/g, ''), alt: sec.title, sub: `第${ch.no}回 · ${sec.title}`, href: `/ch/${ch.slug}#lab-${b.id}`, color: ch.color, chNo: ch.no })
        if (b.t === 'exer') idx.push({ type: 'exer', key: 'e:' + ch.slug + b.title, label: b.title, alt: sec.title, sub: `第${ch.no}回 · ${sec.title}`, href: `/ch/${ch.slug}#${sec.id}`, color: ch.color, chNo: ch.no })
      })
    })
    ;(ch.notes || []).forEach(n => idx.push({ type: 'formula', key: 'f:' + ch.slug + n.h, label: n.h, alt: ch.title, sub: `第${ch.no}回`, f: n.f, href: '/notes?q=' + encodeURIComponent(n.h), color: ch.color, chNo: ch.no }))
  })
  return idx
}
const TYPE = { term: ['用語', '📖'], chapter: ['講義', '📚'], section: ['セクション', '📍'], lab: ['ラボ', '🧪'], exer: ['演習', '📝'], formula: ['公式', '∑'] }
const SUGGEST = ['過学習', 'ベイズの定理', '最尤推定', 'ガウス分布', '正則化', 'ROC曲線']

export function initSearch(chapters, go) {
  INDEX = build(chapters)
  const input = h('input.search-input', { type: 'search', placeholder: '用語・公式・ラボを検索…', 'aria-label': 'サイト内検索' })
  const kbd = h('kbd.search-kbd', navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl K')
  const hint = h('div.ac-foot', { html: '<span><kbd>↑</kbd><kbd>↓</kbd> 移動</span><span><kbd>Enter</kbd> 開く</span><span><kbd>Tab</kbd> 補完</span><span><kbd>Esc</kbd> 閉じる</span>' })
  const ghost = h('span.search-ghost', { 'aria-hidden': 'true' })
  const panel = h('div.search-panel', { role: 'dialog', 'aria-label': '検索' })
  const wrap = h('div.search-box', h('span.search-ic', { html: '<svg width="18" height="18" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="#2A2540" stroke-width="2.8"/><path d="M15.5 15.5 L21 21" stroke="#2A2540" stroke-width="2.8" stroke-linecap="round"/></svg>' }), h('div.search-field', ghost, input), kbd)
  const overlay = h('div.search-overlay', { onclick: (e) => { if (e.target === overlay) close() } }, panel)

  const source = (q) => {
    if (!q) {
      const rec = getRecent()
      const out = []
      if (rec.length) { out.push({ group: '最近の検索' }); rec.forEach(r => out.push({ ...INDEX.find(x => x.key === r.key) || r, recent: true })) }
      out.push({ group: 'よく調べられる用語' })
      SUGGEST.forEach(s => { const it = INDEX.find(x => x.key === 't:' + s); if (it) out.push(it) })
      ghost.textContent = ''
      return out
    }
    const scored = INDEX.map(it => ({ it, s: score(q, it.label, it.alt) + (it.type === 'term' ? 6 : it.type === 'chapter' ? 4 : 0) })).filter(x => x.s > 0).sort((a, b) => b.s - a.s).slice(0, 12)
    // inline ghost completion with the top prefix match
    const top = scored.find(x => x.it.label.toLowerCase().startsWith(q.toLowerCase()))
    ghost.innerHTML = top ? `<span style="opacity:0">${q.replace(/</g, '&lt;')}</span>${top.it.label.slice(q.length).replace(/</g, '&lt;')}` : ''
    const groups = {}
    scored.forEach(({ it }) => { (groups[it.type] = groups[it.type] || []).push({ ...it, complete: it.label }) })
    const out = []
    ;['term', 'chapter', 'section', 'lab', 'formula', 'exer'].forEach(t => { if (groups[t]) { out.push({ group: TYPE[t][0] }); out.push(...groups[t]) } })
    return out
  }
  const render = (it, q) => `
    <span class="ac-ic" style="background:${it.color || '#fff'}">${it.recent ? '🕘' : TYPE[it.type]?.[1] || '•'}</span>
    <span class="ac-main"><span class="ac-label">${highlight(it.label, q)}</span><span class="ac-sub">${it.f ? tex(it.f) : (it.sub || '')}</span></span>
    <span class="ac-type">${TYPE[it.type]?.[0] || ''}</span><span class="ac-go">↵</span>`
  const onPick = (it) => {
    pushRecent(it)
    close()
    if (it.type === 'term') glossarySheet(it.term, chapters, go)
    else go(it.href)
  }
  const { list } = autocomplete(input, { source, render, onPick, empty: (q) => `「${q.replace(/</g, '&lt;')}」は見つかりませんでした。<br><small>ひらがな（例：かがくしゅう）や英語（overfitting）でも探せます</small>` })
  panel.append(wrap, list, hint)
  input.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })

  function open() {
    if (!overlay.isConnected) document.body.append(overlay)
    requestAnimationFrame(() => overlay.classList.add('in'))
    document.documentElement.classList.add('search-open')
    input.value = ''; input.focus(); input.dispatchEvent(new Event('input'))
  }
  function close() { overlay.classList.remove('in'); document.documentElement.classList.remove('search-open'); setTimeout(() => overlay.remove(), 300) }
  addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); overlay.classList.contains('in') ? close() : open() }
    else if (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName)) { e.preventDefault(); open() }
  })
  // header trigger button
  const trigger = h('button.search-trigger', { type: 'button', 'aria-label': '検索を開く', onclick: open },
    h('span', { html: '<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" stroke-width="2.8"/><path d="M15.5 15.5 L21 21" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>' }),
    h('span.st-label', '検索'), h('kbd', kbd.textContent))
  return { trigger, open }
}
