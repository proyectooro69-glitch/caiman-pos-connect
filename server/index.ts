import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";
import { sendSubscriptionEmail, checkExpiringSubscriptions } from "./email";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function log(message: string) {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [express] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }
      log(logLine);
    }
  });

  next();
});

registerRoutes(app);

app.post("/api/email/send", async (req, res) => {
  try {
    const result = await sendSubscriptionEmail(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/email/check-expiring", async (_req, res) => {
  try {
    const results = await checkExpiringSubscriptions();
    res.json({
      success: true,
      message: `Processed ${results.length} expiring subscriptions`,
      results,
    });
  } catch (error: any) {
    console.error("Error checking expiring subscriptions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(status).json({ message });
  console.error(err);
});

async function setupVite(app: express.Express, server: Server) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "../vite.config.ts"),
    server: { middlewareMode: true, hmr: { server } },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

function serveStatic(app: express.Express) {
  const distPath = path.resolve(__dirname, "../dist");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.resolve(distPath, "index.html"));
    });
  }
}

(async () => {
  const server = createServer(app);

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not Found" });
    }
    next();
  });

  const isDev = process.env.NODE_ENV !== "production";

  if (isDev) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = process.env.PORT ? parseInt(process.env.PORT) : 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`Caiman POS serving on port ${port}`);
  });
})();
