import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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
  MapPin
} from "lucide-react";

export default function Landing() {
  const { toast } = useToast();
  const [liveJobs, setLiveJobs] = useState([
    { id: 1, type: "Etiket Baskısı", location: "İstanbul", status: "Teklif aşamasında", time: "2 dk önce", amount: "₺2,450", quantity: "5000 adet" },
    { id: 2, type: "Kartvizit", location: "Ankara", status: "Üretimde", time: "5 dk önce", amount: "₺890", quantity: "1000 adet" },
    { id: 3, type: "Broşür", location: "İzmir", status: "Tamamlandı", time: "8 dk önce", amount: "₺3,200", quantity: "2500 adet" },
    { id: 4, type: "Sticker", location: "Bursa", status: "Teklif aşamasında", time: "12 dk önce", amount: "₺1,650", quantity: "3000 adet" },
    { id: 5, type: "Katalog", location: "Antalya", status: "Üretimde", time: "15 dk önce", amount: "₺5,800", quantity: "500 adet" },
    { id: 6, type: "Poster Baskı", location: "Adana", status: "Teklif aşamasında", time: "18 dk önce", amount: "₺1,200", quantity: "200 adet" },
    { id: 7, type: "Mağnet", location: "Kocaeli", status: "Üretimde", time: "22 dk önce", amount: "₺780", quantity: "1500 adet" }
  ]);

  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [selectedRole, setSelectedRole] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Canlı iş takibi animasyonu ve otomatik yeni iş ekleme
  useEffect(() => {
    const animationInterval = setInterval(() => {
      setCurrentJobIndex((prev) => (prev + 1) % liveJobs.length);
    }, 3000);

    // Her 10 dakikada bir yeni iş ekle
    const newJobInterval = setInterval(() => {
      const jobTypes = ["Etiket Baskısı", "Kartvizit", "Broşür", "Sticker", "Katalog", "Poster", "Mağnet", "Afiş", "Banner", "Kutu"];
      const locations = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Adana", "Kocaeli", "Gaziantep", "Konya", "Mersin"];
      const statuses = ["Teklif aşamasında", "Üretimde", "Tamamlandı"];

      const newJob = {
        id: Date.now(),
        type: jobTypes[Math.floor(Math.random() * jobTypes.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        time: "Az önce",
        amount: `₺${(Math.random() * 5000 + 500).toFixed(0)}`,
        quantity: `${Math.floor(Math.random() * 5000 + 100)} adet`
      };

      setLiveJobs(prev => [newJob, ...prev.slice(0, 9)]); // Son 10 işi tut
    }, 600000); // 10 dakika = 600000ms

    return () => {
      clearInterval(animationInterval);
      clearInterval(newJobInterval);
    };
  }, [liveJobs.length]);

  const handleRoleSelection = (role: string) => {
    setSelectedRole(role);
    setShowRoleSelection(true);
  };

  const handleLogin = () => {
    window.location.href = '/api/login';
  };

  const handleDirectLogin = (role: string) => {
    console.log(`Direct login attempt for role: ${role}`);
    
    // Rol parametresi ile giriş yap - otomatik doğru panele yönlendirecek
    window.location.href = `/api/login?role=${role}`;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header with enhanced dropdown */}
      <header className="relative z-10 bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">Matbixx</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#avantajlar" className="text-white/80 hover:text-white transition-colors">
                Avantajlar
              </a>
              <a href="#canlı-takip" className="text-white/80 hover:text-white transition-colors">
                Canlı Takip
              </a>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <LogIn className="h-4 w-4" />
                    Giriş Yap
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-black/90 border-white/20 text-white">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium text-white">Giriş Seçenekleri</p>
                  </div>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem 
                    onClick={() => handleDirectLogin('customer')}
                    className="text-white hover:bg-white/10"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Müşteri Girişi
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDirectLogin('printer')}
                    className="text-white hover:bg-white/10"
                  >
                    <Building2 className="mr-2 h-4 w-4" />
                    Firma Girişi
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleDirectLogin('admin')}
                    className="text-white hover:bg-white/10"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Admin Girişi
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/20" />
                  <DropdownMenuItem 
                    onClick={handleGoHome}
                    className="text-white hover:bg-white/10"
                  >
                    <Home className="mr-2 h-4 w-4" />
                    Anasayfaya Dön
                  </DropdownMenuItem>
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
                <a href="#avantajlar" className="text-white/80 hover:text-white transition-colors px-2">
                  Avantajlar
                </a>
                <a href="#canlı-takip" className="text-white/80 hover:text-white transition-colors px-2">
                  Canlı Takip
                </a>
                <div className="border-t border-white/10 my-2"></div>
                <Button 
                  variant="outline" 
                  onClick={() => handleDirectLogin('customer')}
                  className="mx-2 justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <User className="mr-2 h-4 w-4" />
                  Müşteri Girişi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDirectLogin('printer')}
                  className="mx-2 justify-start bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  Firma Girişi
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => handleDirectLogin('admin')}
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
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Türkiye'nin En Gelişmiş
              <span className="block bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                B2B Matbaa Platformu
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
              AI destekli tasarım analizi, otomatik fiyatlandırma ve güvenli ödeme sistemi
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                onClick={() => handleDirectLogin('customer')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3"
              >
                <User className="mr-2 h-5 w-5" />
                Müşteri Girişi
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => handleDirectLogin('printer')}
                className="border-white/30 text-white hover:bg-white/10 px-8 py-3"
              >
                <Building2 className="mr-2 h-5 w-5" />
                Firma Girişi
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">50+</div>
                <div className="text-gray-400">Aktif Matbaacı</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">1000+</div>
                <div className="text-gray-400">Mutlu Müşteri</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">15K+</div>
                <div className="text-gray-400">Tamamlanan Proje</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-400">99%</div>
                <div className="text-gray-400">Memnuniyet Oranı</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Canlı İş Takibi */}
      <section id="canlı-takip" className="py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              🔴 Canlı İş Takibi
            </h2>
            <p className="text-xl text-gray-300">
              Platformda gerçek zamanlı olarak devam eden işler
            </p>
          </div>

          <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-white/10">
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
                  className={`p-4 rounded-lg border transition-all duration-500 ${
                    index === currentJobIndex % 4 
                      ? 'bg-blue-500/20 border-blue-500/50 transform scale-105' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <FileText className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="text-white font-medium">{job.type}</div>
                        <div className="text-gray-400 text-sm">{job.location}</div>
                        <div className="text-blue-300 text-xs">{job.quantity}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-lg">{job.amount}</div>
                      <div className={`text-sm font-medium ${
                        job.status === 'Tamamlandı' ? 'text-green-400' :
                        job.status === 'Üretimde' ? 'text-blue-400' : 'text-yellow-400'
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
            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">₺{(liveJobs.reduce((sum, job) => sum + parseInt(job.amount.replace('₺', '').replace(',', '')), 0)).toLocaleString()}</div>
                <div className="text-gray-400 text-sm">Günlük Hacim</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{liveJobs.filter(job => job.status === 'Üretimde').length}</div>
                <div className="text-gray-400 text-sm">Üretimde</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{liveJobs.filter(job => job.status === 'Teklif aşamasında').length}</div>
                <div className="text-gray-400 text-sm">Teklif Bekleyen</div>
              </div>
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">{liveJobs.filter(job => job.status === 'Tamamlandı').length}</div>
                <div className="text-gray-400 text-sm">Tamamlanan</div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Customer Advantages */}
      <section id="avantajlar" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Müşteriler İçin Avantajlar
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
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
      <section className="py-20 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Matbaacılar İçin Avantajlar
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
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
      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Hemen Başlayın!
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Ücretsiz hesap oluşturun ve Türkiye'nin en gelişmiş B2B matbaa platformunun avantajlarından yararlanın
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => handleDirectLogin('customer')}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3"
            >
              <User className="mr-2 h-5 w-5" />
              Müşteri Kaydı
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              onClick={() => handleDirectLogin('printer')}
              className="border-white/30 text-white hover:bg-white/10 px-8 py-3"
            >
              <Building2 className="mr-2 h-5 w-5" />
              Firma Kaydı
            </Button>
          </div>
        </div>
      </section>
      {/* Corporate Sections */}
      <section className="py-16 bg-white/5 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">

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
      {/* Role Selection Modal */}
      <Dialog open={showRoleSelection} onOpenChange={setShowRoleSelection}>
        <DialogContent className="sm:max-w-md bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              {selectedRole === 'customer' && <User className="h-5 w-5" />}
              {selectedRole === 'printer' && <Building2 className="h-5 w-5" />}
              {selectedRole === 'admin' && <Crown className="h-5 w-5" />}
              {selectedRole === 'customer' && 'Müşteri Girişi'}
              {selectedRole === 'printer' && 'Matbaacı Girişi'}
              {selectedRole === 'admin' && 'Admin Girişi'}
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {selectedRole === 'customer' && 'Müşteri hesabınızla giriş yapın ve baskı siparişlerinizi yönetin.'}
              {selectedRole === 'printer' && 'Matbaacı hesabınızla giriş yapın ve siparişlerinizi takip edin.'}
              {selectedRole === 'admin' && 'Admin hesabınızla giriş yapın ve sistemi yönetin.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
            >
              <LogIn className="mr-2 h-4 w-4" />
              Replit ile Giriş Yap
            </Button>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGoHome}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-800"
              >
                <Home className="mr-2 h-4 w-4" />
                Anasayfaya Dön
              </Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowRoleSelection(false)}
                className="flex-1 text-gray-300 hover:bg-gray-800"
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