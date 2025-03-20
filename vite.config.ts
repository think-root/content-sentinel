import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:9111/think-root';

  return {
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
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