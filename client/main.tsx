import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css"; // Asegúrate de que este archivo tenga las 3 líneas de @tailwind

const rootElement = document.getElementById("root");

if (!rootElement) throw new Error("No se encontró el elemento root. Revisa tu index.html");

createRoot(rootElement).render(<App />);
