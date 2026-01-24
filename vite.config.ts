import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  root: path.resolve(__dirname, "client"),
  base: "./",
  plugins: [react()],
  build: {
    // Esto asegura que la carpeta 'dist' se cree en la raíz del repo
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
});
