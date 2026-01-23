import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs";
import cors from "cors";
import cron from "node-cron";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { sendSubscriptionEmail, checkExpiringSubscriptions } from "./email";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const pathReq = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathReq.startsWith("/api")) {
      let logLine = `${req.method} ${pathReq} ${res.statusCode} in ${duration}ms`;
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

// 404 handler for API routes
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ message: "Not Found" });
  }
  next();
});

registerRoutes(app);

// Email endpoints
app.post("/api/email/send", async (req, res) => {
  try {
    const result = await sendSubscriptionEmail(req.body);
    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error("Error sending email:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post("/api/email/check-expiring", async (req, res) => {
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

// Cron job for daily subscription check
cron.schedule("0 9 * * *", async () => {
  console.log("Running daily subscription check...");
  try {
    const results = await checkExpiringSubscriptions();
    console.log("Subscription check complete:", results);
  } catch (error) {
    console.error("Error in subscription check cron:", error);
  }
});

// Global error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("Global error:", err);
  res.status(status).json({ message });
});

(async () => {
  const server = createServer(app);

  // Setup Vite for development or serve static files for production
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // SPA catch-all route
  app.get("*", (req, res) => {
    if (app.get("env") === "development") {
      return res.status(404).send("Not Found (Vite should handle this)");
    }

    // Try multiple possible paths for the built frontend
    const possiblePaths = [
      path.join(process.cwd(), "dist", "index.html"),
      path.join(process.cwd(), "dist", "public", "index.html"),
      path.join(__dirname, "..", "dist", "index.html"),
      path.join(__dirname, "..", "dist", "public", "index.html"),
    ];

    let indexPath = null;
    
    for (const tryPath of possiblePaths) {
      console.log(`Checking path: ${tryPath}`);
      if (fs.existsSync(tryPath)) {
        indexPath = tryPath;
        break;
      }
    }

    if (indexPath) {
      console.log(`Serving index.html from: ${indexPath}`);
      res.setHeader("Cache-Control", "no-cache");
      return res.sendFile(indexPath, (err) => {
        if (err) {
          console.error("Error sending index.html:", err);
          res.status(500).json({
            error: "Failed to serve frontend",
            message: err.message,
            path: indexPath,
          });
        }
      });
    } else {
      console.error("index.html not found in any of these locations:");
      possiblePaths.forEach(p => console.error(`  - ${p}`));
      
      res.status(404).json({
        error: "Frontend not found",
        message: "Make sure to run 'npm run build' first",
        checkedPaths: possiblePaths,
        cwd: process.cwd(),
        __dirname: __dirname,
      });
    }
  });

  const port = process.env.PORT || 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`🚀 Server running on port ${port}`);
    log(`📍 Environment: ${app.get("env")}`);
    log(`📁 Working directory: ${process.cwd()}`);
    log(`📂 __dirname: ${__dirname}`);
  });
})();
