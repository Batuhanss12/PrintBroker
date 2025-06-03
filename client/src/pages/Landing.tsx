import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  CreditCard,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  FileText
} from "lucide-react";

export default function Landing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 animate-gradient-slow">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-lg">M</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">Matbixx</span>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Özellikler</a>
              <a href="#pricing" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">Fiyatlar</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors">İletişim</a>
            </nav>

            {/* Desktop Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost" 
                onClick={() => setIsLoginModalOpen(true)}
                className="text-gray-700 hover:text-blue-600"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Giriş Yap
              </Button>
              <Button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Ücretsiz Başla
              </Button>
            </div>

            <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
              <DialogTrigger asChild>
                <div style={{ display: 'none' }}></div>
              </DialogTrigger>
              <DialogContent className="sm:max-w-4xl p-0 bg-gradient-to-br from-gray-50 to-blue-50">
                <DialogHeader className="p-6 pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-lg">M</span>
                      </div>
                      <div>
                        <DialogTitle className="text-2xl font-bold text-gray-900">Matbixx'e Hoş Geldiniz</DialogTitle>
                        <DialogDescription className="text-gray-600 mt-1">
                          Hesabınızla giriş yapın veya yeni hesap oluşturun
                        </DialogDescription>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 min-h-[500px]">
                  {/* Login Options */}
                  <div className="p-6 flex flex-col justify-center">
                    <div className="space-y-4">
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Hızlı Giriş</h3>
                        <p className="text-gray-600">Hesabınızı seçin ve hemen başlayın</p>
                      </div>
                      
                      <a 
                        href="/api/login" 
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 group"
                      >
                        <UserCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span>Müşteri Girişi</span>
                      </a>
                      
                      <a 
                        href="/api/login" 
                        className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 group"
                      >
                        <Building2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span>Matbaa Girişi</span>
                      </a>
                      
                      <a 
                        href="/api/login" 
                        className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 group"
                      >
                        <Crown className="h-5 w-5 group-hover:scale-110 transition-transform" />
                        <span>Admin Girişi</span>
                      </a>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span>SSL ile güvenli giriş • Kişisel verileriniz korunur</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Info Panel */}
                  <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-6 text-white flex flex-col justify-center lg:rounded-r-lg">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-2xl font-bold mb-3">Matbixx Avantajları</h3>
                        <p className="text-blue-100 mb-6">Türkiye'nin en gelişmiş B2B matbaa platformunda yer alın</p>
                      </div>
                      
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Zap className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold">AI Destekli Tasarım</h4>
                            <p className="text-sm text-blue-100">Yapay zeka ile profesyonel tasarımlar</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Clock className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Anlık Teklif Sistemi</h4>
                            <p className="text-sm text-blue-100">Dakikalar içinde fiyat teklifleri</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Shield className="h-4 w-4" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Güvenli Ödeme</h4>
                            <p className="text-sm text-blue-100">Kredi sistemi ile güvenli işlemler</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Mobile Buttons */}
            <div className="md:hidden flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setIsLoginModalOpen(true)}
                className="text-gray-700 hover:text-blue-600 px-2"
              >
                <LogIn className="h-4 w-4 mr-1" />
                Giriş
              </Button>
              
              <div className="relative z-50">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-0 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent 
                    align="end" 
                    className="w-72 bg-white/95 backdrop-blur-xl border-0 shadow-2xl rounded-2xl z-[100] overflow-hidden"
                    sideOffset={8}
                  >
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                      <h3 className="font-bold text-lg mb-1">Matbixx Premium</h3>
                      <p className="text-blue-100 text-sm">Türkiye'nin lider B2B matbaa platformu</p>
                    </div>
                    
                    <div className="p-2">
                      <DropdownMenuItem className="rounded-xl p-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 group cursor-pointer">
                        <div className="flex items-center w-full">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                            <Star className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Premium Özellikler</h4>
                            <p className="text-sm text-gray-600">AI tasarım, anlık teklif sistemi</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="rounded-xl p-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 group cursor-pointer">
                        <a href="#pricing" className="flex items-center w-full">
                          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                            <CreditCard className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Fiyat Paketleri</h4>
                            <p className="text-sm text-gray-600">Uygun fiyatlı çözümler</p>
                          </div>
                        </a>
                      </DropdownMenuItem>
                      
                      <DropdownMenuItem className="rounded-xl p-4 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 transition-all duration-300 group cursor-pointer">
                        <div className="flex items-center w-full">
                          <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                            <Zap className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900">Hızlı Başlangıç</h4>
                            <p className="text-sm text-gray-600">5 dakikada hesap açın</p>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </div>
                    
                    <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
                      <Button 
                        onClick={() => setIsLoginModalOpen(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg"
                      >
                        Hemen Ücretsiz Başla
                      </Button>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white py-16 md:py-32 overflow-hidden animate-gradient">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)] bg-[size:80px_80px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(99,102,241,0.1),transparent_50%)] bg-[size:120px_120px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Action Buttons at Top */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-12 sm:mb-16 px-4 sm:px-0">
            <Button 
              onClick={() => setIsLoginModalOpen(true)}
              size="lg" 
              className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto border-2 border-white"
            >
              <UserCheck className="mr-2 h-5 w-5 text-blue-900" />
              <span className="text-blue-900 font-bold">Müşteri Olarak Başla</span>
            </Button>
            <Button 
              onClick={() => setIsLoginModalOpen(true)}
              variant="outline" 
              size="lg" 
              className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-bold transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto bg-transparent"
            >
              <Building2 className="mr-2 h-5 w-5" />
              <span className="font-bold">Matbaa Olarak Katıl</span>
            </Button>
          </div>

          {/* Hero Content */}
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent animate-fade-in-up">
              Matbaa Sektöründe
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                Dijital Devrim
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed animate-fade-in-up-delay">
              AI destekli tasarım araçları, anlık teklif sistemi ve güvenli ödeme çözümleri ile matbaa işlemlerinizi dijitalleştirin
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="flex items-center space-x-2 text-blue-200">
                <Shield className="h-5 w-5" />
                <span>100% Güvenli Platform</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
                <Zap className="h-5 w-5" />
                <span>Anında Teklif Alma</span>
              </div>
              <div className="flex items-center space-x-2 text-blue-200">
                <Award className="h-5 w-5" />
                <span>AI Tasarım Motoru</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">500+</div>
              <div className="text-blue-200">Aktif Matbaa</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">10K+</div>
              <div className="text-blue-200">Tamamlanan İş</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">98%</div>
              <div className="text-blue-200">Müşteri Memnuniyeti</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">24/7</div>
              <div className="text-blue-200">Teknik Destek</div>
            </div>
          </div>
        </div>
      </section>

      {/* Live Work Tracking Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Canlı <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">İş Takip</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Anlık olarak platform üzerindeki işleri ve fiyatları takip edin
            </p>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold">Canlı İş Akışı</h3>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Anlık Güncelleme</span>
                </div>
              </div>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Orders */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Son Tamamlanan İşler
                  </h4>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">Kartvizit Baskısı</h5>
                          <p className="text-sm text-gray-600">Mat selofon</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">₺85</div>
                          <div className="text-xs text-gray-500">2 dakika önce</div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Building2 className="h-4 w-4 mr-1" />
                        <span>Ankara Dijital Matbaa</span>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">A4 Broşür</h5>
                          <p className="text-sm text-gray-600">Çift taraflı</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">₺245</div>
                          <div className="text-xs text-gray-500">5 dakika önce</div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Building2 className="h-4 w-4 mr-1" />
                        <span>İstanbul Print House</span>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">Etiket Baskısı</h5>
                          <p className="text-sm text-gray-600">Roll etiket • 50x30mm</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">₺180</div>
                          <div className="text-xs text-gray-500">8 dakika önce</div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Building2 className="h-4 w-4 mr-1" />
                        <span>Bursa Etiket Merkezi</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Quotes */}
                <div>
                  <h4 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                    Aktif Teklifler
                  </h4>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-r from-blue-50 to-purple-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">Katalog Baskısı</h5>
                          <p className="text-sm text-gray-600">20 sayfa • A4 boyut</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-blue-600 font-semibold">3 Teklif</div>
                          <div className="text-xs text-gray-500">En düşük ₺320</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Teklif bekleniyor</span>
                        </div>
                        <div className="text-orange-600 font-medium">2 saat kaldı</div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-r from-green-50 to-blue-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">Poster Baskısı</h5>
                          <p className="text-sm text-gray-600">A1 boyut • UV baskı</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-green-600 font-semibold">5 Teklif</div>
                          <div className="text-xs text-gray-500">En düşük ₺45</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Teklif karşılaştırması</span>
                        </div>
                        <div className="text-green-600 font-medium">Hazır</div>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-gradient-to-r from-purple-50 to-pink-50">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h5 className="font-semibold text-gray-900">Banner Baskısı</h5>
                          <p className="text-sm text-gray-600">200x100cm • Vinil</p>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-purple-600 font-semibold">7 Teklif</div>
                          <div className="text-xs text-gray-500">En düşük ₺150</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          <span>Müşteri seçim yapıyor</span>
                        </div>
                        <div className="text-blue-600 font-medium">1 gün kaldı</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">₺12,450</div>
                    <div className="text-sm text-gray-600">Bugün İşlem Hacmi</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600 mb-1">47</div>
                    <div className="text-sm text-gray-600">Tamamlanan İş</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 mb-1">23</div>
                    <div className="text-sm text-gray-600">Aktif Teklif</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600 mb-1">8 dk</div>
                    <div className="text-sm text-gray-600">Ortalama Yanıt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Herkes İçin <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Uygun Fiyat</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              İhtiyacınıza göre esnek paket seçenekleri
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Customer Plan */}
            <Card className="relative border-2 border-blue-200 shadow-xl bg-white group hover:border-blue-300 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2 text-sm font-semibold">
                  MÜŞTERİ PAKETİ
                </Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <UserCheck className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Müşteri</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  Matbaa ihtiyaçlarınız için ideal çözüm
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    Kredi Sistemi
                  </div>
                  <p className="text-gray-600">İhtiyacınız kadar ödeyin</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Sınırsız teklif alma</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">AI tasarım araçları</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Dosya yükleme (100MB)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">7/24 müşteri desteği</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Kalite garantisi</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Hemen Başla
                </Button>
              </CardFooter>
            </Card>

            {/* Printer Plan */}
            <Card className="relative border-2 border-purple-200 shadow-xl bg-white group hover:border-purple-300 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2 text-sm font-semibold">
                  MATBAA PAKETİ
                </Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Matbaa</CardTitle>
                <CardDescription className="text-gray-600 mt-2">
                  İşinizi büyütmek için profesyonel araçlar
                </CardDescription>
              </CardHeader>
              <CardContent className="px-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    ₺299<span className="text-xl text-gray-600">/ay</span>
                  </div>
                  <p className="text-gray-600">İlk ay ücretsiz deneme</p>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Sınırsız teklif verme</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Gelişmiş analitikler</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Müşteri yönetim sistemi</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">Öncelikli teknik destek</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">İş takip ve raporlama</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Ücretsiz Dene
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>



      {/* Device Compatibility Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Her Cihazda <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Mükemmel</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Masaüstü, tablet veya telefon - her platformda optimize edilmiş deneyim
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Monitor className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Masaüstü</h3>
              <p className="text-gray-600">
                Geniş ekranlarda optimize edilmiş arayüz ile tüm özelliklere kolay erişim
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Tablet className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Tablet</h3>
              <p className="text-gray-600">
                Dokunmatik ekran uyumlu tasarım ile tablet deneyimi için özelleştirilmiş
              </p>
            </div>

            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Smartphone className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Mobil</h3>
              <p className="text-gray-600">
                Hareket halindeyken bile tüm işlemlerinizi kolayca yönetebilirsiniz
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 to-blue-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">M</span>
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Matbixx</span>
              </div>
              <p className="text-gray-400 mb-4">
                Matbaa sektöründe dijital dönüşümü sağlayan yenilikçi B2B platform.
              </p>
              <div className="flex space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <Globe className="h-4 w-4" />
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Ürün</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Özellikler</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Fiyatlandırma</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">API</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Şirket</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Hakkımızda</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kariyer</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-lg font-semibold mb-4">Destek</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Yardım Merkezi</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">İletişim</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Gizlilik</a></li>
              </ul>
            </div>
          </div>
          <Separator className="my-8 bg-gray-800" />
          <div className="text-center">
            <p className="text-gray-400">
              © 2024 Matbixx. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}