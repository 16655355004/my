import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import type { ServerOptions, PreviewOptions } from 'vite'

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
  
  return {
    base: isProduction ? './' : '/',
    plugins: [
      vue(),
      vueDevTools(),
    ],
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
