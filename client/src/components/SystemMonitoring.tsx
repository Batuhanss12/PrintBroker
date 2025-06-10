
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Activity, AlertTriangle, CheckCircle, Clock, Database, HardDrive, Cpu, Users } from "lucide-react";
import { DialogDescription } from "@/components/ui/dialog";

interface SystemHealth {
  status: 'healthy' | 'unhealthy';
  uptime: number;
  checks: {
    database: boolean;
    fileSystem: boolean;
    memory: boolean;
    processes: boolean;
  };
  timestamp: string;
}

interface ErrorStats {
  total: number;
  last24h: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  unresolved: number;
}

interface SystemMetrics {
  activeUsers: number;
  totalUploads: number;
  processedJobs: number;
  avgResponseTime: number;
  errorRate: number;
}

export default function SystemMonitoring() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: health, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ['/api/admin/system/health'],
    refetchInterval: autoRefresh ? 30000 : false, // 30 saniye
  });

  const { data: errorStats } = useQuery<ErrorStats>({
    queryKey: ['/api/admin/system/errors'],
    refetchInterval: autoRefresh ? 60000 : false, // 1 dakika
  });

  const { data: metrics } = useQuery<SystemMetrics>({
    queryKey: ['/api/admin/system/metrics'],
    refetchInterval: autoRefresh ? 30000 : false,
  });

  const formatUptime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}g ${hours % 24}s ${minutes % 60}d`;
    if (hours > 0) return `${hours}s ${minutes % 60}d`;
    return `${minutes}d ${seconds % 60}s`;
  };

  const getStatusColor = (isHealthy: boolean) => {
    return isHealthy ? 'text-green-600' : 'text-red-600';
  };

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sistem İzleme</h1>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            Otomatik Yenileme {autoRefresh ? 'Açık' : 'Kapalı'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetchHealth()}>
            Şimdi Yenile
          </Button>
        </div>
      </div>

      {/* Sistem Sağlık Durumu */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sistem Durumu</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Badge variant={health?.status === 'healthy' ? 'default' : 'destructive'}>
                {health?.status === 'healthy' ? 'Sağlıklı' : 'Sorunlu'}
              </Badge>
              {health && getStatusIcon(health.status === 'healthy')}
            </div>
            {health && (
              <p className="text-xs text-muted-foreground mt-1">
                Çalışma süresi: {formatUptime(health.uptime)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Kullanıcı</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">Son 15 dakika</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hata Oranı</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.errorRate ? `${metrics.errorRate.toFixed(2)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">Son 24 saat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yanıt Süresi</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.avgResponseTime ? `${metrics.avgResponseTime}ms` : '0ms'}
            </div>
            <p className="text-xs text-muted-foreground">Ortalama</p>
          </CardContent>
        </Card>
      </div>

      {/* Detaylı Sistem Kontrolları */}
      <Card>
        <CardHeader>
          <CardTitle>Sistem Bileşenleri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {health && Object.entries(health.checks).map(([component, isHealthy]) => (
            <div key={component} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {component === 'database' && <Database className="h-4 w-4" />}
                {component === 'fileSystem' && <HardDrive className="h-4 w-4" />}
                {component === 'memory' && <Cpu className="h-4 w-4" />}
                {component === 'processes' && <Activity className="h-4 w-4" />}
                <span className="font-medium">
                  {component === 'database' && 'Veritabanı'}
                  {component === 'fileSystem' && 'Dosya Sistemi'}
                  {component === 'memory' && 'Bellek'}
                  {component === 'processes' && 'Süreçler'}
                </span>
              </div>
              <div className={`flex items-center space-x-2 ${getStatusColor(isHealthy)}`}>
                {getStatusIcon(isHealthy)}
                <span className="text-sm font-medium">
                  {isHealthy ? 'Çalışıyor' : 'Sorunlu'}
                </span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Hata İstatistikleri */}
      {errorStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Hata İstatistikleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Son 24 Saat:</span>
                <span className="font-bold">{errorStats.last24h}</span>
              </div>
              <div className="flex justify-between">
                <span>Çözülmemiş:</span>
                <span className="font-bold text-red-600">{errorStats.unresolved}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Kritik: {errorStats.bySeverity.critical}</span>
                  <span>Yüksek: {errorStats.bySeverity.high}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Orta: {errorStats.bySeverity.medium}</span>
                  <span>Düşük: {errorStats.bySeverity.low}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performans Metrikleri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span>Toplam Yükleme:</span>
                <span className="font-bold">{metrics?.totalUploads || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>İşlenen İş:</span>
                <span className="font-bold">{metrics?.processedJobs || 0}</span>
              </div>
              <div className="space-y-2">
                <span className="text-sm">Sistem Yükü</span>
                <Progress value={75} className="w-full" />
                <span className="text-xs text-muted-foreground">%75 - Normal</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Kritik Uyarılar */}
      {errorStats && errorStats.bySeverity.critical > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {errorStats.bySeverity.critical} kritik hata tespit edildi. 
            Sistem yöneticisiyle iletişime geçin.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
