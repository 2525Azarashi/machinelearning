import { Hono } from 'hono'
// SPA シェルは public/index.html が唯一の正本（Vercel では静的配信、Cloudflare/ローカルでは Hono が返す）
import shell from '../public/index.html?raw'

const app = new Hono()

app.get('*', (c) => c.html(shell))

export default app
