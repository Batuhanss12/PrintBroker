import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pythonAnalyzerService } from './pythonAnalyzerService';

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
  console.log('🐍 Python tabanlı analiz sistemi başlatılıyor...');

  try {
    const environmentOK = await pythonAnalyzerService.testPythonEnvironment();
    if (environmentOK) {
      console.log('✅ Python analiz sistemi AKTIF - Tüm kütüphaneler hazır');
      console.log('📦 Aktif Python kütüphaneleri: PyMuPDF, Pillow, OpenCV, ReportLab, CairoSVG');
    } else {
      console.log('⚠️ Python analiz sistemi KISITLI - Bazı kütüphaneler eksik');
    }
  } catch (error) {
    console.error('❌ Python analiz sistemi başlatılamadı:', error);
  }
}

(async () => {
  // Python servislerini başlat
  await initializePythonServices();
  const server = await registerRoutes(app);

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
    log(`serving on port ${port}`);
  });
})();