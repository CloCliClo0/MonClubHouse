import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      '/api':     'http://localhost:3000',
      '/auth':    'http://localhost:3000',
      '/uploads': 'http://localhost:3000',
    },
  },

  build: {
    outDir: 'dist',
    // Cible les navigateurs modernes — bundle plus léger
    target: 'es2020',
    // Désactive les sourcemaps en prod (sécurité + taille)
    sourcemap: false,
    // Avertissement à partir de 600 Ko par chunk
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Sépare les vendeurs des pages applicatives pour maximiser le cache navigateur
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/react-router-dom/') || id.includes('node_modules/react-router/')) {
            return 'vendor-router';
          }
          if (id.includes('node_modules/axios/')) {
            return 'vendor-axios';
          }
          if (id.includes('node_modules/socket.io-client/')) {
            return 'vendor-socket';
          }
        },
        // Noms de fichiers avec hash pour cache bust automatique
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
  },
})
