
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, FileText, DollarSign, Clock, Download, Filter } from "lucide-react";

interface BusinessMetrics {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    trending: 'up' | 'down' | 'stable';
  };
  customers: {
    total: number;
    active: number;
    new: number;
    retention: number;
  };
  orders: {
    total: number;
    completed: number;
    pending: number;
    conversion: number;
  };
  performance: {
    avgOrderValue: number;
    avgProcessingTime: number;
    customerSatisfaction: number;
    repeatCustomerRate: number;
  };
}

interface TimeSeriesData {
  date: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface CategoryAnalysis {
  category: string;
  orders: number;
  revenue: number;
  growth: number;
  marketShare: number;
}

export default function BusinessIntelligence() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'orders' | 'customers'>('revenue');

  const { data: metrics } = useQuery<BusinessMetrics>({
    queryKey: ['/api/business/metrics', timeRange],
  });

  const { data: timeSeriesData } = useQuery<TimeSeriesData[]>({
    queryKey: ['/api/business/timeseries', timeRange, selectedMetric],
  });

  const { data: categoryAnalysis } = useQuery<CategoryAnalysis[]>({
    queryKey: ['/api/business/categories', timeRange],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <div className="h-4 w-4" />;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const exportData = async (format: 'pdf' | 'excel') => {
    try {
      const response = await apiRequest('POST', `/api/business/export`, {
        format,
        timeRange,
        metrics: metrics,
        timeSeries: timeSeriesData,
        categories: categoryAnalysis
      });

      // Dosya indirme işlemi
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `business-report-${timeRange}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">İş Zekası Dashboard</h1>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Son 7 Gün</SelectItem>
              <SelectItem value="30d">Son 30 Gün</SelectItem>
              <SelectItem value="90d">Son 3 Ay</SelectItem>
              <SelectItem value="1y">Son 1 Yıl</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => exportData('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            PDF İndir
          </Button>
          <Button variant="outline" onClick={() => exportData('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Excel İndir
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Toplam Gelir</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatCurrency(metrics.revenue.total) : '₺0'}
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              {metrics && getTrendIcon(metrics.revenue.trending)}
              <span>{metrics ? formatPercentage(metrics.revenue.growth) : '0%'} değişim</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktif Müşteri</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.customers.active || 0}</div>
            <div className="text-xs text-muted-foreground">
              {metrics?.customers.new || 0} yeni müşteri
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tamamlanan Sipariş</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.orders.completed || 0}</div>
            <div className="text-xs text-muted-foreground">
              {metrics ? formatPercentage(metrics.orders.conversion) : '0%'} dönüşüm oranı
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ortalama Sipariş Değeri</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatCurrency(metrics.performance.avgOrderValue) : '₺0'}
            </div>
            <div className="text-xs text-muted-foreground">
              {metrics ? `${metrics.performance.avgProcessingTime}s` : '0s'} ort. işlem süresi
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trendler</TabsTrigger>
          <TabsTrigger value="categories">Kategori Analizi</TabsTrigger>
          <TabsTrigger value="customers">Müşteri Analizi</TabsTrigger>
          <TabsTrigger value="performance">Performans</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Gelir Trendi</CardTitle>
                <Select value={selectedMetric} onValueChange={(value: any) => setSelectedMetric(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Gelir</SelectItem>
                    <SelectItem value="orders">Sipariş</SelectItem>
                    <SelectItem value="customers">Müşteri</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value: any, name: string) => {
                    if (name === 'revenue') return formatCurrency(value);
                    return value;
                  }} />
                  <Line 
                    type="monotone" 
                    dataKey={selectedMetric} 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={{ fill: '#8884d8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Kategori Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categoryAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ category, marketShare }) => `${category} (${marketShare.toFixed(1)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="marketShare"
                    >
                      {categoryAnalysis?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kategori Performansı</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryAnalysis?.map((category, index) => (
                  <div key={category.category} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{category.category}</span>
                      <Badge variant={category.growth > 0 ? 'default' : 'destructive'}>
                        {category.growth > 0 ? '+' : ''}{formatPercentage(category.growth)}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(category.revenue)}</span>
                      <span>{category.orders} sipariş</span>
                    </div>
                    <Progress 
                      value={category.marketShare} 
                      className="h-2"
                      style={{ 
                        backgroundColor: COLORS[index % COLORS.length] + '20',
                      }}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Müşteri Segmentasyonu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Yeni Müşteriler</span>
                    <span className="font-bold">{metrics?.customers.new || 0}</span>
                  </div>
                  <Progress value={30} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tekrar Eden Müşteriler</span>
                    <span className="font-bold">
                      {metrics ? formatPercentage(metrics.performance.repeatCustomerRate) : '0%'}
                    </span>
                  </div>
                  <Progress value={metrics?.performance.repeatCustomerRate || 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Müşteri Memnuniyeti</span>
                    <span className="font-bold">
                      {metrics ? formatPercentage(metrics.performance.customerSatisfaction) : '0%'}
                    </span>
                  </div>
                  <Progress value={metrics?.performance.customerSatisfaction || 0} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Müşteri Yaşam Döngüsü</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {metrics ? formatPercentage(metrics.customers.retention) : '0%'}
                    </div>
                    <p className="text-sm text-muted-foreground">Müşteri Tutma Oranı</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold">
                      {formatCurrency(metrics?.performance.avgOrderValue || 0)}
                    </div>
                    <p className="text-sm text-muted-foreground">Ortalama Müşteri Değeri</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Müşteri Büyüme</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="customers" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Operasyonel Metrikler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Ortalama İşlem Süresi</span>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-bold">
                      {metrics ? `${metrics.performance.avgProcessingTime}s` : '0s'}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span>Sipariş Dönüşüm Oranı</span>
                  <span className="font-bold">
                    {metrics ? formatPercentage(metrics.orders.conversion) : '0%'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Bekleyen Siparişler</span>
                  <span className="font-bold">{metrics?.orders.pending || 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Kalite Metrikleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Müşteri Memnuniyeti</span>
                    <span>{metrics ? formatPercentage(metrics.performance.customerSatisfaction) : '0%'}</span>
                  </div>
                  <Progress value={metrics?.performance.customerSatisfaction || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tekrar Eden Müşteri</span>
                    <span>{metrics ? formatPercentage(metrics.performance.repeatCustomerRate) : '0%'}</span>
                  </div>
                  <Progress value={metrics?.performance.repeatCustomerRate || 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Sistem Uptime</span>
                    <span>99.9%</span>
                  </div>
                  <Progress value={99.9} />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
