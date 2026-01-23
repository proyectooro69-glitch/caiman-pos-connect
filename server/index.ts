import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Servir los archivos que construye Vite
app.use(express.static(path.join(__dirname, "../dist/public")));

// Ruta para que el POS cargue siempre (necesario para React Router)
app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "../dist/public/index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Caiman POS operativo en puerto ${PORT}`);
});
