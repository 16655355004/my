import { fileURLToPath, URL } from 'node:url'
import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import type { ServerOptions, PreviewOptions } from 'vite'

// DevTools are handled as optional dependency in package.json

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const apiTarget = process.env.VITE_API_BASE_URL || 'https://www.jisoolove.top'
  
  // Configure proxy
  const proxy: Record<string, string | ProxyOptions> = {
    '/api': {
      target: apiTarget,
      changeOrigin: true,
      secure: true,
      configure: (proxy) => {
        proxy.on('error', (err: Error) => {
          console.warn('Proxy error:', err.message)
        })
      },
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
    // DevTools will be added conditionally in production builds
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
          assetFileNames: 'assets/[name]-[hash][extname]',
          manualChunks: {
            vue: ['vue', 'vue-router'],
            gsap: ['gsap', 'gsap/ScrollTrigger', 'gsap/ScrollToPlugin'],
          },
        }
      }
    },
    server,
    preview
  };
});
