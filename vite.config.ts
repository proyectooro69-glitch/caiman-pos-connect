import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  // Base relativa para que los archivos se encuentren correctamente en cualquier subdominio
  base: "./",
  plugins: [react()],
  resolve: {
    alias: {
      // Ajustamos los alias para que apunten correctamente a la estructura de tu POS
      "@": path.resolve(__dirname, "./client/src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@assets": path.resolve(__dirname, "./attached_assets"),
    },
  },
  // Definimos la raíz del proyecto en la carpeta client
  root: path.resolve(__dirname, "client"),
  build: {
    // Render necesita que el resultado esté en la carpeta dist/public para servirlo
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: false,
    // Optimizamos el build para que la carga inicial sea más rápida en conexiones lentas
    chunkSizeWarningLimit: 1000,
  },
  server: {
    // Permitimos que Render asigne el puerto automáticamente
    host: true,
    port: Number(process.env.PORT) || 5000,
    strictPort: false,
  },
});
