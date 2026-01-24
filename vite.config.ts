import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // 👇 raíz del frontend
  root: path.resolve(__dirname, "client"),

  // Base relativa para que funcione en Netlify/Render
  base: "./",

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),        // apunta a client/
      "@shared": path.resolve(__dirname, "shared"),  // ajusta según tu estructura real
      "@assets": path.resolve(__dirname, "client/assets"),
    },
  },

  build: {
    // 👇 salida de los archivos compilados
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },

  server: {
    host: true,
    port: 5000,
  },
});
