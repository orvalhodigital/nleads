import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);
  const isProd = mode === 'production';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      {
        name: 'dev-api-serverless-router',
        configureServer(server) {
          server.middlewares.use(async (req: any, res: any, next: any) => {
            if (!req.url?.startsWith('/api/')) return next();

            try {
              const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
              const cleanPath = urlObj.pathname.replace(/\/$/, ''); // ex: /api/openai
              const relativeTs = `.${cleanPath}.ts`; // ex: ./api/openai.ts
              const absTsPath = path.resolve(__dirname, relativeTs);

              if (fs.existsSync(absTsPath)) {
                // Parse request body for POST/PUT/PATCH
                let bodyStr = '';
                if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
                  bodyStr = await new Promise<string>((resolve) => {
                    let data = '';
                    req.on('data', (chunk: any) => { data += chunk; });
                    req.on('end', () => resolve(data));
                  });
                  try {
                    req.body = JSON.parse(bodyStr || '{}');
                  } catch {
                    req.body = {};
                  }
                }

                // Attach query params
                const query: Record<string, string> = {};
                urlObj.searchParams.forEach((val, key) => { query[key] = val; });
                req.query = query;

                // Simulate status/json response helpers for Vercel/Express handlers
                res.status = (code: number) => {
                  res.statusCode = code;
                  return res;
                };
                res.json = (data: any) => {
                  if (!res.headersSent) {
                    res.setHeader('Content-Type', 'application/json');
                  }
                  res.end(JSON.stringify(data));
                  return res;
                };

                const module = await server.ssrLoadModule(relativeTs);
                const handler = module.default;
                if (typeof handler === 'function') {
                  await handler(req, res);
                  return;
                }
              }
            } catch (err: any) {
              console.error(`Dev API Error (${req.url}):`, err);
              if (!res.headersSent) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: err?.message || 'Dev API Error' }));
              }
              return;
            }

            next();
          });
        }
      },
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    },
    // `drop: ['console']` apagava os 154 `console.error` e 18 `console.warn` do
    // sistema, zerando a capacidade de diagnóstico em produção. Agora só o log
    // de depuração é removido; erros e avisos continuam chegando ao console.
    esbuild: isProd
      ? { drop: ['debugger'], pure: ['console.log', 'console.debug', 'console.trace'] }
      : {},
    build: {
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // framer-motion e @hello-pangea/dnd removidos: auto-chunk com páginas lazy que os usam
            'vendor-ui': ['lucide-react', '@base-ui/react'],
            'vendor-charts': ['recharts'],
            // exceljs removido: auto-chunk com InventoryImportModal/LeadImportModal (lazy)
            'vendor-utils': ['date-fns', 'zod', '@supabase/supabase-js'],
          }
        }
      }
    }
  };
});
