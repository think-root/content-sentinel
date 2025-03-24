import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(() => {
  return {
    plugins: [react()],
    base: "/dashboard/",
    build: {
      assetsDir: "assets",
      outDir: "dist",
    },
    resolve: {
      dedupe: ["react", "react-dom"],
    },
  };
});
