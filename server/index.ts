import express, { type Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";
import { apiLimiter, authLimiter } from './middleware/rateLimiter';
// Use the original routes file for now while transitioning
import { registerRoutes } from "./routes";
import { setupAuth } from "./auth";
// Import webhook routes for payment integrations
import webhookRoutes from './routes/webhooks';
// Import Swagger documentation setup
import { setupSwagger } from './swagger';
// Import automatic payment processor
import { getAutomaticPaymentProcessor } from './services/AutomaticPaymentProcessor';
// Import storage and casino API for service initialization
import { storage } from './storage';
import { casino747Api } from './casino747Api-simplified';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rate limiting middleware
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Basic security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

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

(async () => {
  // Create HTTP server
  const server = createServer(app);
  
  // Setup authentication
  setupAuth(app);
  
  // Register webhook routes (no authentication required for external service callbacks)
  // These need to be defined before the main routes to ensure proper handling
  app.use('/api/webhook', webhookRoutes);
  
  // Setup Swagger documentation
  setupSwagger(app);
  
  // Use the original routes system temporarily
  await registerRoutes(app);
  
  // Serve static files from the public directory
  app.use(express.static(path.join(process.cwd(), 'public')));

  // Serve the auth-test.html file directly
  app.get('/auth-test.html', (req, res) => {
    res.sendFile(path.join(process.cwd(), '/public/auth-test.html'));
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`Server running at http://0.0.0.0:${port}`);
    log(`API available at http://0.0.0.0:${port}/api`);
    
    // Start automatic payment processor (background payment handling)
    try {
      const paymentProcessor = getAutomaticPaymentProcessor(storage, casino747Api);
      paymentProcessor.start();
      log(`🚀 Automatic payment processor started successfully`);
    } catch (error) {
      log(`❌ Error starting automatic payment processor: ${error}`);
    }
  });
  
  return server;
})();
