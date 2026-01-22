import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: any) {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { server },
    },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        if (
          msg.includes(
            "[TypeScript] Found 0 errors. Watching for file changes"
          )
        ) {
          return;
        }
        viteLogger.error(msg, options);
      },
    },
  });

  app.use(vite.middlewares);
  app.get(/^(?!\/api).*/, async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(__dirname, "..", "client", "index.html");

      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = await vite.transformIndexHtml(url, template);

      res.status(200).set({ "Content-Type": "text/html" }).end(template);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "..", "dist", "public"); // ← corregido

  if (!fs.existsSync(distPath)) {
    console.warn(`Warning: Static directory not found at ${distPath}. Run build first for production.`);
    return;
  }

  app.use(express.static(distPath, {
    index: "index.html",
    maxAge: "1h"
  }));

  app.get(/^(?!\/api).*/, (req, res) => {
    const indexPath = path.resolve(distPath, "index.html");
    if (fs.existsSync(indexPath)) {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found - Frontend files missing");
    }
  });
}
