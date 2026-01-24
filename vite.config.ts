import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  // Establece la carpeta 'client' como la raíz del código fuente
  root: path.resolve(__dirname, "client"),

  // Permite rutas relativas para el despliegue
  base: "./",

  plugins: [react()],

  resolve: {
    // Estos alias ayudan a Vite a encontrar tus carpetas dentro de 'client'
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@assets": path.resolve(__dirname, "client/assets"),
      "@components": path.resolve(__dirname, "client/components"),
      "@pages": path.resolve(__dirname, "client/pages"),
      "@utils": path.resolve(__dirname, "client/utils"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },

  build: {
    // IMPORTANTE: Saca la compilación a una carpeta 'dist' en la raíz del repo
    // para que Netlify la encuentre sin problemas.
    outDir: path.resolve(__dirname, "dist"),
    // Limpia la carpeta antes de cada build
    emptyOutDir: true,
    // Asegura que el archivo final sea compatible
    target: "esnext",
  },

  server: {
    host: true,
    port: 5000,
  },
});
