import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Chinese Mission',
        short_name: 'CN Mission',
        description: 'ฝึกภาษาจีนผ่านภารกิจจำลองสถานการณ์',
        theme_color: '#f5f3ee',
        background_color: '#f5f3ee',
        display: 'standalone',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
