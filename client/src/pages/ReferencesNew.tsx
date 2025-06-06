import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search,
  Star,
  Building2,
  Users,
  Award,
  CheckCircle,
  Globe,
  Calendar,
  Package,
  Target,
  TrendingUp,
  Factory,
  Sparkles,
  Eye,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  ExternalLink
} from "lucide-react";

const clientReferences = [
  {
    id: "coca-cola-turkey",
    companyName: "Coca-Cola Türkiye",
    logo: "/api/placeholder/200/100",
    industry: "İçecek Sanayi",
    location: "İstanbul",
    projectType: "Ürün Etiketleri & Ambalaj",
    completedDate: "2024-01",
    projectScale: "5.2M adet/yıl",
    satisfaction: 4.9,
    testimonial: "MatBixx ile çalışmak gerçekten profesyonel bir deneyim. Kalite standartları ve teslimat sürelerine uyum mükemmel.",
    contactPerson: "Ayşe Demir",
    position: "Procurement Manager",
    projectDetails: {
      duration: "12 ay sürekli",
      materials: ["Premium Vinyl", "Hologram Güvenlik"],
      quantity: "5.2M adet",
      complexity: "Yüksek"
    },
    results: [
      "% 98.5 kalite başarı oranı",
      "% 100 zamanında teslimat",
      "% 15 maliyet tasarrufu",
      "Sıfır müşteri şikayeti"
    ],
    featured: true,
    category: "Fortune 500"
  },
  {
    id: "migros-retail",
    companyName: "Migros Ticaret A.Ş.",
    logo: "/api/placeholder/200/100",
    industry: "Perakende",
    location: "İstanbul",
    projectType: "Mağaza Tabelaları & Reklam Materyalleri",
    completedDate: "2023-11",
    projectScale: "350+ mağaza",
    satisfaction: 4.8,
    testimonial: "Tüm Türkiye'deki mağazalarımız için tek platformdan hizmet almak büyük kolaylık sağladı.",
    contactPerson: "Mehmet Kaya",
    position: "Operations Director",
    projectDetails: {
      duration: "8 ay",
      materials: ["Dijital Baskı", "Akrilik Pleksiglas"],
      quantity: "2500+ parça",
      complexity: "Orta"
    },
    results: [
      "350+ mağaza tamamlandı",
      "% 95 müşteri memnuniyeti",
      "% 20 süreç hızlanması",
      "Tek tedarikçi avantajı"
    ],
    featured: true,
    category: "Perakende"
  },
  {
    id: "ford-otosan",
    companyName: "Ford Otosan",
    logo: "/api/placeholder/200/100",
    industry: "Otomotiv",
    location: "Kocaeli",
    projectType: "Endüstriyel Etiketler & Güvenlik Çözümleri",
    completedDate: "2024-02",
    projectScale: "1.8M adet/yıl",
    satisfaction: 4.9,
    testimonial: "Otomotiv sektörünün zorlu standartlarını karşılayan tek platform. Kalite kontrolü mükemmel.",
    contactPerson: "İnci Aslaner",
    position: "Supply Chain Manager",
    projectDetails: {
      duration: "24 ay kontrat",
      materials: ["Polyester Film", "Barkod Etiket"],
      quantity: "1.8M adet",
      complexity: "Çok Yüksek"
    },
    results: [
      "ISO/TS 16949 uyum",
      "% 99.2 kalite oranı",
      "Sıfır üretim durması",
      "% 25 tedarik süre azalması"
    ],
    featured: true,
    category: "Otomotiv"
  },
  {
    id: "akbank",
    companyName: "Akbank T.A.Ş.",
    logo: "/api/placeholder/200/100",
    industry: "Bankacılık",
    location: "İstanbul",
    projectType: "Kurumsal Kimlik & Şube Materyalleri",
    completedDate: "2023-09",
    projectScale: "800+ şube",
    satisfaction: 4.7,
    testimonial: "Bankacılık sektörünün hassas gereksinimlerini anlayan profesyonel ekip.",
    contactPerson: "Serkan Özkan",
    position: "Branch Operations Manager",
    projectDetails: {
      duration: "6 ay",
      materials: ["Premium Karton", "UV Lakk"],
      quantity: "45K parça",
      complexity: "Yüksek"
    },
    results: [
      "800+ şube kapsamı",
      "% 100 marka uyumu",
      "% 30 süreç iyileştirmesi",
      "Merkezi yönetim kolaylığı"
    ],
    featured: false,
    category: "Finans"
  },
  {
    id: "eczacibasi-healthcare",
    companyName: "Eczacıbaşı İlaç",
    logo: "/api/placeholder/200/100",
    industry: "İlaç Sanayi",
    location: "İstanbul",
    projectType: "FDA Onaylı İlaç Etiketleri",
    completedDate: "2024-03",
    projectScale: "3.5M adet/yıl",
    satisfaction: 4.9,
    testimonial: "İlaç sektörünün en zorlu regulasyonlarına uyum sağlayan tek platform.",
    contactPerson: "Dr. Fatma Gürel",
    position: "Quality Assurance Director",
    projectDetails: {
      duration: "18 ay",
      materials: ["FDA Onaylı Malzeme", "Tamper Evident"],
      quantity: "3.5M adet",
      complexity: "Kritik"
    },
    results: [
      "% 100 FDA uyum",
      "Sıfır regulasyon ihlali",
      "% 40 manuel işlem azalması",
      "GMP standart uyum"
    ],
    featured: true,
    category: "Sağlık"
  },
  {
    id: "turkcell-telecom",
    companyName: "Turkcell",
    logo: "/api/placeholder/200/100",
    industry: "Telekomünikasyon",
    location: "İstanbul",
    projectType: "Promosyon Materyalleri & Mağaza Donanımı",
    completedDate: "2023-12",
    projectScale: "2000+ nokta",
    satisfaction: 4.8,
    testimonial: "Türkiye'nin her yerindeki noktalarımız için standart kalitede hizmet.",
    contactPerson: "Ahmet Çelik",
    position: "Retail Operations Manager",
    projectDetails: {
      duration: "10 ay",
      materials: ["Dijital Baskı", "PVC Banner"],
      quantity: "15K parça",
      complexity: "Orta"
    },
    results: [
      "2000+ nokta kapsamı",
      "% 95 zamanında teslimat",
      "% 18 maliyet optimizasyonu",
      "Tek platform yönetimi"
    ],
    featured: false,
    category: "Teknoloji"
  }
];

const industryStats = [
  { industry: "Fortune 500", count: 45, growth: "+25%" },
  { industry: "Otomotiv", count: 28, growth: "+30%" },
  { industry: "Gıda & İçecek", count: 67, growth: "+15%" },
  { industry: "Perakende", count: 89, growth: "+40%" },
  { industry: "Sağlık & İlaç", count: 34, growth: "+20%" },
  { industry: "Teknoloji", count: 52, growth: "+35%" }
];

const certifications = [
  "ISO 9001:2015 Kalite Yönetimi",
  "ISO 14001 Çevre Yönetimi",
  "FDA Gıda & İlaç Uygunluğu", 
  "FSC Orman Sertifikası",
  "OEKO-TEX Tekstil Standardı",
  "CE Avrupa Uygunluğu"
];

export default function ReferencesNew() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredReferences = clientReferences.filter(ref => {
    const matchesSearch = ref.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ref.industry.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ref.projectType.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesIndustry = selectedIndustry === "all" || ref.industry === selectedIndustry;
    const matchesCategory = selectedCategory === "all" || ref.category === selectedCategory;
    
    return matchesSearch && matchesIndustry && matchesCategory;
  });

  const featuredReferences = filteredReferences.filter(ref => ref.featured);
  const otherReferences = filteredReferences.filter(ref => !ref.featured);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* SEO Optimized Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full text-blue-800 text-sm font-medium mb-6">
              <Award className="h-4 w-4 mr-2" />
              500+ Mutlu Müşteri • Fortune 500 Güvencesi
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Başarı Hikayeleri
              <span className="text-blue-600 block">Güvenilen Referanslar</span>
            </h1>
            
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Türkiye'nin önde gelen markalarından Fortune 500 şirketlerine kadar 
              500+ başarılı proje ile güvenilir baskı çözümleri sunuyoruz.
            </p>

            {/* Search and Filter */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Şirket adı, sektör veya proje türü ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-12 text-lg bg-white border-gray-300 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Statistics */}
      <section className="py-12 bg-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Sektörel Başarılarımız</h2>
            <p className="text-blue-100">Her sektörde öncü markalarla çalışıyoruz</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {industryStats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold mb-1">{stat.count}</div>
                <div className="text-sm text-blue-100 mb-2">{stat.industry}</div>
                <Badge className="bg-green-500 text-white text-xs">
                  {stat.growth}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured References */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Öne Çıkan Projelerimiz
            </h2>
            <p className="text-lg text-gray-600">
              Fortune 500 şirketleri ve sektör liderleri ile gerçekleştirdiğimiz başarılı projeler
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {featuredReferences.map((reference) => (
              <Card key={reference.id} className="group hover:shadow-2xl transition-all duration-500 border-0 shadow-lg overflow-hidden">
                <div className="relative">
                  <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-white/30" />
                    <Badge className="absolute top-4 right-4 bg-yellow-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Öne Çıkan
                    </Badge>
                  </div>
                </div>

                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl text-gray-900 mb-2">
                        {reference.companyName}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center">
                          <Building2 className="w-4 h-4 mr-1" />
                          {reference.industry}
                        </span>
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {reference.location}
                        </span>
                      </div>
                      <p className="text-blue-600 font-medium text-sm">
                        {reference.projectType}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center mb-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="ml-1 font-semibold">{reference.satisfaction}</span>
                      </div>
                      <div className="text-xs text-gray-500">{reference.projectScale}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Project Details */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-xs text-gray-500">Süre:</span>
                      <div className="font-medium text-sm">{reference.projectDetails.duration}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Miktar:</span>
                      <div className="font-medium text-sm">{reference.projectDetails.quantity}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Karmaşıklık:</span>
                      <div className="font-medium text-sm">{reference.projectDetails.complexity}</div>
                    </div>
                    <div>
                      <span className="text-xs text-gray-500">Tamamlanma:</span>
                      <div className="font-medium text-sm">{reference.completedDate}</div>
                    </div>
                  </div>

                  {/* Testimonial */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700 italic mb-3">
                      "{reference.testimonial}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center mr-3">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-sm">{reference.contactPerson}</div>
                        <div className="text-xs text-gray-500">{reference.position}</div>
                      </div>
                    </div>
                  </div>

                  {/* Results */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                      <TrendingUp className="w-4 h-4 mr-2 text-green-500" />
                      Proje Sonuçları
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {reference.results.map((result, index) => (
                        <div key={index} className="flex items-center text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{result}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category Badge */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Badge className="bg-gray-100 text-gray-700">
                      {reference.category}
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-blue-600">
                      Detaylı Bilgi
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Other References Grid */}
      {otherReferences.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              Diğer Başarılı Projelerimiz
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherReferences.map((reference) => (
                <Card key={reference.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{reference.companyName}</CardTitle>
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="ml-1 text-sm font-semibold">{reference.satisfaction}</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{reference.industry}</p>
                  </CardHeader>
                  
                  <CardContent>
                    <p className="text-sm text-blue-600 font-medium mb-3">
                      {reference.projectType}
                    </p>
                    
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Proje Ölçeği:</span>
                        <span className="font-medium">{reference.projectScale}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tamamlanma:</span>
                        <span className="font-medium">{reference.completedDate}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-3 border-t">
                      <Badge className="bg-gray-100 text-gray-700 text-xs">
                        {reference.category}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Certifications Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Kalite Sertifikalarımız
            </h2>
            <p className="text-lg text-gray-600">
              Uluslararası standartlarda hizmet güvencesi
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certifications.map((cert, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-lg transition-shadow">
                <Award className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <p className="font-semibold text-gray-900">{cert}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siz de Başarı Hikayemizin Parçası Olun
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Fortune 500 şirketlerinin tercih ettiği kalitede hizmet almak için hemen başlayın
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3">
              <Target className="h-5 w-5 mr-2" />
              Projemi Başlat
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3">
              <Phone className="h-5 w-5 mr-2" />
              Uzman Görüşmesi
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}