import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  PrinterIcon, 
  Palette, 
  Upload, 
  Handshake, 
  CreditCard, 
  BarChart3,
  Users,
  Building2,
  Star,
  Clock,
  Check,
  ArrowRight
} from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center">
                <PrinterIcon className="text-primary text-2xl mr-3" />
                <span className="text-2xl font-bold text-gray-900">PrintConnect</span>
              </div>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Özellikler</a>
              <a href="#pricing" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">Fiyatlar</a>
              <a href="#contact" className="text-gray-700 hover:text-primary px-3 py-2 text-sm font-medium transition-colors">İletişim</a>
            </nav>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={handleLogin} className="text-gray-700 hover:text-primary">
                Giriş Yap
              </Button>
              <Button onClick={handleLogin} className="bg-primary text-white hover:bg-blue-700">
                Ücretsiz Başla
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-blue-800 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Matbaa İhtiyaçlarınız İçin
                <span className="text-blue-200 block">Profesyonel Çözüm</span>
              </h1>
              <p className="text-xl mb-8 text-blue-100 leading-relaxed">
                Müşteriler ve matbaa firmalarını buluşturan B2B platform. Otomatik tasarım, detaylı teklif sistemi ve güvenli ödeme altyapısı.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleLogin}
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-3"
                >
                  Müşteri Olarak Başla
                </Button>
                <Button 
                  onClick={handleLogin}
                  variant="outline"
                  size="lg"
                  className="border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-3"
                >
                  Matbaa Olarak Katıl
                </Button>
              </div>
            </div>
            <div className="lg:justify-self-end">
              <Card className="bg-white bg-opacity-10 backdrop-blur-sm border-white border-opacity-20">
                <CardContent className="p-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white bg-opacity-20 rounded-xl p-6 text-center">
                      <Badge className="bg-white bg-opacity-20 text-white mb-3">
                        <Upload className="w-4 h-4 mr-1" />
                        Etiket Baskı
                      </Badge>
                      <h3 className="font-semibold mb-2">Tabaka & Rulo</h3>
                      <p className="text-sm text-blue-100">Yüksek kalite</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-xl p-6 text-center">
                      <Badge className="bg-white bg-opacity-20 text-white mb-3">
                        <Palette className="w-4 h-4 mr-1" />
                        Otomatik Tasarım
                      </Badge>
                      <h3 className="font-semibold mb-2">AI Destekli</h3>
                      <p className="text-sm text-blue-100">Hızlı çözüm</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-xl p-6 text-center">
                      <Badge className="bg-white bg-opacity-20 text-white mb-3">
                        <Handshake className="w-4 h-4 mr-1" />
                        Teklif Sistemi
                      </Badge>
                      <h3 className="font-semibold mb-2">Hızlı & Güvenli</h3>
                      <p className="text-sm text-blue-100">Kolay karşılaştırma</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-xl p-6 text-center">
                      <Badge className="bg-white bg-opacity-20 text-white mb-3">
                        <CreditCard className="w-4 h-4 mr-1" />
                        Kredili Sistem
                      </Badge>
                      <h3 className="font-semibold mb-2">Esnek Ödemeler</h3>
                      <p className="text-sm text-blue-100">Güvenli ödeme</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Neden PrintConnect?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Modern teknoloji ile matbaa sektöründe devrim yaratıyoruz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow border-gray-200">
              <CardContent className="p-8">
                <div className="bg-primary bg-opacity-10 rounded-xl w-16 h-16 flex items-center justify-center mb-6">
                  <Palette className="text-primary text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Otomatik Tasarım</h3>
                <p className="text-gray-600">AI destekli tasarım araçları ile profesyonel tasarımları dakikalar içinde oluşturun.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-gray-200">
              <CardContent className="p-8">
                <div className="bg-orange-500 bg-opacity-10 rounded-xl w-16 h-16 flex items-center justify-center mb-6">
                  <Upload className="text-orange-500 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Dosya Yönetimi</h3>
                <p className="text-gray-600">Güvenli dosya yükleme ve tüm popüler formatlar için destek.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-gray-200">
              <CardContent className="p-8">
                <div className="bg-green-500 bg-opacity-10 rounded-xl w-16 h-16 flex items-center justify-center mb-6">
                  <BarChart3 className="text-green-500 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Teklif Karşılaştırma</h3>
                <p className="text-gray-600">Birden fazla matbaadan teklif alın ve en uygun fiyatı bulun.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-gray-200">
              <CardContent className="p-8">
                <div className="bg-yellow-500 bg-opacity-10 rounded-xl w-16 h-16 flex items-center justify-center mb-6">
                  <CreditCard className="text-yellow-500 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Güvenli Ödeme</h3>
                <p className="text-gray-600">Stripe entegrasyonu ile güvenli ödeme ve kredili sistem desteği.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-gray-200">
              <CardContent className="p-8">
                <div className="bg-purple-500 bg-opacity-10 rounded-xl w-16 h-16 flex items-center justify-center mb-6">
                  <Star className="text-purple-500 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Puanlama Sistemi</h3>
                <p className="text-gray-600">Matbaa kalitesini değerlendirin ve en iyi hizmeti seçin.</p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow border-gray-200">
              <CardContent className="p-8">
                <div className="bg-pink-500 bg-opacity-10 rounded-xl w-16 h-16 flex items-center justify-center mb-6">
                  <Clock className="text-pink-500 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Sipariş Takibi</h3>
                <p className="text-gray-600">Siparişinizin her aşamasını gerçek zamanlı olarak takip edin.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Fiyatlandırma Planları
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Müşteriler ve matbaalar için uygun fiyatlı çözümler
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Customer Pricing */}
            <Card className="shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
                <div className="flex items-center mb-2">
                  <Users className="mr-3" />
                  <h3 className="text-2xl font-bold">Müşteri Planı</h3>
                </div>
                <p className="text-blue-100">Kredili sistem ile esnek ödemeler</p>
              </div>
              <CardContent className="p-6">
                <div className="mb-6">
                  <p className="text-gray-600 mb-4">Kredi paketleri:</p>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">₺100 Kredi</span>
                      <Badge variant="secondary" className="text-primary font-bold">₺95</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">₺500 Kredi</span>
                      <Badge variant="secondary" className="text-primary font-bold">₺450</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium">₺1000 Kredi</span>
                      <Badge variant="secondary" className="text-primary font-bold">₺850</Badge>
                    </div>
                  </div>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Sınırsız teklif talebi</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Otomatik tasarım araçları</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Dosya yükleme (100MB)</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Sipariş takibi</span>
                  </li>
                </ul>
                <Button onClick={handleLogin} className="w-full bg-primary text-white hover:bg-blue-700">
                  Kredi Satın Al
                </Button>
              </CardContent>
            </Card>

            {/* Printer Pricing */}
            <Card className="shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6">
                <div className="flex items-center mb-2">
                  <Building2 className="mr-3" />
                  <h3 className="text-2xl font-bold">Matbaa Planı</h3>
                </div>
                <p className="text-orange-100">Aylık abonelik sistemi</p>
              </div>
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="text-4xl font-bold text-gray-900 mb-2">₺299</div>
                  <p className="text-gray-600">Aylık abonelik</p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Sınırsız teklif verme</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Firma profil sayfası</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Müşteri yönetimi</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Detaylı raporlar</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="text-green-500 mr-3 h-5 w-5" />
                    <span>Öncelikli destek</span>
                  </li>
                </ul>
                <Button onClick={handleLogin} className="w-full bg-orange-500 text-white hover:bg-orange-600">
                  Abonelik Başlat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <PrinterIcon className="text-primary text-2xl mr-3" />
                <span className="text-2xl font-bold">PrintConnect</span>
              </div>
              <p className="text-gray-400 mb-4">
                Müşteriler ve matbaa firmalarını buluşturan profesyonel B2B platform.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Hizmetler</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Etiket Baskı</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Katalog Baskı</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Kartvizit</a></li>
                <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Otomatik Tasarım</a></li>
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
              © 2024 PrintConnect. Tüm hakları saklıdır.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
