import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Configuraciones básicas para Caiman POS
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Registro de peticiones para depuración en Render
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Servir archivos estáticos del Frontend (Caiman POS Client)
// Importante: Render construye la app en la carpeta 'dist/public'
const publicPath = path.resolve(__dirname, "..", "dist", "public");
app.use(express.static(publicPath));

// API Placeholder (Aquí iría tu lógica de servidor si la necesitas)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Caiman POS Server is Running" });
});

// Ruta comodín: Sirve el index.html para cualquier ruta (necesario para React/Vite)
app.get("*", (req, res) => {
  res.sendFile(path.join(publicPath, "index.html"), (err) => {
    if (err) {
      res.status(500).send("Error cargando Caiman POS. Verifica el build.");
    }
  });
});

// Manejo de errores global
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Error en servidor:", err);
  res.status(status).json({ message });
});

// EL SECRETO PARA RENDER: Puerto dinámico
const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🐊 Caiman POS Live on port ${PORT}`);
});
