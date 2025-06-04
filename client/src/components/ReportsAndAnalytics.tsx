import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText, 
  DollarSign,
  Calendar,
  Download,
  Filter,
  PieChart,
  Target,
  Clock,
  CheckCircle
} from "lucide-react";

interface ReportFilters {
  dateRange: string;
  startDate: string;
  endDate: string;
  customerType?: string;
  status?: string;
}

interface BusinessMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  totalQuotes: number;
  convertedQuotes: number;
  totalCustomers: number;
  newCustomers: number;
  averageOrderValue: number;
  conversionRate: number;
  topCustomers: Array<{
    id: string;
    name: string;
    totalOrders: number;
    totalSpent: number;
  }>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  quotesByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  productCategories: Array<{
    category: string;
    orders: number;
    revenue: number;
  }>;
}

export default function ReportsAndAnalytics() {
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'last30days',
    startDate: '',
    endDate: '',
  });

  const [activeTab, setActiveTab] = useState('overview');

  // Fetch business metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['/api/reports/business-metrics', filters],
    queryFn: () => apiRequest('POST', '/api/reports/business-metrics', filters),
  });

  // Fetch detailed reports
  const { data: detailedReports } = useQuery({
    queryKey: ['/api/reports/detailed', filters, activeTab],
    queryFn: () => apiRequest('POST', `/api/reports/${activeTab}`, filters),
    enabled: activeTab !== 'overview',
  });

  const updateFilter = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const exportReport = async (reportType: string) => {
    try {
      const response = await apiRequest('POST', `/api/reports/export/${reportType}`, filters);
      // Handle file download
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-raporu-${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType, 
    icon: Icon, 
    format = 'number' 
  }: {
    title: string;
    value: number;
    change?: number;
    changeType?: 'positive' | 'negative';
    icon: any;
    format?: 'number' | 'currency' | 'percentage';
  }) => {
    const formatValue = (val: number) => {
      switch (format) {
        case 'currency':
          return `₺${val.toLocaleString('tr-TR')}`;
        case 'percentage':
          return `%${val.toFixed(1)}`;
        default:
          return val.toLocaleString('tr-TR');
      }
    };

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
              <p className="text-2xl font-bold">{formatValue(value)}</p>
              {change !== undefined && (
                <div className="flex items-center mt-2">
                  {changeType === 'positive' ? (
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                  )}
                  <span className={`text-sm font-medium ${
                    changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="p-3 bg-blue-50 rounded-full">
              <Icon className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p>Raporlar yükleniyor...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Raporlar ve Analizler
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => exportReport('overview')}>
                <Download className="h-4 w-4 mr-2" />
                Rapor İndir
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label>Tarih Aralığı</Label>
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Son 7 Gün</SelectItem>
                  <SelectItem value="last30days">Son 30 Gün</SelectItem>
                  <SelectItem value="last3months">Son 3 Ay</SelectItem>
                  <SelectItem value="last6months">Son 6 Ay</SelectItem>
                  <SelectItem value="lastyear">Son 1 Yıl</SelectItem>
                  <SelectItem value="custom">Özel Tarih</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filters.dateRange === 'custom' && (
              <>
                <div>
                  <Label>Başlangıç Tarihi</Label>
                  <Input 
                    type="date" 
                    value={filters.startDate}
                    onChange={(e) => updateFilter('startDate', e.target.value)}
                  />
                </div>
                <div>
                  <Label>Bitiş Tarihi</Label>
                  <Input 
                    type="date" 
                    value={filters.endDate}
                    onChange={(e) => updateFilter('endDate', e.target.value)}
                  />
                </div>
              </>
            )}

            <div>
              <Label>Müşteri Türü</Label>
              <Select value={filters.customerType || 'all'} onValueChange={(value) => updateFilter('customerType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="new">Yeni Müşteriler</SelectItem>
                  <SelectItem value="returning">Dönüş Yapan</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="sales">Satış Analizi</TabsTrigger>
          <TabsTrigger value="customers">Müşteri Analizi</TabsTrigger>
          <TabsTrigger value="performance">Performans</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Toplam Gelir"
              value={metrics?.totalRevenue || 0}
              change={15.2}
              changeType="positive"
              icon={DollarSign}
              format="currency"
            />
            <MetricCard
              title="Toplam Teklif"
              value={metrics?.totalQuotes || 0}
              change={8.1}
              changeType="positive"
              icon={FileText}
            />
            <MetricCard
              title="Dönüşüm Oranı"
              value={metrics?.conversionRate || 0}
              change={-2.4}
              changeType="negative"
              icon={Target}
              format="percentage"
            />
            <MetricCard
              title="Ortalama Sipariş Tutarı"
              value={metrics?.averageOrderValue || 0}
              change={12.8}
              changeType="positive"
              icon={TrendingUp}
              format="currency"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Gelir Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p>Grafik verisi yükleniyor...</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quote Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Teklif Durumu Dağılımı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.quotesByStatus?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-blue-${(index + 1) * 100}`}></div>
                        <span className="text-sm">{item.status}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">{item.count}</span>
                        <span className="text-gray-500 text-xs ml-2">%{item.percentage}</span>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">Veri yükleniyor...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers */}
          <Card>
            <CardHeader>
              <CardTitle>En Değerli Müşteriler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {metrics?.topCustomers?.map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">#{index + 1}</Badge>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.totalOrders} sipariş</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-green-600">₺{customer.totalSpent.toLocaleString()}</p>
                    </div>
                  </div>
                )) || (
                  <p className="text-gray-500 text-center py-8">Müşteri verisi yükleniyor...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Sales */}
            <Card>
              <CardHeader>
                <CardTitle>Aylık Satış Performansı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.revenueByMonth?.map((month, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border-l-4 border-blue-500 bg-blue-50">
                      <div>
                        <p className="font-medium">{month.month}</p>
                        <p className="text-sm text-gray-600">{month.orders} sipariş</p>
                      </div>
                      <p className="font-semibold text-blue-600">₺{month.revenue.toLocaleString()}</p>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">Satış verisi yükleniyor...</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Product Categories */}
            <Card>
              <CardHeader>
                <CardTitle>Ürün Kategorisi Performansı</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.productCategories?.map((category, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{category.category}</span>
                        <span className="text-green-600 font-semibold">₺{category.revenue.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(category.orders / 100) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600">{category.orders} sipariş</p>
                    </div>
                  )) || (
                    <p className="text-gray-500 text-center py-8">Kategori verisi yükleniyor...</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Toplam Müşteri"
              value={metrics?.totalCustomers || 0}
              change={5.8}
              changeType="positive"
              icon={Users}
            />
            <MetricCard
              title="Yeni Müşteriler"
              value={metrics?.newCustomers || 0}
              change={12.4}
              changeType="positive"
              icon={Users}
            />
            <MetricCard
              title="Müşteri Tutma Oranı"
              value={78.5}
              change={3.2}
              changeType="positive"
              icon={Target}
              format="percentage"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Müşteri Aktivite Analizi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Detaylı müşteri analizi geliştirme aşamasında...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Response Times */}
            <Card>
              <CardHeader>
                <CardTitle>Yanıt Süreleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      <span>Ortalama Teklif Hazırlama</span>
                    </div>
                    <span className="font-semibold">2.3 saat</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-blue-600" />
                      <span>Sipariş Onaylama</span>
                    </div>
                    <span className="font-semibold">45 dakika</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Kalite Metrikleri</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Müşteri Memnuniyeti</span>
                    <span className="font-semibold">4.8/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zamanında Teslimat</span>
                    <span className="font-semibold">%94.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hata Oranı</span>
                    <span className="font-semibold">%2.1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}