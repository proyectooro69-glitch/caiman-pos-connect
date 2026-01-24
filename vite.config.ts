import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "client/assets"),
      "@components": path.resolve(__dirname, "client/components"),
      "@pages": path.resolve(__dirname, "client/pages"),
      "@utils": path.resolve(__dirname, "client/utils"),
    },
  },
  build: {
    // Esto saca la carpeta dist a la raíz para que Netlify la vea
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
