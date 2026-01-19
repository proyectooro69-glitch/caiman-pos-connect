import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import cron from "node-cron";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { sendSubscriptionEmail, checkExpiringSubscriptions } from "./email";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
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

cron.schedule("0 9 * * *", async () => {
  console.log("Running daily subscription check...");
  try {
    const results = await checkExpiringSubscriptions();
    console.log("Subscription check complete:", results);
  } catch (error) {
    console.error("Error in subscription check cron:", error);
  }
});

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({ message });
  throw err;
});

(async () => {
  const server = createServer(app);

  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({ message: "Not Found" });
    }
    next();
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = 5000;
  server.listen(port, "0.0.0.0", () => {
    log(`serving on port ${port}`);
  });
})();
