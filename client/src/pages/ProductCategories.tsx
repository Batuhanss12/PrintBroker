
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Package, 
  Building2,
  Palette,
  Truck,
  Star,
  CheckCircle,
  Award,
  Shield,
  Users,
  Clock,
  Globe,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Download,
  Eye,
  Calculator,
  Zap,
  Target,
  TrendingUp,
  Factory,
  Layers,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

const productCategories = [
  {
    id: "etiket-sticker",
    title: "Profesyonel Etiket & Sticker Çözümleri",
    description: "Endüstriyel kalitede ürün etiketleri, güvenlik hologramları ve özel tasarım çıkartmalar",
    image: "/api/placeholder/400/300",
    features: ["Su ve kimyasal dayanıklılık", "UV koruma teknolojisi", "Çıkarılabilir/kalıcı seçenekler", "Hologram güvenlik"],
    priceRange: "0.08₺ - 12.50₺",
    materials: ["Premium Vinyl", "Polyester Film", "Kraft Kağıt", "Hologram Folyo"],
    applications: ["Gıda ambalajı", "İlaç sektörü", "Otomotiv", "Beyaz eşya"],
    volume: "Min. 500 adet",
    delivery: "24-48 saat",
    category: "premium"
  },
  {
    id: "kartvizit-kurumsal",
    title: "Kurumsal Kimlik & Tanıtım Materyalleri",
    description: "Profesyonel kartvizitler, kataloglar, broşürler ve kurumsal iletişim materyalleri",
    image: "/api/placeholder/400/300",
    features: ["Premium laminasyon", "Spot UV lakk", "Emboss/deboss", "Özel kesim seçenekleri"],
    priceRange: "0.75₺ - 35.00₺",
    materials: ["300-350gr Kuşe", "Kraft Bristol", "Özel dokulu kağıtlar", "Metalize karton"],
    applications: ["Kurumsal tanıtım", "Fuarlar", "Networking", "Marka bilinirliği"],
    volume: "Min. 250 adet",
    delivery: "48-72 saat",
    category: "corporate"
  },
  {
    id: "ambalaj-premium",
    title: "Premium Ambalaj & Poşet Sistemleri",
    description: "Özel tasarım ambalajlar, lüks alışveriş poşetleri ve eco-friendly çözümler",
    image: "/api/placeholder/400/300",
    features: ["Çevre dostu malzemeler", "Güçlendirilmiş tutamak", "Su geçirmez özellik", "Özel boyut üretim"],
    priceRange: "0.35₺ - 15.00₺",
    materials: ["Kraft kağıt", "Non-woven kumaş", "Biyoplastik", "Geri dönüşümlü malzeme"],
    applications: ["Retail mağazacılık", "E-ticaret kargo", "Luxury brand", "Etkinlik organizasyonu"],
    volume: "Min. 1000 adet",
    delivery: "3-5 iş günü",
    category: "eco"
  },
  {
    id: "tabela-dijital",
    title: "Dijital Tabela & Reklam Çözümleri",
    description: "LED tabela sistemleri, dijital baskı bannerları ve dış mekan reklamları",
    image: "/api/placeholder/400/300",
    features: ["Hava koşullarına dayanıklılık", "LED backlighting", "Çift taraflı görüntüleme", "Modüler tasarım"],
    priceRange: "75.00₺ - 2500.00₺",
    materials: ["Alüminyum kompozit", "Akrilik pleksiglas", "PVC Banner", "LED sistemler"],
    applications: ["Mağaza tabelası", "Fuar standı", "Yol kenarı reklam", "Bina cephesi"],
    volume: "Min. 1 adet",
    delivery: "5-10 iş günü",
    category: "digital"
  },
  {
    id: "tekstil-promosyon",
    title: "Tekstil Promosyon & Corporate Wear",
    description: "Kurumsal tekstil ürünleri, promosyon t-shirtleri ve özel tasarım kıyafetler",
    image: "/api/placeholder/400/300",
    features: ["Solmayan baskı teknolojisi", "Nefes alabilir kumaş", "Antibakteriyel özellik", "Hızlı kuruma"],
    priceRange: "25.00₺ - 150.00₺",
    materials: ["Organik pamuk", "Performance polyester", "Bambu karışım", "Geri dönüşüm kumaş"],
    applications: ["Kurumsal etkinlik", "Takım kıyafeti", "Promosyon kampanyası", "Spor organizasyonu"],
    volume: "Min. 50 adet",
    delivery: "7-10 iş günü",
    category: "textile"
  },
  {
    id: "enterprise-cozumler",
    title: "Enterprise Özel Projeler",
    description: "Büyük ölçekli üretim, özelleştirilmiş çözümler ve endüstriyel baskı sistemleri",
    image: "/api/placeholder/400/300",
    features: ["Özel AR-GE", "Prototip geliştirme", "Seri üretim kapasitesi", "Kalite sertifikasyonu"],
    priceRange: "Proje bazlı teklif",
    materials: ["İthal premium malzemeler", "Endüstriyel substratlar", "Özel kimyasallar"],
    applications: ["Fortune 500 projeleri", "Devlet ihaleleri", "İhracat projeleri", "Teknoloji şirketleri"],
    volume: "Proje bazlı",
    delivery: "Proje planına göre",
    category: "enterprise"
  }
];

const categoryColors = {
  premium: "from-blue-600 to-purple-600",
  corporate: "from-slate-700 to-slate-900",
  eco: "from-green-600 to-emerald-600",
  digital: "from-orange-500 to-red-600",
  textile: "from-pink-500 to-rose-600",
  enterprise: "from-amber-600 to-yellow-600"
};

const stats = [
  { icon: Factory, label: "Aktif Üretim Kapasitesi", value: "50M+ adet/ay" },
  { icon: Users, label: "Kurumsal Müşteri", value: "2500+" },
  { icon: Globe, label: "Şehir Kapsamı", value: "81 İl" },
  { icon: Award, label: "Kalite Sertifikası", value: "ISO 9001:2015" }
];

const certifications = [
  "ISO 9001:2015 Kalite Yönetim Sistemi",
  "ISO 14001:2015 Çevre Yönetim Sistemi",
  "OHSAS 18001 İş Sağlığı ve Güvenliği",
  "FSC Sertifikalı Kağıt Kullanımı"
];

export default function ProductCategories() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <Building2 className="h-12 w-12 text-blue-400 mr-4" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                MatBixx Professional
              </h1>
            </div>
            <p className="text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
              Türkiye'nin öncü dijital baskı platformu. Endüstriyel kalite, kurumsal güvenilirlik.
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <stat.icon className="h-8 w-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-blue-200">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Profesyonel Baskı Çözümleri
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Her sektöre özel, teknoloji odaklı baskı çözümleri ile işletmenizin ihtiyaçlarını karşılıyoruz
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
            {productCategories.map((category) => (
              <Card key={category.id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white overflow-hidden">
                <div className="relative">
                  <div className={`w-full h-56 bg-gradient-to-r ${categoryColors[category.category]} flex items-center justify-center relative overflow-hidden`}>
                    <Package className="w-24 h-24 text-white/30 absolute" />
                    <Sparkles className="w-8 h-8 text-white absolute top-4 right-4" />
                    <Badge className="absolute top-4 left-4 bg-white/20 text-white border-white/30">
                      {category.category === 'premium' && 'Premium'}
                      {category.category === 'corporate' && 'Kurumsal'}
                      {category.category === 'eco' && 'Eco-Friendly'}
                      {category.category === 'digital' && 'Dijital'}
                      {category.category === 'textile' && 'Tekstil'}
                      {category.category === 'enterprise' && 'Enterprise'}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl group-hover:text-blue-600 transition-colors leading-tight">
                    {category.title}
                  </CardTitle>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {category.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Pricing and Volume */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Fiyat Aralığı</span>
                      <div className="font-bold text-green-600">{category.priceRange}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 font-medium">Minimum Sipariş</span>
                      <div className="font-semibold text-gray-900">{category.volume}</div>
                    </div>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                      <Star className="w-4 h-4 mr-2 text-yellow-500" />
                      Özellikler
                    </h4>
                    <div className="space-y-2">
                      {category.features.map((feature, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <Layers className="w-4 h-4 mr-2 text-blue-500" />
                      Malzemeler
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {category.materials.map((material, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Delivery */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      Teslimat: {category.delivery}
                    </span>
                    <span className="flex items-center text-green-600 font-medium">
                      <Shield className="w-4 h-4 mr-1" />
                      Garantili
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-3 pt-4">
                    <Button className="flex-1" size="sm">
                      <Calculator className="w-4 h-4 mr-2" />
                      Hızlı Teklif
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      Örnekler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Corporate Advantages */}
      <section className="py-20 bg-gradient-to-r from-slate-900 to-blue-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-6">MatBixx Kurumsal Avantajları</h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              15 yıllık sektörel deneyim ve teknolojik altyapımızla size fark yaratan hizmet sunuyoruz
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-blue-100/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Zap className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Hızlı Üretim</h3>
              <p className="text-blue-100">24 saat kesintisiz üretim kapasitesi ile ekspres teslimat</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-green-100/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Target className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Hassas Kalite</h3>
              <p className="text-blue-100">±0.1mm hassasiyetle çalışan CNC kesim ve dijital baskı teknolojileri</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-purple-100/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ölçeklenebilir</h3>
              <p className="text-blue-100">100 adetten 10 milyon adete kadar esnek üretim kapasitesi</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-orange-100/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Award className="w-10 h-10 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-3">Sertifikalı</h3>
              <p className="text-blue-100">Uluslararası kalite standartları ve çevre dostu üretim</p>
            </div>
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Kalite Sertifikalarımız</h2>
            <p className="text-lg text-gray-600">Uluslararası standartlarda hizmet güvencesi</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 text-center">
                <Shield className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <p className="font-semibold text-gray-900 text-sm">{cert}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Projenizi Birlikte Hayata Geçirelim</h2>
          <p className="text-xl mb-8 opacity-90 max-w-3xl mx-auto">
            Uzman ekibimiz sizin için özel çözümler geliştirmeye hazır. 
            Teknik danışmanlık ve proje yönetimi desteği ile işinizi büyütün.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
            <div className="flex items-center text-lg">
              <Phone className="w-5 h-5 mr-3" />
              <span>+90 (212) 555 0123</span>
            </div>
            <div className="flex items-center text-lg">
              <Mail className="w-5 h-5 mr-3" />
              <span>kurumsal@matbixx.com</span>
            </div>
            <div className="flex items-center text-lg">
              <MapPin className="w-5 h-5 mr-3" />
              <span>İstanbul, Ankara, İzmir</span>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
              <FileText className="w-5 h-5 mr-2" />
              Kurumsal Teklif Alın
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold">
              <Download className="w-5 h-5 mr-2" />
              Katalog İndirin
            </Button>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <section className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center">
            <div className="flex items-center mb-4 sm:mb-0">
              <Building2 className="h-8 w-8 text-blue-400 mr-3" />
              <span className="text-xl font-bold">MatBixx Professional</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/" className="hover:text-blue-400 transition-colors">Ana Sayfa</Link>
              <Link to="/about" className="hover:text-blue-400 transition-colors">Hakkımızda</Link>
              <Link to="/contact" className="hover:text-blue-400 transition-colors">İletişim</Link>
              <Link to="/quality" className="hover:text-blue-400 transition-colors">Kalite Politikası</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
