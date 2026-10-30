import { defineConfig, loadEnv, type Connect, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { PROXY_PREFIX, handleNodeProxyRequest } from "./api-proxy.js";

// Serve /proxy/* from `vite` and `vite preview` the way server.js and the
// Pages Function do in production, with the service URLs and tokens from .env.
function apiProxy(env: Record<string, string>): Plugin {
  const middleware: Connect.NextHandleFunction = (req, res, next) => {
    if (!req.url?.startsWith(PROXY_PREFIX)) return next();
    // Dev and preview servers listen on localhost unless started with --host
    handleNodeProxyRequest(req, res, env, { requireAccess: false }).catch(next);
  };
  return {
    name: "api-proxy",
    configureServer: (server) => { server.middlewares.use(middleware); },
    configurePreviewServer: (server) => { server.middlewares.use(middleware); },
  };
}

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), apiProxy({ ...loadEnv(mode, process.cwd(), ""), ...process.env } as Record<string, string>)],
    base: "/",
    build: {
      assetsDir: "assets",
      outDir: "dist",
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            radix: ['@radix-ui/react-alert-dialog', '@radix-ui/react-dialog',
                   '@radix-ui/react-label', '@radix-ui/react-popover',
                   '@radix-ui/react-select', '@radix-ui/react-slot',
                   '@radix-ui/react-switch', '@radix-ui/react-tabs',
                   '@radix-ui/react-tooltip'],
            ui: ['lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
            utils: ['date-fns', 'cronstrue', 'react-day-picker']
          },
        }
      }
    },
    resolve: {
      dedupe: ["react", "react-dom"],
      alias: {
        "@": "/src",
      },
    },
  };
});
