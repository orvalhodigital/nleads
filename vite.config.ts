import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/api'),
        }
      }
    },
    plugins: [
      react(),
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
