import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { ServerOptions, PreviewOptions } from 'vite'

// Optional devtools import
let vueDevTools: any;
try {
  // This will be tree-shaken in production
  vueDevTools = require('vite-plugin-vue-devtools').default;
} catch (e) {
  console.warn('vite-plugin-vue-devtools not found, devtools will be disabled');
  vueDevTools = null;
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  
  // Configure proxy
  const proxy: Record<string, string | ProxyOptions> = {
    '/api': {
      target: 'https://www.jisoolove.top',
      changeOrigin: true,
      secure: true,
      configure: (proxy) => {
        proxy.on('error', (err: Error) => {
          console.log('Proxy error:', err);
        });
        proxy.on('proxyReq', (proxyReq: any, req: any) => {
          console.log('Sending request to target:', req.method, req.url);
        });
        proxy.on('proxyRes', (proxyRes: any, req: any) => {
          console.log('Received response from target:', proxyRes.statusCode, req.url);
        });
      }
    }
  };

  // Server configuration
  const server: ServerOptions = {
    port: 3000,
    open: true,
    proxy
  };

  // Preview configuration
  const preview: PreviewOptions = {
    port: 4173,
    open: true
  };
  
  const plugins = [
    vue(),
    ...(vueDevTools ? [vueDevTools()] : []) as any[],
  ];

  return {
    base: isProduction ? './' : '/',
    plugins,
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    envPrefix: 'VITE_',
    css: {
      devSourcemap: false
    },
    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.fbx'],
    worker: {
      format: 'es'
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]'
        }
      }
    },
    server,
    preview
  };
});
