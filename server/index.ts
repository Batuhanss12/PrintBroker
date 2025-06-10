import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pythonAnalyzerService } from './pythonAnalyzerService';
import { execSync } from 'child_process';

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
    if (path.startsWith("/api") && res.statusCode !== 304) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;

      // Only log response for errors or slow requests
      if (res.statusCode >= 400 || duration > 1000) {
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse).slice(0, 100)}`;
        }
      }

      if (logLine.length > 120) {
        logLine = logLine.slice(0, 119) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Python Analyzer Sistem Kontrolü
async function initializePythonServices() {
  // Python Environment Test with graceful degradation
  console.log('🐍 Python tabanlı analiz sistemi kontrol ediliyor...');
  try {
    execSync('python3 -c "import sys; print(\'Python OK\')"', { 
      stdio: 'pipe',
      timeout: 5000
    });

    // Test individual packages
    const packages = ['fitz', 'PIL', 'cv2', 'numpy', 'svglib', 'reportlab', 'cairosvg'];
    const availablePackages = [];

    for (const pkg of packages) {
      try {
        execSync(`python3 -c "import ${pkg}"`, { stdio: 'pipe', timeout: 2000 });
        availablePackages.push(pkg);
      } catch {
        console.log(`⚠️ Python package missing: ${pkg}`);
      }
    }

    if (availablePackages.length >= 4) {
      console.log('✅ Python analiz sistemi AKTIF');
      console.log(`📦 Mevcut kütüphaneler: ${availablePackages.join(', ')}`);
    } else {
      console.log('⚠️ Python analiz sistemi KISITLI - Temel Node.js servisleri aktif');
    }
  } catch (error) {
    console.log('⚠️ Python bulunamadı - Sadece Node.js servisleri aktif');
  }
}

(async () => {
  // Python servislerini başlat
  await initializePythonServices();
  const server = await registerRoutes(app);

  // Global unhandled promise rejection handler
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  // Global uncaught exception handler
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error('Express Error Handler:', err);

    if (!res.headersSent) {
      res.status(status).json({ message });
    }
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
    log(`serving on port ${port}`);
  });
})();