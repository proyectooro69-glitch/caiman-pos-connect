import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Define que el código está en la carpeta 'client'
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
    // CAMBIO IMPORTANTE: Lo enviamos directo a 'dist' en la raíz del proyecto
    // para que coincida con tu configuración de Netlify
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    host: true,
    port: 5000,
  },
});
