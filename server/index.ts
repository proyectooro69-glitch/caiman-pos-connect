import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Soporte para datos y seguridad
app.use(express.json());
app.use(cors());

// Servir los archivos de Caiman POS (Vite construye en dist/public)
app.use(express.static(path.join(__dirname, "../dist/public")));

// API de Salud (Para que Render sepa que el servidor está vivo)
app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

// RUTA CRÍTICA: Permite que el Dashboard y las Mesas carguen al refrescar
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

// EL ARREGLO PARA RENDER (DINÁMICO)
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🐊 Caiman POS funcionando en puerto ${PORT}`);
});
