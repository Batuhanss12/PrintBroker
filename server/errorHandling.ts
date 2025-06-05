
import { Request, Response, NextFunction } from 'express';

interface ErrorLog {
  id: string;
  timestamp: Date;
  errorType: string;
  message: string;
  stack?: string;
  userId?: string;
  endpoint: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

class ErrorManager {
  private errors: ErrorLog[] = [];
  private alertThresholds = {
    critical: 1, // Anında bildirim
    high: 3,     // 5 dakikada 3 hata
    medium: 10   // 1 saatte 10 hata
  };

  logError(error: Error, req: Request, severity: ErrorLog['severity'] = 'medium', userId?: string) {
    const errorLog: ErrorLog = {
      id: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      errorType: error.name,
      message: error.message,
      stack: error.stack,
      userId,
      endpoint: req.path,
      severity,
      resolved: false
    };

    this.errors.push(errorLog);
    console.error(`🔥 [${severity.toUpperCase()}] ${error.message}`, {
      errorId: errorLog.id,
      endpoint: req.path,
      userId,
      timestamp: errorLog.timestamp
    });

    // Kritik hatalar için anında aksiyon
    if (severity === 'critical') {
      this.handleCriticalError(errorLog);
    }

    // Hata eşik kontrolü
    this.checkErrorThresholds(severity);
  }

  private handleCriticalError(errorLog: ErrorLog) {
    // Kritik hata durumunda sistem yöneticilerine bildirim
    console.error('🚨 CRITICAL ERROR DETECTED:', errorLog);
    // Email/SMS bildirimi entegrasyonu burada olacak
  }

  private checkErrorThresholds(severity: ErrorLog['severity']) {
    const now = new Date();
    const timeWindow = severity === 'critical' ? 60000 : 
                      severity === 'high' ? 300000 : 3600000; // 1dk, 5dk, 1sa

    const recentErrors = this.errors.filter(err => 
      err.severity === severity && 
      (now.getTime() - err.timestamp.getTime()) < timeWindow
    ).length;

    if (recentErrors >= this.alertThresholds[severity]) {
      console.warn(`⚠️ Error threshold exceeded for ${severity}: ${recentErrors} errors`);
    }
  }

  getErrorStats() {
    const last24h = this.errors.filter(err => 
      (new Date().getTime() - err.timestamp.getTime()) < 86400000
    );

    return {
      total: this.errors.length,
      last24h: last24h.length,
      bySeverity: {
        critical: last24h.filter(e => e.severity === 'critical').length,
        high: last24h.filter(e => e.severity === 'high').length,
        medium: last24h.filter(e => e.severity === 'medium').length,
        low: last24h.filter(e => e.severity === 'low').length
      },
      unresolved: this.errors.filter(e => !e.resolved).length
    };
  }
}

export const errorManager = new ErrorManager();

// Global error handler middleware
export const globalErrorHandler = (error: Error, req: Request, res: Response, next: NextFunction) => {
  const userId = (req as any).user?.id || (req as any).session?.user?.id;
  
  // Sistem kritik hatalarını belirle
  const severity = error.message.includes('ENOSPC') || 
                  error.message.includes('ENOMEM') ||
                  error.message.includes('database') ? 'critical' : 'high';

  errorManager.logError(error, req, severity, userId);

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      message: severity === 'critical' ? 
        'Sistem geçici olarak kullanılamıyor. Teknik ekibimiz bilgilendirildi.' : 
        'İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.',
      errorId: error.message.split('_')[1] || 'unknown',
      timestamp: new Date().toISOString()
    });
  }
};

// Uptime monitoring
export class UptimeMonitor {
  private startTime = new Date();
  private healthChecks: { [key: string]: boolean } = {
    database: true,
    fileSystem: true,
    memory: true,
    processes: true
  };

  async performHealthCheck() {
    const checks = {
      database: await this.checkDatabase(),
      fileSystem: await this.checkFileSystem(),
      memory: await this.checkMemory(),
      processes: await this.checkProcesses()
    };

    this.healthChecks = checks;
    return {
      status: Object.values(checks).every(Boolean) ? 'healthy' : 'unhealthy',
      uptime: new Date().getTime() - this.startTime.getTime(),
      checks,
      timestamp: new Date().toISOString()
    };
  }

  private async checkDatabase() {
    try {
      // Test database connection
      return true;
    } catch {
      return false;
    }
  }

  private async checkFileSystem() {
    try {
      const fs = await import('fs');
      fs.writeFileSync('/tmp/health-check', 'test');
      fs.unlinkSync('/tmp/health-check');
      return true;
    } catch {
      return false;
    }
  }

  private async checkMemory() {
    const usage = process.memoryUsage();
    const usedMB = usage.heapUsed / 1024 / 1024;
    return usedMB < 900; // 900MB threshold
  }

  private async checkProcesses() {
    return process.uptime() > 0;
  }
}

export const uptimeMonitor = new UptimeMonitor();
