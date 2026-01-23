import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware básicos
app.use(express.json());
app.use(cors());

// ✅ Servir los archivos estáticos generados por Vite
app.use(express.static(path.join(__dirname, "../public")));

// ✅ Endpoint de salud para Render
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// ✅ Soporte para React Router (deep linking)
app.get("*", (_req, res) => {
  res.sendFile(
    path.join(__dirname, "../public/index.html")
  );
});

// ✅ Puerto dinámico para Render
const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🐊 Caiman POS funcionando en puerto ${PORT}`);
});
