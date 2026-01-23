import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Base relativa para que funcione en cualquier URL de Render
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      // Este es el alias principal que usa Lovable
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "../shared"),
    },
  },
  build: {
    // IMPORTANTE: Vite pondrá los archivos aquí para que el servidor los encuentre
    outDir: "../dist/public",
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5000,
  },
});
