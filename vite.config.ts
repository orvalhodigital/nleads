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
    esbuild: isProd ? { drop: ['console', 'debugger'] } : {},
    build: {
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            // framer-motion removido: auto-chunk com páginas públicas (lazy)
            'vendor-ui': ['lucide-react', '@hello-pangea/dnd', '@base-ui/react'],
            'vendor-charts': ['recharts'],
            // exceljs removido: auto-chunk com InventoryImportModal/LeadImportModal (lazy)
            'vendor-utils': ['date-fns', 'zod', '@supabase/supabase-js'],
          }
        }
      }
    }
  };
});
