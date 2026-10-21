import { h, $, $$, mascot, reduced, magnetic } from './lib/ui.js'
import { CHAPTERS } from './chapters/index.js'
import { renderHome } from './pages/home.js'
import { renderChapter } from './pages/chapter.js'
import { renderNotes } from './pages/notes.js'
import { skeletonPage, pullToRefresh, toast, closeSheet } from './lib/patterns.js'
import { initSearch } from './lib/search.js'
import { linkTerms } from './lib/glossary-ui.js'

const app = $('#app')
let cleanup = []

// ───────── header / footer ─────────
let search
function header() {
  search = initSearch(CHAPTERS, (href) => go(href))
  const hd = $('#site-header')
  hd.innerHTML = ''
  const links = h('ul.nav-links#nav-links',
    h('li', h('a', { href: '/', 'data-link': '' }, 'ホーム')),
    h('li', h('a', { href: '/#chapters', 'data-link': '', 'data-hash': 'chapters' }, '講義一覧')),
    h('li', h('a', { href: '/notes', 'data-link': '' }, '公式ノート')),
  )
  const burger = h('button.nav-burger', { 'aria-label': 'メニュー', 'aria-controls': 'nav-links', 'aria-expanded': 'false', onclick: () => {
    const o = links.classList.toggle('open'); burger.setAttribute('aria-expanded', o)
  } }, h('span', { html: '<svg width="20" height="14" viewBox="0 0 20 14"><path d="M1 1h18M1 7h18M1 13h18" stroke="#2A2540" stroke-width="2.6" stroke-linecap="round"/></svg>' }))
  hd.append(h('nav.wrap.nav', { 'aria-label': 'メインナビゲーション' },
    h('a.brand', { href: '/', 'data-link': '' }, h('span', { html: mascot() }), h('span', 'まるっと機械学習', h('small', 'MARUTTO · ML I'))),
    h('div.nav-right', search.trigger, burger), links))
}
function footer() {
  $('#site-footer').innerHTML = ''
  $('#site-footer').append(h('div.wrap.foot',
    h('div', h('div.foot-big', { html: 'Learn by<br><span>touching.</span>' })),
    h('div', h('small', '機械学習 I — Part I 基礎'), h('small', '講義プリントが届くたびに章が増えていきます。'), h('small', '講義資料 © OkadomeLab / このサイトは学習用の非公式ノートです。'))))
}

// ───────── router ─────────
function route(path) {
  cleanup.forEach(f => { try { f() } catch {} }); cleanup = []
  if (window.ScrollTrigger) ScrollTrigger.getAll().forEach(t => t.kill())
  app.innerHTML = ''
  const m = path.match(/^\/ch\/([\w-]+)/)
  let title = 'まるっと機械学習 — Marutto ML'
  if (m) {
    const ch = CHAPTERS.find(c => c.slug === m[1])
    if (ch) { cleanup.push(renderChapter(app, ch, CHAPTERS)); title = `${ch.no}. ${ch.title} — まるっと機械学習` }
    else cleanup.push(renderHome(app, CHAPTERS))
  } else if (path.startsWith('/notes')) { cleanup.push(renderNotes(app, CHAPTERS)); title = '公式ノート — まるっと機械学習' }
  else cleanup.push(renderHome(app, CHAPTERS))
  document.title = title
  linkTerms(app, CHAPTERS, (href) => go(href))
  $$('.nav-links a').forEach(a => a.classList.toggle('active', a.getAttribute('href') === path && !a.dataset.hash))
  $('#nav-links')?.classList.remove('open')
  bindHover()
}

const wipe = $('#wipe')
async function go(href, push = true) {
  const url = new URL(href, location.origin)
  const same = url.pathname === location.pathname && url.search === location.search
  if (push) history.pushState({}, '', url.pathname + url.search + url.hash)
  closeSheet(true)
  if (same && url.hash) { document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }); return }
  const anim = !reduced && window.gsap
  if (anim) await gsap.to($$('i', wipe), { scaleX: 1, transformOrigin: 'left', duration: .38, stagger: .05, ease: 'power3.inOut' })
  // Skeleton Screen: 重い章ページ（KaTeX + Canvas）を組み立てる間の骨組み
  cleanup.forEach(f => { try { f() } catch {} }); cleanup = []
  app.innerHTML = ''
  app.append(skeletonPage(url.pathname === '/' ? 'home' : 'chapter'))
  window.scrollTo(0, 0)
  if (anim) gsap.to($$('i', wipe), { scaleX: 0, transformOrigin: 'right', duration: .45, stagger: .05, ease: 'power3.inOut' })
  await new Promise(r => setTimeout(r, anim ? 420 : 0))
  await new Promise(r => requestAnimationFrame(() => r()))
  route(url.pathname)
  if (anim) gsap.fromTo(app, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, ease: 'power3.out', clearProps: 'all' })
  if (url.hash) setTimeout(() => document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'smooth' }), 350)
  app.focus({ preventScroll: true })
}
window.__go = go

document.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-link]')
  if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return
  e.preventDefault()
  go(a.getAttribute('href'))
})
addEventListener('popstate', () => go(location.pathname + location.hash, false))

// ───────── cursor ─────────
const cur = $('#cursor')
let cx = 0, cy = 0, tx = 0, ty = 0
if (!matchMedia('(hover: none)').matches && !reduced) {
  addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; cur.classList.add('on') })
  ;(function loop() { cx += (tx - cx) * .22; cy += (ty - cy) * .22; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop) })()
}
function bindHover() {
  $$('a, button, input[type=range], .lab-canvas, summary').forEach(el => {
    if (el.__hov) return; el.__hov = 1
    el.addEventListener('pointerenter', () => cur.classList.add('big'))
    el.addEventListener('pointerleave', () => cur.classList.remove('big'))
  })
  $$('.btn').forEach(b => { if (!b.__mag) { b.__mag = 1; magnetic(b, .25) } })
}
new MutationObserver(() => bindHover()).observe(app, { childList: true, subtree: true })

// ───────── header hide on scroll + progress ─────────
let lastY = 0
const prog = $('#scroll-progress')
addEventListener('scroll', () => {
  const y = scrollY
  $('#site-header').classList.toggle('hide', y > lastY && y > 300)
  lastY = y
  const max = document.documentElement.scrollHeight - innerHeight
  prog.style.transform = `scaleX(${max > 0 ? y / max : 0})`
}, { passive: true })

// ───────── loader: data points → regression line ─────────
function loader() {
  const svg = $('#loader-svg')
  const pts = Array.from({ length: 9 }, (_, i) => [20 + i * 32, 92 - i * 8 + (Math.sin(i * 2.3) * 14)])
  svg.innerHTML = `<path id="ld-line" d="M10 100 L290 22" stroke="#FF8E6E" stroke-width="6" stroke-linecap="round" fill="none" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>` +
    pts.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="8" fill="${['#6FD6B8', '#B9A7FF', '#FFD66B', '#8CC8FF'][i % 4]}" stroke="#2A2540" stroke-width="3" style="transform-origin:${x}px ${y}px;transform:scale(0)"/>`).join('')
  const done = () => { $('#loader').classList.add('done'); document.dispatchEvent(new Event('loader:done')) }
  if (reduced || !window.gsap) { done(); return }
  const tl = gsap.timeline({ onComplete: done })
  tl.to('#loader-svg circle', { scale: 1, duration: .45, stagger: .06, ease: 'back.out(3)' })
    .to('#ld-line', { strokeDashoffset: 0, duration: .6, ease: 'power2.inOut' }, '-=.1')
    .to('.loader-word', { letterSpacing: '.6em', opacity: 0, duration: .4 }, '+=.15')
}

header(); footer()
window.__loaderDone = false
document.addEventListener('loader:done', () => { window.__loaderDone = true }, { once: true })
route(location.pathname)
if (location.hash) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 600)
if (document.fonts?.ready) document.fonts.ready.then(loader); else loader()
setTimeout(() => { if (!$('#loader').classList.contains('done')) { $('#loader').classList.add('done'); document.dispatchEvent(new Event('loader:done')) } }, 4000)

// ───────── Pull to Refresh（タッチ端末のみ） ─────────
pullToRefresh(async () => {
  if (location.pathname === '/') { document.dispatchEvent(new Event('ptr:refresh')); document.getElementById('daily')?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }
  else { route(location.pathname); window.scrollTo(0, 0) }
  toast(location.pathname === '/' ? '「今日の1問」を入れ替えました' : 'ラボをリセットしました', { kind: 'info', icon: '↻' })
})
