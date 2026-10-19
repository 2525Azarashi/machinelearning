import { Hono } from 'hono'

const app = new Hono()

const shell = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>まるっと機械学習 — Marutto ML</title>
<meta name="description" content="機械学習Iを、サカイ先輩とリョウガくんの対話と、さわって動かすラボで直感的に学ぶサイト。">
<meta name="theme-color" content="#FFF7EC">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='34' r='26' fill='%23FF8E6E' stroke='%232A2540' stroke-width='4'/><circle cx='24' cy='30' r='4' fill='%232A2540'/><circle cx='40' cy='30' r='4' fill='%232A2540'/><path d='M25 41 q7 6 14 0' stroke='%232A2540' stroke-width='4' fill='none' stroke-linecap='round'/></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Zen+Maru+Gothic:wght@400;500;700;900&family=Yomogi&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<link rel="stylesheet" href="/static/css/main.css">
</head>
<body>
<div id="loader" aria-hidden="true"><div class="loader-inner"><svg id="loader-svg" viewBox="0 0 300 120"></svg><div class="loader-word">まるっと機械学習</div></div></div>
<div id="cursor" aria-hidden="true"></div>
<div id="wipe" aria-hidden="true"><i></i><i></i><i></i></div>
<div id="scroll-progress" aria-hidden="true"></div>
<header id="site-header"></header>
<main id="app" tabindex="-1"></main>
<footer id="site-footer"></footer>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/ScrollTrigger.min.js"></script>
<script type="module" src="/static/js/app.js"></script>
</body>
</html>`

app.get('*', (c) => c.html(shell))

export default app
