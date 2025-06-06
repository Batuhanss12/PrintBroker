import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  CheckCircle, 
  Clock, 
  FileText, 
  Users, 
  Building2, 
  BarChart3, 
  Star, 
  ArrowRight,
  LogIn,
  User,
  Crown,
  Home,
  Target,
  DollarSign,
  Truck,
  Shield,
  MessageSquare,
  TrendingUp,
  Award,
  Menu,
  X,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
  Zap,
  CheckCircle2,
  Shirt,
  Package,
  CreditCard,
  Brain
} from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const [liveJobs, setLiveJobs] = useState<any[]>([]);

  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [loginRole, setLoginRole] = useState<'customer' | 'printer' | 'admin'>('customer');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Canlı iş takibi - hem gerçek sistem verileri hem otomatik mock veriler
  useEffect(() => {
    const fetchLiveJobs = async () => {
      try {
        const response = await fetch('/api/quotes/live-feed');
        if (response.ok) {
          const data = await response.json();
          setLiveJobs(data.quotes || []);
          console.log(`🔴 Canlı takip güncellendi: ${data.totalReal} gerçek + ${data.totalMock} otomatik iş`);
        }
      } catch (error) {
        console.error('Live jobs fetch error:', error);
        // Hata durumunda fallback mock veriler
        const fallbackJobs = [
          {
            id: 'fallback_1',
            title: 'Etiket Baskı Sistemi',
            type: 'Etiket',
            location: 'İstanbul',
            amount: '₺1,250',
            status: 'Üretimde',
            time: '15 dk önce',
            estimatedBudget: 1250,
            isGenerated: true
          },
          {
            id: 'fallback_2',
            title: 'Kartvizit Tasarım',
            type: 'Kartvizit',
            location: 'Ankara',
            amount: '₺680',
            status: 'Teklif aşamasında',
            time: '28 dk önce',
            estimatedBudget: 680,
            isGenerated: true
          }
        ];
        setLiveJobs(fallbackJobs);
      }
    };

    // İlk yükleme
    fetchLiveJobs();

    // Her 30 saniyede bir güncelle (gerçek veriler için)
    const refreshInterval = setInterval(fetchLiveJobs, 30000);

    // Her 5 dakikada bir mock veriler değişir (otomatik)
    const mockUpdateInterval = setInterval(fetchLiveJobs, 5 * 60 * 1000);

    // Animasyon için index güncelleme
    const animationInterval = setInterval(() => {
      setCurrentJobIndex((prev) => liveJobs.length > 0 ? (prev + 1) % liveJobs.length : 0);
    }, 3000);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(mockUpdateInterval);
      clearInterval(animationInterval);
    };
  }, [liveJobs.length]);

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
    setShowRoleSelection(true);
  };

  const handleShowLogin = (role: 'customer' | 'printer' | 'admin') => {
    setLoginRole(role);
    setShowLoginForm(true);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      toast({
        title: "Hata",
        description: "Email ve şifre gerekli",
        variant: "destructive"
      });
      return;
    }

    setLoginLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: loginForm.email,
          password: loginForm.password
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Başarılı",
          description: "Giriş yapıldı, yönlendiriliyorsunuz...",
        });

        // Redirect based on user role
        const redirectUrls = {
          customer: '/customer-dashboard',
          printer: '/printer-dashboard',
          admin: '/admin-dashboard'
        };

        window.location.href = redirectUrls[result.user.role] || '/customer-dashboard';
      } else {
        toast({
          title: "Giriş Hatası",
          description: result.message || "Email veya şifre hatalı",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Bağlantı Hatası",
        description: "Sunucuya bağlanılamadı",
        variant: "destructive"
      });
    }
    setLoginLoading(false);
  };

  const handleGoHome = () => {
    setShowRoleSelection(false);
    setSelectedRole('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const currentJob = liveJobs[currentJobIndex];

  // Müşteri avantajları
  const customerAdvantages = [
    {
      icon: <Target className="h-8 w-8 text-blue-600" />,
      title: "Kolay Teklif Alma",
      description: "Tasarımınızı yükleyin, anında çoklu matbaacıdan teklif alın"
    },
    {
      icon: <DollarSign className="h-8 w-8 text-green-600" />,
      title: "En İyi Fiyat",
      description: "Rekabetçi fiyatlarla bütçenize uygun seçenekler bulun"
    },
    {
      icon: <Truck className="h-8 w-8 text-purple-600" />,
      title: "Hızlı Teslimat",
      description: "Express teslimat seçenekleri ile hızlı sonuç alın"
    },
    {
      icon: <Shield className="h-8 w-8 text-orange-600" />,
      title: "Güvenli Ödeme",
      description: "SSL sertifikalı güvenli ödeme sistemi ile koruma"
    },
    {
      icon: <CheckCircle className="h-8 w-8 text-emerald-600" />,
      title: "Kalite Garantisi",
      description: "Profesyonel matbaacılardan kaliteli baskı garantisi"
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-indigo-600" />,
      title: "7/24 Destek",
      description: "Anlık mesajlaşma ile sürekli müşteri desteği"
    }
  ];

  // Matbaacı avantajları
  const printerAdvantages = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Geniş Müşteri Ağı",
      description: "Binlerce potansiyel müşteriye kolayca ulaşın"
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-green-600" />,
      title: "Artan Gelir",
      description: "Kapasite doluluk oranınızı artırın, daha fazla kazanın"
    },
    {
      icon: <Clock className="h-8 w-8 text-purple-600" />,
      title: "Zaman Tasarrufu",
      description: "Otomatik sipariş yönetimi ile vakit kazanın"
    },
    {
      icon: <FileText className="h-8 w-8 text-orange-600" />,
      title: "Otomatik Sözleşme",
      description: "Yasal güvence için otomatik sözleşme oluşturma"
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-emerald-600" />,
      title: "Detaylı Raporlar",
      description: "İş analitiği ve performans raporları"
    },
    {
      icon: <Award className="h-8 w-8 text-indigo-600" />,
      title: "Marka Bilinirliği",
      description: "Platformda güvenilir matbaacı olarak öne çıkın"
    }
  ];

  const handleShowLoginForm = (role: 'customer' | 'printer' | 'admin') => {
    setLoginRole(role);
    setShowLoginForm(true);
  };

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with enhanced dropdown */}
      <header className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold text-white truncate">Matbixx</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/products" className="text-white/80 hover:text-white transition-colors">
                Ürünler
              </Link>
              <Link href="/references" className="text-white/80 hover:text-white transition-colors">
                Referanslar
              </Link>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border border-blue-500/30 text-white font-semibold px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur-sm">
                    <Building2 className="h-4 w-4" />
                    Hesap Girişi
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-sm border border-gray-200 shadow-xl rounded-lg">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">Platformumuza Giriş Yapın</p>
                    <p className="text-xs text-gray-600 mt-1">Hesap türünüzü seçerek devam edin</p>
                  </div>
                  <DropdownMenuItem 
                    onClick={() => handleShowLogin('customer')}
                    className="text-gray-700 hover:bg-blue-50 px-4 py-3 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Müşteri Girişi</div>
                        <div className="text-xs text-gray-500">Baskı ihtiyaçlarınız için</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleShowLogin('printer')}
                    className="text-gray-700 hover:bg-orange-50 px-4 py-3 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <Building2 className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Matbaa Girişi</div>
                        <div className="text-xs text-gray-500">İşlerinizi yönetin</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleShowLogin('admin')}
                    className="text-gray-700 hover:bg-purple-50 px-4 py-3 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                        <Crown className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">Yönetici Girişi</div>
                        <div className="text-xs text-gray-500">Platform yönetimi</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-100" />
                  <div className="px-4 py-2">
                    <p className="text-xs text-gray-500">
                      Hesabınız yok mu? 
                      <a href="/customer-register" className="text-blue-600 hover:text-blue-700 font-medium ml-1">
                        Kayıt Olun
                      </a>
                    </p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-black/20 py-4">
              <div className="flex flex-col space-y-3">
                <Link href="/products" className="text-white/80 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
                  Ürünler
                </Link>
                <Link href="/references" className="text-white/80 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
                  Referanslar
                </Link>
                <a href="#avantajlar" className="text-white/80 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
                  Avantajlar
                </a>
                <a href="#canlı-takip" className="text-white/80 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-white/10">
                  Canlı Takip
                </a>
                <div className="border-t border-white/10 my-2 mx-4"></div>
                <Button 
                  variant="outline" 
                  onClick={() => handleShowLogin('customer')}
                  className="mx-2 justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <User className="mr-2 h-4 w-4" />
                  Müşteri Girişi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleShowLogin('printer')}
                  className="mx-2 justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Firma Girişi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleShowLogin('admin')}
                  className="mx-2 justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Admin Girişi
                </Button>

                <Button 
                  variant="ghost" 
                  onClick={handleGoHome}
                  className="mx-2 justify-start text-white hover:bg-white/10"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Anasayfaya Dön
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        {/* Modern geometric background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%239C92AC" fill-opacity="0.05"%3E%3Cpath d="m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-20"></div>
        </div>

        {/* Floating elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse animation-delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-5 animate-pulse animation-delay-4000"></div>
        </div>

        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
          {/* Logo/Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 rounded-2xl flex items-center justify-center shadow-2xl">
                <Printer className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-400 to-purple-500 rounded-3xl blur opacity-30 animate-pulse"></div>
            </div>
          </div>

          {/* Main headline */}
          <div className="space-y-6 mb-8">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight">
              <span className="block text-white mb-2">MatBixx</span>
              <span className="block bg-gradient-to-r from-blue-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
                Professional
              </span>
            </h1>

            <p className="text-xl sm:text-2xl md:text-3xl text-blue-100 font-light leading-relaxed max-w-4xl mx-auto">
              Türkiye'nin en gelişmiş <span className="font-semibold text-blue-300">AI destekli</span> baskı platformu
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Brain className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">AI Analiz</h3>
              <p className="text-blue-100 text-sm">Otomatik tasarım optimizasyonu</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Zap className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Hızlı İşlem</h3>
              <p className="text-blue-100 text-sm">Anında fiyat hesaplama</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <Shield className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="font-semibold text-lg mb-2">Güvenli Ödeme</h3>
              <p className="text-blue-100 text-sm">256-bit SSL şifreleme</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 px-4">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/customer-register'}
                className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-lg font-semibold"
              >
                <User className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                Müşteri Olarak Başla
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/printer-register'}
                className="group bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white border-0 px-8 py-4 rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 text-lg font-semibold"
              >
                <Building2 className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
                Matbaacı Kaydı
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>
        </div>
      </section>
      {/* Canlı İş Takibi */}
      <section id="canlı-takip" className="py-12 sm:py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              🔴 Canlı İş Takibi
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 px-4 mb-2">
              Platformda gerçek zamanlı olarak devam eden işler
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Canlı sistem verileri</span>
            </div>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 sm:p-6 lg:p-8 border border-white/10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Anlık Güncelleme</span>
              </div>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Aktif: {liveJobs.length} İş
              </Badge>
            </div>

            <div className="space-y-4">
              {liveJobs.slice(0, 4).map((job, index) => (
                <div 
                  key={job.id}
                  className={`p-3 sm:p-4 rounded-lg border transition-all duration-500 ${
                    index === currentJobIndex % 4 
                      ? 'bg-blue-500/20 border-blue-500/50 transform scale-[1.02] sm:scale-105' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        job.isGenerated 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}>
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-white font-medium text-sm sm:text-base truncate">
                            {job.title || job.type}
                          </div>

                        </div>
                        <div className="text-gray-400 text-xs sm:text-sm">{job.location || 'Türkiye'}</div>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-green-400 font-bold text-sm sm:text-lg">{job.amount}</div>
                      <div className={`text-xs sm:text-sm font-medium ${
                        job.status === 'Tamamlandı' ? 'text-green-400' :
                        job.status === 'Üretimde' ? 'text-blue-400' : 
                        job.status === 'Kalite Kontrolde' ? 'text-purple-400' : 'text-yellow-400'
                      }`}>
                        {job.status}
                      </div>
                      <div className="text-gray-500 text-xs">{job.time}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Günlük İstatistikler */}
            <div className="mt-6 sm:mt-8 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-green-400 truncate">
                  ₺{(() => {
                    // Gerçek teklif tutarlarını hesapla
                    const realTotal = liveJobs.filter(job => !job.isGenerated).reduce((sum, job) => {
                      const amount = job.estimatedBudget || parseFloat((job.amount || '0').replace(/[₺,]/g, '')) || 0;
                      return sum + (typeof amount === 'number' ? amount : 0);
                    }, 0);

                    // Mock tutarları hesapla
                    const mockTotal = liveJobs.filter(job => job.isGenerated).reduce((sum, job) => {
                      const amount = job.estimatedBudget || parseFloat((job.amount || '0').replace(/[₺,]/g, '')) || 0;
                      return sum + (typeof amount === 'number' ? amount : 0);
                    }, 0);

                    // Toplam tutarı 200-300k arasında tut
                    let totalAmount = realTotal + mockTotal;

                    // Eğer toplam 200k'dan azsa, ek mock tutar ekle
                    if (totalAmount < 200000) {
                      totalAmount += (200000 - totalAmount) + (Math.random() * 100000);
                    }

                    // Eğer toplam 300k'dan fazlaysa, 250-300k arasına çek
                    if (totalAmount > 300000) {
                      totalAmount = 250000 + (Math.random() * 50000);
                    }

                    return Math.round(totalAmount).toLocaleString();
                  })()}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">Günlük Hacim</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-blue-400">
                  {liveJobs.filter(job => job.status === 'in_progress' || job.status === 'Üretimde').length}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">Üretimde</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-yellow-400">
                  {liveJobs.filter(job => job.status === 'pending' || job.status === 'received_quotes' || job.status === 'Teklif aşamasında').length}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">Teklif Bekleyen</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-3 sm:p-4 text-center">
                <div className="text-lg sm:text-2xl font-bold text-purple-400">
                  {liveJobs.filter(job => job.status === 'completed' || job.status === 'approved' || job.status === 'Tamamlandı' || job.status === 'Kalite Kontrolde').length}
                </div>
                <div className="text-gray-400 text-xs sm:text-sm">Tamamlanan</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Customer Advantages */}
      <section id="avantajlar" className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Müşteriler İçin Avantajlar
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              Matbixx ile baskı ihtiyaçlarınızı kolayca karşılayın, en iyi fiyatları bulun
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customerAdvantages.map((advantage, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {advantage.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-white">
                    {advantage.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-300">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Printer Advantages */}
      <section className="py-12 sm:py-16 lg:py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
              Matbaacılar İçin Avantajlar
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              İşinizi büyütün, daha fazla müşteriye ulaşın ve gelirinizi artırın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {printerAdvantages.map((advantage, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 group">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    {advantage.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-white">
                    {advantage.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-300">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* Membership Plans & CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6">
              Üyelik Paketlerimiz
            </h2>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto px-4">
              İhtiyacınıza uygun paketi seçin ve Türkiye'nin en gelişmiş B2B matbaa platformunun avantajlarından yararlanın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 mb-12 sm:mb-16">
            {/* Müşteri Paketi */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 relative">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-8 w-8 text-blue-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  Müşteri Paketi
                </CardTitle>
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  Kredili Sistem
                </div>
                <p className="text-gray-300 text-sm">Kullandığın kadar öde</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {[
                    'Sınırsız teklif alma',
                    'AI destekli tasarım (35₺/tasarım)',
                    '100MB dosya yükleme',
                    'Gerçek zamanlı sipariş takibi',
                    '7/24 canlı destek',
                    'Güvenli ödeme sistemi'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => window.location.href = '/customer-register'}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                >
                  <User className="mr-2 h-4 w-4" />
                  Müşteri Kaydı
                </Button>
              </CardFooter>
            </Card>

            {/* Firma Paketi */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all duration-300 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-3 py-1 text-xs font-semibold">
                  EN POPÜLER
                </Badge>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-8 w-8 text-orange-400" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mb-2">
                  Firma Paketi
                </CardTitle>
                <div className="text-3xl font-bold text-orange-400 mb-2">
                  ₺2.999<span className="text-lg text-gray-400">/ay</span>
                </div>
                <p className="text-gray-300 text-sm">Premium işletme sistemi</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  {[
                    'Geniş müşteri ağına erişim',
                    'Gelişmiş analitik dashboard',
                    'Otomatik sipariş yönetimi',
                    'Müşteri CRM entegrasyonu',
                    'Premium öncelikli destek',
                    'Öncelikli liste görünürlüğü'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center text-sm text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-400 mr-2 flex-shrink-0" />
                      {feature}
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => handleShowLogin('printer')}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Firma Girişi
                </Button>
              </CardFooter>
            </Card>


          </div>

          {/* Quick Start CTA */}
          <div className="text-center px-4">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
              Hemen Başlayın!
            </h3>
            <p className="text-base sm:text-lg text-gray-300 mb-4 sm:mb-6 max-w-2xl mx-auto">
              Demo hesaplarla sistemi test edin veya hemen kayıt olun
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center max-w-md sm:max-w-none mx-auto">
              <Button 
                size="lg" 
                onClick={() => window.location.href = '/customer-register'}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 sm:px-8 py-3 w-full sm:w-auto"
              >
                <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Müşteri Kaydı
              </Button>
              <Button 
                size="lg" 
                onClick={() => handleShowLogin('printer')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6 sm:px-8 py-3 w-full sm:w-auto"
              >
                <Building2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                Firma Demo
              </Button>
            </div>
          </div>
        </div>
      </section>
      {/* Quick Categories */}
      <section className="py-12 sm:py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Popüler Baskı Çözümleri
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              En çok tercih edilen ürün kategorileri ve hizmetlerimiz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer border border-white/10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                  <FileText className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Etiket & Sticker</h3>
              </div>
              <p className="text-gray-300 text-sm mb-3">Ürün etiketleri, marka çıkartmaları ve özel tasarım stickerlar</p>
              <div className="text-green-400 text-sm font-medium">0.10₺ - 5.00₺</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer border border-white/10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mr-4">
                  <CreditCard className="h-6 w-6 text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Kartvizit & Katalog</h3>
              </div>
              <p className="text-gray-300 text-sm mb-3">Profesyonel kartvizitler, kataloglar ve kurumsal materyaller</p>
              <div className="text-green-400 text-sm font-medium">0.50₺ - 15.00₺</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer border border-white/10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mr-4">
                  <Package className="h-6 w-6 text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Ambalaj & Poşet</h3>
              </div>
              <p className="text-gray-300 text-sm mb-3">Özel tasarım ambalajlar, plastik ve kağıt poşetler</p>
              <div className="text-green-400 text-sm font-medium">0.25₺ - 8.00₺</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer border border-white/10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mr-4">
                  <Target className="h-6 w-6 text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Tabela & Banner</h3>
              </div>
              <p className="text-gray-300 text-sm mb-3">Dış mekan tabelaları, reklam bannerları ve dijital baskılar</p>
              <div className="text-green-400 text-sm font-medium">25.00₺ - 500.00₺</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer border border-white/10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mr-4">
                  <Shirt className="h-6 w-6 text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Tekstil Baskı</h3>
              </div>
              <p className="text-gray-300 text-sm mb-3">T-shirt, hoodie, çanta ve tekstil ürünlerinde özel baskılar</p>
              <div className="text-green-400 text-sm font-medium">15.00₺ - 75.00₺</div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/15 transition-all duration-300 cursor-pointer border border-white/10">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center mr-4">
                  <Star className="h-6 w-6 text-yellow-400" />
                </div>
                <h3 className="text-xl font-semibold text-white">Özel Projeler</h3>
              </div>
              <p className="text-gray-300 text-sm mb-3">Büyük hacimli işler ve özelleştirilmiş üretim çözümleri</p>
              <div className="text-green-400 text-sm font-medium">Teklif alın</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/products">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3">
                <ArrowRight className="mr-2 h-5 w-5" />
                Tüm Kategorileri Gör
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Service Features */}
      <section className="py-12 sm:py-16 bg-gradient-to-r from-blue-900/20 to-purple-900/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Neden Matbixx?
            </h2>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Sektördeki deneyimimiz ve teknolojik altyapımızla size en iyi hizmeti sunuyoruz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Kalite Garantisi</h3>
              <p className="text-gray-300 text-sm">ISO sertifikalı üretim ve %100 kalite kontrolü</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Hızlı Teslimat</h3>
              <p className="text-gray-300 text-sm">24-48 saat içinde kapınızda</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Özel Tasarım</h3>
              <p className="text-gray-300 text-sm">Uzman tasarım ekibi desteği</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-orange-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Esnek Ödeme</h3>
              <p className="text-gray-300 text-sm">Taksit seçenekleri ve kurumsal anlaşmalar</p>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Sections */}
      <section className="py-12 sm:py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">

            {/* Bize Ulaşın */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-6">Bize Ulaşın</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <Mail className="h-5 w-5 text-blue-400" />
                  <span className="text-gray-300">info@matbixx.com</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <Phone className="h-5 w-5 text-green-400" />
                  <span className="text-gray-300">+90 (212) 555 0123</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <MapPin className="h-5 w-5 text-red-400" />
                  <span className="text-gray-300">İstanbul, Türkiye</span>
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <MessageSquare className="h-5 w-5 text-purple-400" />
                  <span className="text-gray-300">7/24 Canlı Destek</span>
                </div>
              </div>
            </div>

            {/* Kariyer */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-6">Kariyer</h3>
              <div className="space-y-4 text-gray-300">
                <p className="leading-relaxed">
                  Türkiye'nin en hızlı büyüyen B2B matbaa platformunda kariyer fırsatları keşfedin.
                </p>
                <div className="space-y-2">
                  <div className="text-sm">• Yazılım Geliştirici</div>
                  <div className="text-sm">• Satış Temsilcisi</div>
                  <div className="text-sm">• Müşteri Hizmetleri</div>
                  <div className="text-sm">• Grafik Tasarımcı</div>
                </div>
                <Button 
                  variant="outline" 
                  className="mt-4 border-white/30 text-white hover:bg-white/10"
                >
                  <User className="mr-2 h-4 w-4" />
                  CV Gönder
                </Button>
              </div>
            </div>

            {/* Kurumsal */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-white mb-6">Kurumsal</h3>
              <div className="space-y-4 text-gray-300">
                <div className="space-y-3">
                  <a href="#" className="block hover:text-white transition-colors">Hakkımızda</a>
                  <a href="#" className="block hover:text-white transition-colors">Gizlilik Politikası</a>
                  <a href="#" className="block hover:text-white transition-colors">Kullanım Koşulları</a>
                  <a href="#" className="block hover:text-white transition-colors">KVKK</a>
                  <a href="#" className="block hover:text-white transition-colors">İş Ortakları</a>
                  <a href="#" className="block hover:text-white transition-colors">Basın Kiti</a>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-400">ISO 27001 Sertifikalı</p>
                  <p className="text-sm text-gray-400">SSL Güvenlik Sertifikası</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black/30 backdrop-blur-sm border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Matbixx</span>
            </div>

            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2024 Matbixx A.Ş. Tüm hakları saklıdır.</p>
              <p className="text-gray-500 text-sm mt-1">Türkiye'nin En Güvenilir B2B Matbaa Platformu</p>
            </div>
          </div>

          {/* Social Media & Additional Info */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex space-x-6 mb-4 md:mb-0">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <Building2 className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <MessageSquare className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Instagram</span>
                  <Target className="h-5 w-5" />
                </a>
              </div>
              <div className="text-center md:text-right">
                <p className="text-xs text-gray-500">
                  Matbixx, profesyonel baskı hizmetlerinde güvenin adresi | Est. 2024
                </p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Professional Login Dialog */}
      <Dialog open={showLoginForm} onOpenChange={setShowLoginForm}>
        <DialogContent className="sm:max-w-lg bg-white border-0 shadow-2xl">
          <DialogHeader className="text-center pb-6">
            <div className="mx-auto mb-4">
              {loginRole === 'customer' && (
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-white" />
                </div>
              )}
              {loginRole === 'printer' && (
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-white" />
                </div>
              )}
              {loginRole === 'admin' && (
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <Crown className="h-8 w-8 text-white" />
                </div>
              )}
            </div>
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {loginRole === 'customer' ? 'Müşteri Paneli' : 
               loginRole === 'printer' ? 'Firma Paneli' : 'Admin Paneli'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {loginRole === 'customer' ? 'Baskı ihtiyaçlarınızı karşılayın' : 
               loginRole === 'printer' ? 'İşinizi yönetin ve büyütün' : 'Sistemi yönetin'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Membership Features Display */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-2" />
                {loginRole === 'customer' ? 'Müşteri Avantajları' : 
                 loginRole === 'printer' ? 'Firma Avantajları' : 'Admin Yetkileri'}
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {loginRole === 'customer' && [
                  'Sınırsız teklif alma',
                  'AI destekli tasarım (35₺/tasarım)',
                  '100MB dosya yükleme',
                  '7/24 canlı destek'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}

                {loginRole === 'printer' && [
                  'Geniş müşteri ağına erişim',
                  'Gelişmiş analitik dashboard',
                  'Otomatik sipariş yönetimi',
                  'Premium öncelikli destek'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}

                {loginRole === 'admin' && [
                  'Tam sistem kontrolü',
                  'Kullanıcı yönetimi',
                  'Sistem metrikleri',
                  'Gelişmiş raporlama'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center text-sm text-gray-700">
                    <CheckCircle2 className="h-3 w-3 text-green-600 mr-2 flex-shrink-0" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>

            {/* Login Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  E-posta Adresi
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="ornek@email.com"
                  className="mt-1 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Şifre
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                    className="h-11 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Demo Login Credentials */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-800 mb-2">Demo Giriş Bilgileri:</p>
                <div className="space-y-1 text-xs text-blue-700">
                  {loginRole === 'customer' && (
                    <>
                      <p>E-posta: customer@test.com</p>
                      <p>Şifre: demo123</p>
                    </>
                  )}
                  {loginRole === 'printer' && (
                    <>
                      <p>E-posta: printer@test.com</p>
                      <p>Şifre: demo123</p>
                    </>
                  )}
                  {loginRole === 'admin' && (
                    <>
                      <p>E-posta: admin@test.com</p>
                      <p>Şifre: demo123</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                type="submit" 
                className={`w-full h-12 text-base font-semibold ${
                  loginRole === 'customer' 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700' 
                    : loginRole === 'printer'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                }`}
                disabled={loginLoading}
              >
                {loginLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Giriş yapılıyor...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="h-4 w-4 mr-2" />
                    Güvenli Giriş Yap
                  </div>
                )}
              </Button>

              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowLoginForm(false)}
                disabled={loginLoading}
                className="w-full h-12 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                İptal
              </Button>
            </div>

            {/* Registration Link */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Henüz hesabınız yok mu?
              </p>
              <Button 
                type="button"
                variant="link" 
                className="p-0 h-auto text-blue-600 hover:text-blue-700 font-semibold"
                onClick={() => {
                  setShowLoginForm(false);
                  if (loginRole === 'customer') {
                    window.location.href = '/customer-register';
                  } else if (loginRole === 'printer') {
                    window.location.href = '/printer-register';
                  }
                }}
              >
                <Zap className="h-4 w-4 mr-1" />
                {loginRole === 'customer' ? 'Ücretsiz Müşteri Kaydı' : 
                 loginRole === 'printer' ? 'Firma Kaydı Oluştur' : 'Admin Hesabı'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}