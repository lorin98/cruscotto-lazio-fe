import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Mode "be" (`npm run dev:be`): niente MSW e /api, /auth inoltrati al backend vero (BFF). Il proxy lascia l'header
// Host del dev server (changeOrigin false): per il backend la SPA e' same-origin su http://localhost:5173, quindi il
// cookie di sessione, il redirect OIDC (redirect URI http://localhost:5173/* nel realm di prova) e la RegolaOrigine
// tornano tutti sulla stessa origine. Backend: CSR_BE_URL (default http://localhost:18080), da .env.local.
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'CSR_');
  const backend = env.CSR_BE_URL || 'http://localhost:18080';
  return {
    plugins: [react()],
    // Il service worker di MSW (public-dev/mockServiceWorker.js) serve solo al dev server con i mock: la build di
    // produzione non copia cartelle pubbliche, cosi' il worker non arriva nel deploy (review step9 A-07).
    publicDir: command === 'serve' ? 'public-dev' : false,
    server:
      mode === 'be'
        ? {
            port: 5173,
            strictPort: true,
            proxy: {
              '/api': { target: backend },
              '/auth': { target: backend },
            },
          }
        : undefined,
  };
});
