import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  return {
    plugins: [react()],
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
