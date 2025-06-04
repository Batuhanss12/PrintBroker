import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
  User,
  FileText,
  CheckCircle,
  CreditCard,
  Globe,
  Smartphone,
  Monitor,
  Tablet
} from "lucide-react";

export default function Landing() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState<'customer' | 'printer' | 'admin' | 'login' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for URL parameters on component mount
  useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const existingRole = urlParams.get('existing_role');

    if (error === 'role_mismatch' && existingRole) {
      toast({
        title: "Rol Çakışması",
        description: `Bu hesap zaten ${getRoleDisplayName(existingRole)} olarak kayıtlı. Lütfen doğru role giriş yapın.`,
        variant: "destructive",
      });
    }
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    companyName: '',
    taxNumber: ''
  });
  const { toast } = useToast();

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'customer': return 'Müşteri';
      case 'printer': return 'Matbaa';
      case 'admin': return 'Admin';
      default: return role;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Store selected role in session storage for after auth
      const selectedRole = showLoginForm || 'customer';
      sessionStorage.setItem('selectedRole', selectedRole);

      // In development, require email and password validation
      if (!formData.email || !formData.email.includes('@')) {
        toast({
          title: "Geçersiz E-posta",
          description: "Lütfen geçerli bir e-posta adresi girin",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!formData.password || formData.password.length < 6) {
        toast({
          title: "Geçersiz Şifre",
          description: "Şifre en az 6 karakter olmalıdır",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Redirect to Replit Auth login with role, email and password
      window.location.href = `/api/login?role=${selectedRole}&email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}`;
    } catch (error) {
      toast({
        title: "Giriş hatası",
        description: "Giriş işlemi başlatılamadı",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  const handleRegister = async (role: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Kayıt Başarılı",
          description: "Hesabınız oluşturuldu, yönlendiriliyorsunuz...",
        });
        setTimeout(() => {
          window.location.href = '/';
        }, 1000);
      } else {
        throw new Error(data.message || "Kayıt işlemi başarısız");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Hata",
        description: error.message || "Kayıt işlemi başarısız",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isLoginModalOpen) {
                    setIsLoginModalOpen(true);
                  }
                }}
                className="text-gray-700 hover:text-blue-600"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Giriş Yap
              </Button>

            </div>

            <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
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
                  {/* Login Form or Options */}
                  <div className="p-6 flex flex-col justify-center">
                    {!showLoginForm ? (
                      <div className="space-y-4">
                        <div className="text-center mb-6">
                          <h3 className="text-xl font-semibold text-gray-900 mb-2">Hızlı Giriş</h3>
                          <p className="text-gray-600">Hesabınızı seçin ve hemen başlayın</p>
                        </div>

                        <Button 
                          onClick={() => setShowLoginForm('customer')}
                          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 group"
                        >
                          <UserCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span>Müşteri Girişi</span>
                        </Button>

                        <Button 
                          onClick={() => setShowLoginForm('printer')}
                          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 group"
                        >
                          <Building2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span>Matbaa Girişi</span>
                        </Button>

                        <Button 
                          onClick={() => setShowLoginForm('admin')}
                          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-4 px-6 rounded-xl font-semibold text-center transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-3 group"
                        >
                          <Crown className="h-5 w-5 group-hover:scale-110 transition-transform" />
                          <span>Admin Girişi</span>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {showLoginForm === 'customer' && <UserCheck className="h-6 w-6 text-blue-600" />}
                            {showLoginForm === 'printer' && <Building2 className="h-6 w-6 text-purple-600" />}
                            {showLoginForm === 'admin' && <Crown className="h-6 w-6 text-orange-600" />}
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                {showLoginForm === 'customer' && 'Müşteri Girişi'}
                                {showLoginForm === 'printer' && 'Matbaa Girişi'}
                                {showLoginForm === 'admin' && 'Admin Girişi'}
                              </h3>
                              <p className="text-gray-600 text-sm">Hesap bilgilerinizi girin</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setShowLoginForm(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-4">
                          <div>
                            <Label htmlFor="email">E-posta</Label>
                            <Input
                              id="email"
                              type="email"
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                              placeholder="ornek@email.com"
                              required
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label htmlFor="password">Şifre</Label>
                            <Input
                              id="password"
                              type="password"
                              value={formData.password || ''}
                              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                              placeholder="Şifrenizi girin"
                              required
                              className="mt-1"
                            />
                          </div>

                          <Button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                              showLoginForm === 'customer' 
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                                : showLoginForm === 'printer'
                                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                                : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
                            }`}
                          >
                            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                          </Button>
                        </form>

                        <div className="text-center text-sm text-gray-500">
                          Hesabınız yok mu? 
                          <Button 
                            variant="link" 
                            className="text-blue-600 hover:text-blue-700 p-0 ml-1"
                            onClick={() => {
                              setIsLoginModalOpen(false);
                              setShowLoginForm(null);
                              if (showLoginForm === 'customer') {
                                window.location.href = '/customer-register';
                              } else if (showLoginForm === 'printer') {
                                window.location.href = '/printer-register';
                              }
                            }}
                          >
                            Kayıt olun
                          </Button>
                        </div>
                      </div>
                    )}

                    {!showLoginForm && (
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                          <Shield className="h-4 w-4 text-blue-600" />
                          <span>SSL ile güvenli giriş • Kişisel verileriniz korunur</span>
                        </div>
                      </div>
                    )}
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
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isLoginModalOpen) {
                            setIsLoginModalOpen(true);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl shadow-lg"
                      >
                        Giriş Yap
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
              onClick={() => window.location.href = '/customer-register'}
              size="lg" 
              className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 w-full sm:w-auto border-2 border-white"
            >
              <UserCheck className="mr-2 h-5 w-5 text-blue-900" />
              <span className="text-blue-900 font-bold">Müşteri Olarak Başla</span>
            </Button>
            <Button 
              onClick={() => window.location.href = '/printer-register'}
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = '/customer-register';
                  }}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Müşteri Olarak Başla
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
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = '/printer-register';
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Matbaa Olarak Katıl
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

      {/* Premium Registration Modal */}
      {showLoginForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="p-6 pb-2 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    {showLoginForm === 'customer' && <UserCheck className="h-6 w-6 text-white" />}
                    {showLoginForm === 'printer' && <Building2 className="h-6 w-6 text-white" />}
                    {showLoginForm === 'admin' && <Crown className="h-6 w-6 text-white" />}
                    {showLoginForm === 'login' && <LogIn className="h-6 w-6 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {showLoginForm === 'customer' && 'Müşteri Kayıt'}
                      {showLoginForm === 'printer' && 'Matbaa Kayıt'}
                      {showLoginForm === 'admin' && 'Admin Giriş'}
                      {showLoginForm === 'login' && 'Panel Girişi'}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      {showLoginForm === 'customer' && 'Matbaa hizmetlerinden yararlanmak için kaydolun'}
                      {showLoginForm === 'printer' && 'Matbaa işletmenizi platformda tanıtın'}
                      {showLoginForm === 'admin' && 'Yönetici paneline erişim sağlayın'}
                      {showLoginForm === 'login' && 'Mevcut hesabınızla panellere giriş yapın'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowLoginForm(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-light"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Login Form */}
            {showLoginForm === 'login' && (
              <div className="p-6 space-y-6">
                <form className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="loginEmail" className="text-sm font-medium text-gray-700">
                        E-posta
                      </Label>
                      <Input
                        id="loginEmail"
                        type="email"
                        placeholder="ornek@email.com"
                        className="mt-1"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="loginPassword" className="text-sm font-medium text-gray-700">
                        Şifre
                      </Label>
                      <Input
                        id="loginPassword"
                        type="password"
                        placeholder="Şifrenizi girin"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <Button 
                      type="submit"
                      onClick={(e) => {
                        e.preventDefault();
                        sessionStorage.setItem('selectedRole', 'customer');
                        window.location.href = '/api/login?role=customer&returnTo=/dashboard';
                      }}
                      className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 group"
                    >
                      <UserCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span>Müşteri Olarak Giriş</span>
                    </Button>

                    <Button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        sessionStorage.setItem('selectedRole', 'printer');
                        window.location.href = '/api/login?role=printer&returnTo=/dashboard';
                      }}
                      className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 group"
                    >
                      <Building2 className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span>Matbaa Olarak Giriş</span>
                    </Button>

                    <Button 
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        sessionStorage.setItem('selectedRole', 'admin');
                        window.location.href = '/api/login?role=admin&returnTo=/dashboard';
                      }}
                      className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-3 group"
                    >
                      <Crown className="h-5 w-5 group-hover:scale-110 transition-transform" />
                      <span>Admin Olarak Giriş</span>
                    </Button>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-center text-sm text-gray-500">
                      Hesabınız yok mu? 
                      <button 
                        type="button"
                        onClick={() => setShowLoginForm(null)}
                        className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                      >
                        Ana sayfaya dönün ve kayıt olun
                      </button>
                    </p>
                  </div>
                </form>
              </div>
            )}

            {/* Registration Forms */}
            {(showLoginForm === 'customer' || showLoginForm === 'printer') && (
              <form onSubmit={(e) => { e.preventDefault(); handleRegister(showLoginForm); }} className="p-6 space-y-6">
                {/* Personal Information */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <User className="h-5 w-5 mr-2 text-blue-600" />
                    Kişisel Bilgiler
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        Ad *
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        required
                        placeholder="Adınızı girin"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Soyad *
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        required
                        placeholder="Soyadınızı girin"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        E-posta *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        placeholder="ornek@email.com"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Telefon *
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        placeholder="0XXX XXX XX XX"
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Şifre *
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        required
                        placeholder="Güçlü bir şifre oluşturun"
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Company Information for Printer */}
                {showLoginForm === 'printer' && (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-purple-600" />
                      Şirket Bilgileri
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                          Şirket Adı *
                        </Label>
                        <Input
                          id="companyName"
                          value={formData.companyName || ''}
                          onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                          required
                          placeholder="Şirket adınızı girin"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="taxNumber" className="text-sm font-medium text-gray-700">
                          Vergi Numarası
                        </Label>
                        <Input
                          id="taxNumber"
                          value={formData.taxNumber || ''}
                          onChange={(e) => setFormData({...formData, taxNumber: e.target.value})}
                          placeholder="Vergi numaranızı girin"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Agreements */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="h-5 w-5 mr-2 text-green-600" />
                    Sözleşmeler ve Onaylar
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-700">
                        <span className="font-medium">Kullanım Şartları</span> ve <span className="font-medium">Gizlilik Politikası</span>'nı okudum ve kabul ediyorum. *
                      </label>
                    </div>

                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        id="marketing"
                        className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="marketing" className="text-sm text-gray-700">
                        Kampanya, duyuru ve özel fırsatlar hakkında e-posta almak istiyorum.
                      </label>
                    </div>

                    {showLoginForm === 'printer' && (
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="printerContract"
                          required
                          className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="printerContract" className="text-sm text-gray-700">
                          <span className="font-medium">Matbaa Ortaklık Sözleşmesi</span>'ni okudum ve kabul ediyorum. Platform komisyon oranları ve ödeme koşullarını onaylıyorum. *
                        </label>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowLoginForm(null)}
                    className="flex-1 py-3"
                  >
                    İptal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className={`flex-1 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${
                      showLoginForm === 'customer' 
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white' 
                        : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Hesap Oluşturuluyor...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <CheckCircle className="h-5 w-5" />
                        <span>{showLoginForm === 'customer' ? 'Müşteri Hesabı Oluştur' : 'Matbaa Hesabı Oluştur'}</span>
                      </div>
                    )}
                  </Button>
                </div>

                <div className="text-center pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Zaten hesabınız var mı? 
                    <button 
                      type="button"
                      onClick={() => setShowLoginForm('login')}
                      className="text-blue-600 hover:text-blue-700 font-medium ml-1"
                    >
                      Giriş yapın
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}