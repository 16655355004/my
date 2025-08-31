import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  build: {
    // 确保输出目录正确
    outDir: 'dist',
    // 确保资源路径正确
    assetsDir: 'assets',
    // 生成source map用于调试
    sourcemap: false,
    // 确保模块格式正确
    rollupOptions: {
      output: {
        // 确保文件名不包含特殊字符
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  // 确保开发服务器配置正确
  server: {
    port: 3000,
    host: true,
    proxy: {
      // 代理API请求到Cloudflare Worker
      '/api': {
        target: 'https://www.jisoolove.top',
        changeOrigin: true,
        secure: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      }
    }
  },
  // 预览服务器配置
  preview: {
    port: 4173,
    host: true
  }
})
