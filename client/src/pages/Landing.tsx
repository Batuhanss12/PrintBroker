
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, TrendingUp, Users, Clock, DollarSign, Package, Factory, Award, ChevronDown, Building2, User, Shield, Phone, Mail, MapPin, Star, Briefcase, CheckCircle, ArrowRight, BarChart3, Calendar, Zap, Globe, Target, Eye, MessageSquare, Settings, FileText, Truck, PlusCircle, Activity, Bell, Search, Filter, Download, Share2, Heart, Bookmark, ExternalLink, RefreshCw, Play } from 'lucide-react';

interface QuoteData {
  id: string;
  title: string;
  type: string;
  location: string;
  amount: string;
  status: string;
  time: string;
  estimatedBudget?: number;
  quantity?: number;
  category?: string;
}

interface LiveFeedData {
  quotes: QuoteData[];
  dailyStats: {
    totalVolume: number;
    quoteCount: number;
    targetVolume: number;
    targetQuotes: number;
    categoryDistribution: {
      corporate: number;
      industrial: number;
      packaging: number;
      event: number;
    };
  };
  lastUpdated: string;
}

const Landing: React.FC = () => {
  const [liveData, setLiveData] = useState<LiveFeedData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLoginType, setSelectedLoginType] = useState<'customer' | 'printer' | 'admin' | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', companyName: '', password: '', role: 'customer'
  });
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchLiveData = async () => {
    try {
      const response = await fetch('/api/quotes/live-feed');
      if (response.ok) {
        const data = await response.json();
        setLiveData(data);
      }
    } catch (error) {
      console.error('Live feed fetch error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowLogin = (type: 'customer' | 'printer' | 'admin') => {
    setSelectedLoginType(type);
    setShowLoginModal(true);
    setIsLoginMode(true);
    // Reset form data
    setLoginForm({ email: '', password: '' });
    setRegisterForm({
      firstName: '', lastName: '', email: '', phone: '', companyName: '', password: '', role: 'customer'
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Giriş başarısız');
      }
    } catch (error) {
      alert('Giriş sırasında hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...registerForm, role: selectedLoginType })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        }
      } else {
        const errorData = await response.json();
        alert(errorData.message || 'Kayıt başarısız');
      }
    } catch (error) {
      alert('Kayıt sırasında hata oluştu');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToRegister = (type: 'customer' | 'printer') => {
    if (type === 'customer') {
      window.location.href = '/customer-register';
    } else if (type === 'printer') {
      window.location.href = '/printer-register';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Tamamlandı': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'Üretimde': return <Activity className="w-4 h-4 text-blue-500" />;
      case 'Kalite Kontrolde': return <Eye className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Tamamlandı': return 'bg-green-100 text-green-800';
      case 'Üretimde': return 'bg-blue-100 text-blue-800';
      case 'Kalite Kontrolde': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: string | number) => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount.replace(/[^\d.-]/g, '')) : amount;
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numAmount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('tr-TR').format(num);
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Navigation Header */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-blue-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                MATBIXX
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center space-x-2 hover:bg-blue-50">
                    <User className="w-4 h-4" />
                    <span>Panel Giriş</span>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 p-2">
                  <DropdownMenuItem 
                    className="px-6 py-4 cursor-pointer hover:bg-blue-50 border-b border-gray-50" 
                    onClick={() => handleShowLogin('customer')}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Müşteri Paneli</div>
                        <div className="text-sm text-gray-500">Teklif al, siparişleri takip et</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="px-6 py-4 cursor-pointer hover:bg-orange-50 border-b border-gray-50" 
                    onClick={() => handleShowLogin('printer')}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-4">
                        <Factory className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Matbaa Paneli</div>
                        <div className="text-sm text-gray-500">Teklifleri görüntüle, üretim yap</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="px-6 py-4 cursor-pointer hover:bg-purple-50" 
                    onClick={() => handleShowLogin('admin')}
                  >
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                        <Shield className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">Yönetici Paneli</div>
                        <div className="text-sm text-gray-500">Sistem yönetimi ve kontrol</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Türkiye'nin En Büyük<br />
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                Baskı Ekosistemi
              </span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-blue-100">
              Günlük 200-300 bin TL iş hacmi, 50-100 teklif ve binlerce matbaa firması ile Türkiye'nin en büyük baskı ağı
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-blue-50 text-lg px-8 py-4"
                onClick={() => handleShowLogin('customer')}
              >
                <PlusCircle className="w-5 h-5 mr-2" />
                Hemen Teklif Al
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white/10 text-lg px-8 py-4"
                onClick={() => window.location.href = '/products'}
              >
                <Eye className="w-5 h-5 mr-2" />
                Nasıl Çalışır?
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Live Statistics Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Canlı İş Takibi</h2>
            <p className="text-lg text-gray-600">Gerçek zamanlı iş hacmi ve projeler</p>
          </div>

          {liveData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Günlük Hacim</p>
                      <p className="text-3xl font-bold">{formatCurrency(liveData.dailyStats.totalVolume)}</p>
                      <Progress 
                        value={calculateProgress(liveData.dailyStats.totalVolume, liveData.dailyStats.targetVolume)} 
                        className="mt-3 bg-blue-400"
                      />
                    </div>
                    <DollarSign className="w-12 h-12 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Günlük Teklifler</p>
                      <p className="text-3xl font-bold">{liveData.dailyStats.quoteCount}</p>
                      <Progress 
                        value={calculateProgress(liveData.dailyStats.quoteCount, liveData.dailyStats.targetQuotes)} 
                        className="mt-3 bg-green-400"
                      />
                    </div>
                    <FileText className="w-12 h-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Aktif Projeler</p>
                      <p className="text-3xl font-bold">{liveData.quotes.filter(q => q.status === 'Üretimde').length}</p>
                      <p className="text-purple-200 text-sm mt-1">Devam eden üretimler</p>
                    </div>
                    <Activity className="w-12 h-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Tamamlanan</p>
                      <p className="text-3xl font-bold">{liveData.quotes.filter(q => q.status === 'Tamamlandı').length}</p>
                      <p className="text-orange-200 text-sm mt-1">Bu hafta</p>
                    </div>
                    <CheckCircle className="w-12 h-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Live Feed */}
          <Card className="mb-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-500" />
                Canlı İş Akışı
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">Canlı</Badge>
              </CardTitle>
              <Button size="sm" variant="outline" onClick={fetchLiveData}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Yenile
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2">Canlı veriler yükleniyor...</span>
                </div>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {liveData?.quotes?.map((quote, index) => (
                    <div key={quote.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(quote.status)}
                          <span className="font-medium text-gray-900">{quote.title}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {quote.type}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-sm text-gray-500 flex items-center">
                          <MapPin className="w-3 h-3 mr-1" />
                          {quote.location}
                        </span>
                        <Badge className={`${getStatusColor(quote.status)} text-xs`}>
                          {quote.status}
                        </Badge>
                        <span className="font-bold text-green-600">{quote.amount}</span>
                        <span className="text-xs text-gray-400">{quote.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Login Modal */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center">
              {selectedLoginType === 'customer' && '👤 Müşteri Girişi'}
              {selectedLoginType === 'printer' && '🏭 Matbaa Girişi'}
              {selectedLoginType === 'admin' && '👑 Yönetici Girişi'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={isLoginMode ? 'login' : 'register'} onValueChange={(value) => setIsLoginMode(value === 'login')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Giriş Yap</TabsTrigger>
              <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    placeholder="email@example.com"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="password">Şifre</Label>
                  <Input
                    id="password"
                    type="password"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    placeholder="••••••••"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </Button>
                <div className="text-xs text-gray-500 text-center space-y-1">
                  <p className="font-medium">Demo Hesapları:</p>
                  <p>Müşteri: customer@test.com / demo123</p>
                  <p>Matbaa: printer@test.com / demo123</p>
                  <p>Admin: admin@test.com / demo123</p>
                </div>
              </form>
            </TabsContent>
            
            <TabsContent value="register">
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Kayıt olmak için uygun paketi seçin ve detaylı kayıt sayfasına yönlendirileceksiniz.
                  </p>
                </div>
                
                {selectedLoginType === 'customer' && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => handleGoToRegister('customer')}
                  >
                    <User className="w-4 h-4 mr-2" />
                    Müşteri Kaydı (35₺/tasarım)
                  </Button>
                )}
                
                {selectedLoginType === 'printer' && (
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => handleGoToRegister('printer')}
                  >
                    <Factory className="w-4 h-4 mr-2" />
                    Matbaa Kaydı (2999₺/ay)
                  </Button>
                )}
                
                {selectedLoginType === 'admin' && (
                  <div className="text-center text-gray-500">
                    Admin hesapları sistem yöneticisi tarafından oluşturulur.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Landing;
