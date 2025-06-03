import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
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
  ArrowRight,
  LayoutGrid,
  Disc,
  Printer,
  FileText,
  Shield,
  Zap,
  TrendingUp,
  Award,
  Target,
  Send
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
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 text-white py-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-blue-500/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Zap className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Türkiye'nin Önde Gelen B2B Matbaa Platformu</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
              Matbaa İhtiyaçlarınız İçin
              <span className="block text-blue-200">Profesyonel Çözüm</span>
            </h1>
            <p className="text-xl md:text-2xl mb-12 text-blue-100 leading-relaxed max-w-4xl mx-auto">
              Müşteriler ve matbaa firmalarını buluşturan akıllı platform. 
              Otomatik tasarım, hızlı teklif alma ve güvenli ödeme sistemleri ile işinizi büyütün.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button 
                onClick={handleLogin}
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-10 py-4 text-lg shadow-2xl hover:shadow-white/20 transition-all duration-300 transform hover:scale-105"
              >
                <Users className="h-5 w-5 mr-2" />
                Müşteri Olarak Başla
              </Button>
              <Button 
                onClick={handleLogin}
                variant="outline"
                size="lg"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 font-semibold px-10 py-4 text-lg backdrop-blur-sm bg-white/10 transition-all duration-300 transform hover:scale-105"
              >
                <Building2 className="h-5 w-5 mr-2" />
                Matbaa Olarak Katıl
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">10K+</div>
              <div className="text-blue-200">Aktif Müşteri</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">500+</div>
              <div className="text-blue-200">Matbaa Partneri</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-200">Tamamlanan Proje</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold mb-2">99%</div>
              <div className="text-blue-200">Müşteri Memnuniyeti</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Quote Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hemen Teklif Alın
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              3 kolay adımda profesyonel matbaa hizmetleri için teklif alın
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                  <LayoutGrid className="h-10 w-10 text-blue-500 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Tabaka Etiket</h3>
                <p className="text-gray-600 mb-6">A3/A4 tabaka halinde etiket baskısı. Kuşe, bristol ve sticker seçenekleri.</p>
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Teklif Al
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-orange-500 group-hover:text-white transition-all duration-300">
                  <Disc className="h-10 w-10 text-orange-500 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Rulo Etiket</h3>
                <p className="text-gray-600 mb-6">Termal ve yapışkanlı rulo etiketler. Farklı çap ve mandrin seçenekleri.</p>
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Teklif Al
                </Button>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-green-500 group-hover:text-white transition-all duration-300">
                  <Printer className="h-10 w-10 text-green-500 group-hover:text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-900">Genel Baskı</h3>
                <p className="text-gray-600 mb-6">Katalog, broşür, kartvizit ve özel baskı projeleri için.</p>
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Teklif Al
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Contact Form */}
          <Card className="max-w-4xl mx-auto bg-gradient-to-r from-blue-50 to-indigo-50 border-0 shadow-xl">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Hızlı İletişim</h3>
                <p className="text-gray-600">Size özel teklifler için iletişim bilgilerinizi bırakın</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Input placeholder="Adınız Soyadınız" className="border-white bg-white" />
                <Input placeholder="E-posta Adresiniz" className="border-white bg-white" />
                <Input placeholder="Telefon Numaranız" className="border-white bg-white" />
                <Button 
                  onClick={handleLogin}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Gönder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-blue-100 text-blue-600 rounded-full px-4 py-2 mb-6">
              <Award className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Neden PrintConnect?</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Modern Teknoloji ile Güçlendirilmiş Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Matbaa sektöründe yeni nesil çözümler sunarak iş süreçlerinizi optimize ediyoruz
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardContent className="p-8">
                <div className="bg-blue-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Palette className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">AI Destekli Tasarım</h3>
                <p className="text-gray-600">Yapay zeka teknolojisi ile profesyonel tasarımları dakikalar içinde oluşturun. Otomatik boyutlandırma ve renk uyumu.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-orange-50 to-red-50">
              <CardContent className="p-8">
                <div className="bg-orange-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Upload className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Gelişmiş Dosya Yönetimi</h3>
                <p className="text-gray-600">100MB'a kadar dosya yükleme, tüm format desteği ve bulut tabanlı güvenli saklama sistemi.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50">
              <CardContent className="p-8">
                <div className="bg-green-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Akıllı Teklif Sistemi</h3>
                <p className="text-gray-600">Birden fazla matbaadan teklif alın, fiyatları karşılaştırın ve en uygun seçeneği bulun.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
              <CardContent className="p-8">
                <div className="bg-purple-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Shield className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Güvenli Ödeme</h3>
                <p className="text-gray-600">SSL sertifikası ve Stripe entegrasyonu ile güvenli ödeme. Kredili sistem ve esnek ödeme seçenekleri.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardContent className="p-8">
                <div className="bg-yellow-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Star className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Kalite Değerlendirme</h3>
                <p className="text-gray-600">Matbaa kalitesini değerlendirin, deneyimlerinizi paylaşın ve en iyi hizmeti seçin.</p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg bg-gradient-to-br from-teal-50 to-cyan-50">
              <CardContent className="p-8">
                <div className="bg-teal-500 rounded-xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <TrendingUp className="text-white text-2xl" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-gray-900">Gerçek Zamanlı Takip</h3>
                <p className="text-gray-600">Siparişinizin her aşamasını anlık olarak takip edin. SMS ve e-posta bildirimleri.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center bg-green-100 text-green-600 rounded-full px-4 py-2 mb-6">
              <CreditCard className="h-4 w-4 mr-2" />
              <span className="text-sm font-medium">Esnek Fiyatlandırma</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              İhtiyacınıza Uygun Çözümler
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Müşteriler için kredili sistem, matbaalar için aylık abonelik. Şeffaf ve adil fiyatlandırma.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Customer Plan */}
            <Card className="relative group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border-0 shadow-xl bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="absolute top-6 right-6">
                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  POPÜLER
                </div>
              </div>
              <CardHeader className="text-center pb-4">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Müşteri Paketi</CardTitle>
                <div className="mt-4">
                  <div className="text-4xl font-bold text-blue-600">KREDİLİ</div>
                  <div className="text-5xl font-bold text-gray-900 mt-2">SİSTEM</div>
                  <p className="text-gray-600 mt-2">Kullandığın kadar öde</p>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Sınırsız teklif alma</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">AI destekli otomatik tasarım</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">100MB dosya yükleme</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Gerçek zamanlı sipariş takibi</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">7/24 canlı destek</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <ArrowRight className="h-5 w-5 mr-2" />
                  Hemen Başla
                </Button>
              </CardContent>
            </Card>

            {/* Printer Plan */}
            <Card className="relative group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border-0 shadow-xl bg-gradient-to-br from-orange-50 to-red-100">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                  EN ÇOK TERCİH EDİLEN
                </div>
              </div>
              <CardHeader className="text-center pb-4 pt-8">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-10 w-10 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">Matbaa Paketi</CardTitle>
                <div className="mt-4">
                  <div className="text-5xl font-bold text-orange-600">₺299</div>
                  <p className="text-gray-600 mt-1">aylık abonelik</p>
                  <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mt-3">
                    14 GÜN ÜCRETSİZ DENEME
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-8 pb-8">
                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Sınırsız teklif verme</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Gelişmiş analitik dashboard</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Müşteri değerlendirme sistemi</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Otomatik sipariş yönetimi</span>
                  </li>
                  <li className="flex items-center">
                    <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="font-medium">Premium öncelikli destek</span>
                  </li>
                </ul>
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Target className="h-5 w-5 mr-2" />
                  Ücretsiz Deneyin
                </Button>
              </CardContent>
            </Card>


          </div>

          {/* Money Back Guarantee */}
          <div className="text-center">
            <Card className="inline-block bg-green-50 border-green-200 border-2">
              <CardContent className="px-8 py-6">
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-green-800">30 Gün Para İade Garantisi</h3>
                    <p className="text-green-600">Memnun kalmazsan, paranı geri al</p>
                  </div>
                </div>
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
