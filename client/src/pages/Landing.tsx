import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
  ArrowRight, 
  Star, 
  Users, 
  Building2, 
  Zap, 
  Shield, 
  Clock, 
  Target, 
  TrendingUp, 
  Award,
  UserCheck,
  Crown,
  Settings,
  BarChart3,
  LogIn,
  Menu,
  X,
  User,
  FileText,
  CheckCircle,
  CreditCard,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Home,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  Truck,
  Palette,
  PrinterIcon,
  Briefcase,
  Calendar,
  MessageSquare,
  HeadphonesIcon
} from "lucide-react";

export default function Landing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState<'customer' | 'printer' | 'admin' | 'login' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Check for URL parameters on component mount
  useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const existingRole = urlParams.get('existing_role');
    
    if (error && existingRole) {
      // Show appropriate error to user
      console.warn('Registration error:', error, 'with existing role:', existingRole);
    }
  });

  const { toast } = useToast();

  const handleRoleSelection = (role: 'customer' | 'printer' | 'admin') => {
    setShowLoginForm(role);
    setIsLoginModalOpen(true);
  };

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleGoHome = () => {
    setIsLoginModalOpen(false);
    setShowLoginForm(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const features = [
    {
      icon: <Palette className="h-6 w-6" />,
      title: "Akıllı Tasarım Analizi",
      description: "AI destekli tasarım analizi ile hızlı fiyatlandırma"
    },
    {
      icon: <PrinterIcon className="h-6 w-6" />,
      title: "Çoklu Format Desteği",
      description: "PDF, SVG, EPS ve tüm yaygın tasarım formatları"
    },
    {
      icon: <CreditCard className="h-6 w-6" />,
      title: "Güvenli Ödeme",
      description: "PayTR entegrasyonu ile güvenli ödeme işlemleri"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Türkiye Geneli",
      description: "Tüm Türkiye'den matbaacılar ve müşteriler"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <PrinterIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Matbixx
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#avantajlar" className="text-gray-600 hover:text-blue-600 transition-colors">
                Avantajlar
              </a>
              <a href="#ozellikler" className="text-gray-600 hover:text-blue-600 transition-colors">
                Özellikler
              </a>
              <a href="#iletisim" className="text-gray-600 hover:text-blue-600 transition-colors">
                İletişim
              </a>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Giriş Yap
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">Giriş Seçenekleri</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleRoleSelection('customer')}>
                    <User className="mr-2 h-4 w-4" />
                    Müşteri Girişi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleSelection('printer')}>
                    <Building2 className="mr-2 h-4 w-4" />
                    Matbaacı Girişi
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleSelection('admin')}>
                    <Crown className="mr-2 h-4 w-4" />
                    Admin Girişi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogin}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Direkt Giriş
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleGoHome}>
                    <Home className="mr-2 h-4 w-4" />
                    Anasayfaya Dön
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t bg-white py-4">
              <div className="flex flex-col space-y-3">
                <a href="#avantajlar" className="text-gray-600 hover:text-blue-600 transition-colors px-2">
                  Avantajlar
                </a>
                <a href="#ozellikler" className="text-gray-600 hover:text-blue-600 transition-colors px-2">
                  Özellikler
                </a>
                <a href="#iletisim" className="text-gray-600 hover:text-blue-600 transition-colors px-2">
                  İletişim
                </a>
                <Separator />
                <Button 
                  variant="outline" 
                  onClick={() => handleRoleSelection('customer')}
                  className="mx-2 justify-start"
                >
                  <User className="mr-2 h-4 w-4" />
                  Müşteri Girişi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleRoleSelection('printer')}
                  className="mx-2 justify-start"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Matbaacı Girişi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleLogin}
                  className="mx-2 justify-start"
                >
                  <LogIn className="mr-2 h-4 w-4" />
                  Direkt Giriş
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleGoHome}
                  className="mx-2 justify-start"
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
      <section className="pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Türkiye'nin En Gelişmiş
            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              B2B Matbaa Platformu
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            AI destekli tasarım analizi, otomatik fiyatlandırma ve güvenli ödeme sistemi ile 
            müşteri ve matbaacıları bir araya getiren yenilikçi platform.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              onClick={() => handleRoleSelection('customer')}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <User className="mr-2 h-5 w-5" />
              Müşteri Olarak Başla
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => handleRoleSelection('printer')}
            >
              <Building2 className="mr-2 h-5 w-5" />
              Matbaacı Olarak Katıl
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">500+</div>
              <div className="text-gray-600">Aktif Matbaacı</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">2000+</div>
              <div className="text-gray-600">Mutlu Müşteri</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">15K+</div>
              <div className="text-gray-600">Tamamlanan Proje</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">99%</div>
              <div className="text-gray-600">Memnuniyet Oranı</div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Advantages */}
      <section id="avantajlar" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Müşteriler İçin Avantajlar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Matbixx ile baskı ihtiyaçlarınızı kolayca karşılayın, en iyi fiyatları bulun
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {customerAdvantages.map((advantage, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {advantage.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {advantage.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Printer Advantages */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Matbaacılar İçin Avantajlar
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              İşinizi büyütün, daha fazla müşteriye ulaşın ve gelirinizi artırın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {printerAdvantages.map((advantage, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300 bg-white">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-50 to-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    {advantage.icon}
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {advantage.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600">{advantage.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="ozellikler" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Platform Özellikleri
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Teknoloji ve deneyimin mükemmel birleşimi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <div className="text-white">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Hemen Başlayın!
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Ücretsiz hesap oluşturun ve Türkiye'nin en gelişmiş B2B matbaa platformunun avantajlarından yararlanın
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              onClick={() => handleRoleSelection('customer')}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <User className="mr-2 h-5 w-5" />
              Müşteri Kaydı
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => handleRoleSelection('printer')}
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Building2 className="mr-2 h-5 w-5" />
              Matbaacı Kaydı
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="iletisim" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              İletişim
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Sorularınız için bizimle iletişime geçin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">E-posta</h3>
              <p className="text-gray-600">info@matbixx.com</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Telefon</h3>
              <p className="text-gray-600">+90 (212) 555 0123</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <HeadphonesIcon className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Destek</h3>
              <p className="text-gray-600">7/24 Canlı Destek</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
                <PrinterIcon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold">Matbixx</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-400">© 2024 Matbixx. Tüm hakları saklıdır.</p>
              <p className="text-gray-400 text-sm mt-1">B2B Matbaa Platformu</p>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showLoginForm === 'customer' && <User className="h-5 w-5" />}
              {showLoginForm === 'printer' && <Building2 className="h-5 w-5" />}
              {showLoginForm === 'admin' && <Crown className="h-5 w-5" />}
              {showLoginForm === 'customer' && 'Müşteri Girişi'}
              {showLoginForm === 'printer' && 'Matbaacı Girişi'}
              {showLoginForm === 'admin' && 'Admin Girişi'}
              {!showLoginForm && 'Giriş Yap'}
            </DialogTitle>
            <DialogDescription>
              {showLoginForm === 'customer' && 'Müşteri hesabınızla giriş yapın ve baskı siparişlerinizi yönetin.'}
              {showLoginForm === 'printer' && 'Matbaacı hesabınızla giriş yapın ve siparişlerinizi takip edin.'}
              {showLoginForm === 'admin' && 'Admin hesabınızla giriş yapın ve sistemi yönetin.'}
              {!showLoginForm && 'Hesabınızla giriş yapın.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <LogIn className="mr-2 h-4 w-4" />
              )}
              Replit ile Giriş Yap
            </Button>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGoHome}
                className="flex-1"
              >
                <Home className="mr-2 h-4 w-4" />
                Anasayfaya Dön
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setIsLoginModalOpen(false)}
                className="flex-1"
              >
                İptal
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}