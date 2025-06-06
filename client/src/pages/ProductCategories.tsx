import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Package, 
  CreditCard, 
  Calendar,
  Palette,
  Truck,
  Star,
  CheckCircle
} from "lucide-react";

const productCategories = [
  {
    id: "etiket-sticker",
    title: "Etiket & Sticker",
    description: "Ürün etiketleri, marka çıkartmaları ve özel tasarım stickerlar",
    image: "/api/placeholder/400/250",
    features: ["Su geçirmez", "UV dayanıklı", "Çıkarılabilir", "Şeffaf seçenekler"],
    priceRange: "0.10₺ - 5.00₺",
    materials: ["Vinyl", "Polyester", "Kağıt", "Hologram"],
    applications: ["Ürün ambalajı", "Promosyon", "Güvenlik", "Dekorasyon"]
  },
  {
    id: "kartvizit-katalog",
    title: "Kartvizit & Katalog",
    description: "Profesyonel kartvizitler, kataloglar ve kurumsal materyaller",
    image: "/api/placeholder/400/250",
    features: ["Mat/Parlak laminasyon", "Özel kesim", "Emboss", "UV lakk"],
    priceRange: "0.50₺ - 15.00₺",
    materials: ["Kuşe kağıt", "Bristol", "Kraft", "Özel dokulu"],
    applications: ["Networking", "Ürün tanıtımı", "Kurumsal kimlik", "Satış"]
  },
  {
    id: "ambalaj-poset",
    title: "Ambalaj & Poşet",
    description: "Özel tasarım ambalajlar, plastik ve kağıt poşetler",
    image: "/api/placeholder/400/250",
    features: ["Eco-friendly", "Güçlü tutamak", "Su geçirmez", "Baskı garantisi"],
    priceRange: "0.25₺ - 8.00₺",
    materials: ["Kraft kağıt", "Plastik", "Non-woven", "Biyoplastik"],
    applications: ["Retail", "E-ticaret", "Kargo", "Hediye ambalajı"]
  },
  {
    id: "tabela-banner",
    title: "Tabela & Banner",
    description: "Dış mekan tabelaları, reklam bannerları ve dijital baskılar",
    image: "/api/placeholder/400/250",
    features: ["Hava koşullarına dayanıklı", "LED aydınlatma", "Çift taraflı", "Esnek montaj"],
    priceRange: "25.00₺ - 500.00₺",
    materials: ["Forex", "Alüminyum", "Pleksi", "PVC Banner"],
    applications: ["Dış mekan reklamı", "Etkinlik", "Navigasyon", "Promosyon"]
  },
  {
    id: "tekstil-baski",
    title: "Tekstil Baskı",
    description: "T-shirt, hoodie, çanta ve tekstil ürünlerinde özel baskılar",
    image: "/api/placeholder/400/250",
    features: ["Yıkama garantisi", "Esnek baskı", "Çok renkli", "Hızlı teslimat"],
    priceRange: "15.00₺ - 75.00₺",
    materials: ["Pamuk", "Polyester", "Karışım kumaş", "Canvas"],
    applications: ["Kurumsal promosyon", "Etkinlik", "Takım kıyafeti", "Hediye"]
  },
  {
    id: "ozel-proje",
    title: "Özel Projeler",
    description: "Büyük hacimli işler ve özelleştirilmiş üretim çözümleri",
    image: "/api/placeholder/400/250",
    features: ["Özel tasarım", "Prototip", "Seri üretim", "Kalite kontrol"],
    priceRange: "Teklif alın",
    materials: ["Müşteri talebi", "Premium malzemeler", "İthal seçenekler"],
    applications: ["Kurumsal projeler", "Franchise", "İhracat", "Özel etkinlikler"]
  }
];

export default function ProductCategories() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Profesyonel Baskı Çözümleri
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            İşletmenizin her ihtiyacına uygun, kaliteli ve hızlı baskı hizmetleri. 
            Uzman ekibimiz ve modern teknolojimizle projelerinizi hayata geçiriyoruz.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {productCategories.map((category) => (
            <Card key={category.id} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur">
              <div className="relative overflow-hidden rounded-t-lg">
                <div className="w-full h-48 bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                  <Package className="w-16 h-16 text-blue-600" />
                </div>
                <Badge className="absolute top-4 right-4 bg-green-500">
                  Popüler
                </Badge>
              </div>
              
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-blue-600 transition-colors">
                  {category.title}
                </CardTitle>
                <p className="text-gray-600 text-sm">
                  {category.description}
                </p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Price Range */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Fiyat Aralığı:</span>
                  <span className="font-semibold text-green-600">{category.priceRange}</span>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Özellikler:</h4>
                  <div className="flex flex-wrap gap-1">
                    {category.features.map((feature, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Materials */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Malzemeler:</h4>
                  <p className="text-sm text-gray-600">{category.materials.join(", ")}</p>
                </div>

                {/* Applications */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Kullanım Alanları:</h4>
                  <p className="text-sm text-gray-600">{category.applications.join(", ")}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  <Button className="flex-1" size="sm">
                    <FileText className="w-4 h-4 mr-2" />
                    Teklif Al
                  </Button>
                  <Button variant="outline" size="sm">
                    <Palette className="w-4 h-4 mr-2" />
                    Örnekler
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Service Features */}
        <div className="bg-white/80 backdrop-blur rounded-2xl p-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Neden Matbixx?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-2">Kalite Garantisi</h3>
              <p className="text-sm text-gray-600">ISO sertifikalı üretim ve %100 kalite kontrolü</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold mb-2">Hızlı Teslimat</h3>
              <p className="text-sm text-gray-600">24-48 saat içinde kapınızda</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-2">Özel Tasarım</h3>
              <p className="text-sm text-gray-600">Uzman tasarım ekibi desteği</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-2">Esnek Ödeme</h3>
              <p className="text-sm text-gray-600">Taksit seçenekleri ve kurumsal anlaşmalar</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Projenizi Gerçekleştirmeye Hazır mısınız?</h2>
          <p className="text-xl mb-6 opacity-90">
            Uzman ekibimizle iletişime geçin, size özel çözümler geliştirelim
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-blue-600">
              <FileText className="w-5 h-5 mr-2" />
              Hızlı Teklif Al
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}