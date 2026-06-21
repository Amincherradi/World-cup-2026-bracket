import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Dev-only: run the Vercel serverless functions in api/ during `npm run dev`.
// Plain Vite would otherwise serve api/live.js as a static module (you'd see its
// source instead of its JSON). This intercepts /api/* , loads the function, and
// gives the Node res object the Vercel-style .status()/.json() helpers it expects.
// In production, Vercel runs these functions natively and this plugin is unused.
function vercelApiDev(env) {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      // football-data token lives in .env without a VITE_ prefix, so it isn't on
      // process.env by default — make it available to the handler.
      if (env.FOOTBALL_DATA_KEY && !process.env.FOOTBALL_DATA_KEY) {
        process.env.FOOTBALL_DATA_KEY = env.FOOTBALL_DATA_KEY
      }
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const name = req.url.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '')
        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          // Adapt Node's bare res to the subset of the Vercel API the handler uses.
          res.status = (code) => { res.statusCode = code; return res }
          res.json = (obj) => {
            if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(obj))
            return res
          }
          await mod.default(req, res)
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: String(err?.message || err) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), vercelApiDev(env)],
    server: {
      port: 4200,
      strictPort: true,
    },
  }
})
