import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Award, 
  TrendingUp,
  Star,
  Quote,
  ArrowRight
} from "lucide-react";

const clientReferences = [
  {
    id: 1,
    name: "Teknosa",
    sector: "Elektronik Perakende",
    project: "Mağaza Etiketleme Sistemi",
    description: "500+ mağaza için ürün etiketleri ve fiyat kartlarının tasarım ve üretimi",
    result: "Mağaza operasyonlarında %40 hız artışı",
    volume: "2M+ adet/ay",
    image: "/api/placeholder/300/200"
  },
  {
    id: 2,
    name: "Migros",
    sector: "Gıda Perakende", 
    project: "Ambalaj ve Poşet Üretimi",
    description: "Sürdürülebilir ambalaj çözümleri ve özel tasarım alışveriş poşetleri",
    result: "Çevre dostu malzeme kullanımında %60 artış",
    volume: "5M+ adet/ay",
    image: "/api/placeholder/300/200"
  },
  {
    id: 3,
    name: "Koç Holding",
    sector: "Holding",
    project: "Kurumsal Kimlik Materyalleri",
    description: "Grup şirketleri için kartvizit, katalog ve promosyon materyalleri",
    result: "Marka tutarlılığında %90 standardizasyon",
    volume: "500K+ adet/yıl",
    image: "/api/placeholder/300/200"
  },
  {
    id: 4,
    name: "İstanbul Büyükşehir Belediyesi",
    sector: "Kamu",
    project: "Şehir Tanıtım Projeleri",
    description: "Turizm broşürleri, haritalar ve bilgilendirme tabelaları",
    result: "Turist memnuniyetinde %35 artış",
    volume: "1M+ adet/yıl",
    image: "/api/placeholder/300/200"
  },
  {
    id: 5,
    name: "Zara",
    sector: "Moda Perakende",
    project: "Sezonluk Etiket Üretimi",
    description: "Moda etiketleri, hang tag'ler ve özel ambalaj çözümleri",
    result: "Ürün tanıtımında %50 etkinlik artışı",
    volume: "3M+ adet/sezon",
    image: "/api/placeholder/300/200"
  },
  {
    id: 6,
    name: "Borusan Holding",
    sector: "Otomotiv",
    project: "Bayi Destek Materyalleri",
    description: "Showroom tabelaları, ürün broşürleri ve tanıtım materyalleri",
    result: "Satış performansında %25 artış",
    volume: "200K+ adet/yıl",
    image: "/api/placeholder/300/200"
  }
];

const testimonials = [
  {
    name: "Ahmet Kaya",
    position: "Satın Alma Müdürü",
    company: "Teknosa",
    content: "Matbixx ile çalışmaya başladığımızdan beri operasyonel verimliliğimiz önemli ölçüde arttı. Kaliteli ürünler ve zamanında teslimat.",
    rating: 5
  },
  {
    name: "Elif Demir",
    position: "Pazarlama Direktörü", 
    company: "Migros",
    content: "Sürdürülebilirlik hedeflerimize ulaşmamızda Matbixx'in çevre dostu çözümleri çok değerli. Müşterilerimizden olumlu geri dönüşler alıyoruz.",
    rating: 5
  },
  {
    name: "Mehmet Özkan",
    position: "Marka Yöneticisi",
    company: "Koç Holding",
    content: "Grup şirketlerimizin tamamında marka tutarlılığını sağlamak için Matbixx'in profesyonel yaklaşımı ve kaliteli üretimi kritik öneme sahip.",
    rating: 5
  }
];

const achievements = [
  {
    icon: Building2,
    number: "500+",
    label: "Kurumsal Müşteri",
    description: "Türkiye'nin önde gelen şirketleri"
  },
  {
    icon: Users,
    number: "50M+",
    label: "Üretilen Ürün",
    description: "Yıllık toplam üretim kapasitesi"
  },
  {
    icon: Award,
    number: "15+",
    label: "Yıllık Deneyim",
    description: "Sektördeki uzmanlık birikimi"
  },
  {
    icon: TrendingUp,
    number: "%98",
    label: "Müşteri Memnuniyeti",
    description: "Sürekli kalite ve hizmet anlayışı"
  }
];

export default function References() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Referanslarımız ve Başarı Hikayeleri
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Türkiye'nin önde gelen şirketleriyle gerçekleştirdiğimiz projeler ve 
              müşterilerimizin başarı hikayeleri
            </p>
          </div>
        </div>
      </div>

      {/* Achievements Section */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {achievements.map((achievement, index) => (
            <div key={index} className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <achievement.icon className="w-10 h-10 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {achievement.number}
              </div>
              <div className="text-lg font-semibold text-gray-800 mb-1">
                {achievement.label}
              </div>
              <div className="text-sm text-gray-600">
                {achievement.description}
              </div>
            </div>
          ))}
        </div>

        {/* Client References */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Kurumsal Müşterilerimiz</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {clientReferences.map((client) => (
              <Card key={client.id} className="hover:shadow-lg transition-shadow duration-300">
                <div className="relative">
                  <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-blue-600" />
                  </div>
                  <Badge className="absolute top-4 right-4 bg-green-500">
                    {client.sector}
                  </Badge>
                </div>
                
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {client.name}
                  </h3>
                  <h4 className="text-lg font-semibold text-blue-600 mb-3">
                    {client.project}
                  </h4>
                  <p className="text-gray-600 text-sm mb-4">
                    {client.description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Sonuç:</span>
                      <span className="font-medium text-green-600">{client.result}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Hacim:</span>
                      <span className="font-medium">{client.volume}</span>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    <ArrowRight className="w-4 h-4 mr-2" />
                    Detayları Gör
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Müşteri Yorumları</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative">
                <CardContent className="p-6">
                  <Quote className="w-8 h-8 text-blue-400 mb-4" />
                  <p className="text-gray-700 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.position}
                      </div>
                      <div className="text-sm text-blue-600 font-medium">
                        {testimonial.company}
                      </div>
                    </div>
                    
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="bg-white rounded-2xl p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Sertifikalarımız ve Kalite Standartlarımız</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">ISO 9001:2015</h3>
              <p className="text-sm text-gray-600">Kalite Yönetim Sistemi</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">ISO 14001</h3>
              <p className="text-sm text-gray-600">Çevre Yönetim Sistemi</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">FSC Sertifikası</h3>
              <p className="text-sm text-gray-600">Sürdürülebilir Orman Yönetimi</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">OHSAS 18001</h3>
              <p className="text-sm text-gray-600">İş Sağlığı ve Güvenliği</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Siz de Başarı Hikayemizin Parçası Olun</h2>
          <p className="text-xl mb-6 opacity-90">
            Projeleriniz için profesyonel çözümler ve kaliteli hizmet
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="secondary">
              Referans Talebi
            </Button>
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              İletişime Geçin
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}