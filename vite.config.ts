import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.API_BASE_URL || 'http://localhost:9111/think-root';

  return {
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
  },
  define: {
    'import.meta.env.API_BEARER_TOKEN': JSON.stringify(env.API_BEARER_TOKEN),
    'import.meta.env.API_BASE_URL': JSON.stringify(env.API_BASE_URL),
    'import.meta.env.DATE_FORMAT': JSON.stringify(env.DATE_FORMAT),
    'import.meta.env.TIMEZONE': JSON.stringify(env.TIMEZONE),
  },
  server: {
    proxy: {
      '/api': {
        target: `${apiBaseUrl}/api`,
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
  };
});