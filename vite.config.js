import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    electron([
      {
        // 主进程入口
        entry: 'electron/main.js',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3', 'sharp', 'electron-store'],
            },
          },
        },
      },
      {
        entry: 'electron/preload.js',
        onstart(options) {
          // 预加载脚本编译完成后，通知渲染进程刷新
          options.reload()
        },
        vite: {
          build: {
            rollupOptions: {
              output: {
                format: 'cjs',
              },
            },
          },
        },
      },
    ]),
    renderer(),
  ],
})
