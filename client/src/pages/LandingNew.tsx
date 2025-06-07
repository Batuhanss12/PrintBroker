import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  ShoppingCart,
  Star,
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  Clock,
  Shield,
  Truck,
  FileText,
  Users,
  Building2,
  TrendingUp,
  Zap,
  Target,
  Award,
  Package,
  Factory,
  Layers,
  Sparkles,
  ArrowRight,
  Play,
  Eye,
  Download,
  Calculator,
  Crown,
  User,
  Menu,
  X,
  Globe,
  Palette,
  Printer,
  MessageSquare,
  BarChart3,
  DollarSign,
  Home,
  LogIn
} from "lucide-react";

export default function LandingNew() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [liveJobs, setLiveJobs] = useState<any[]>([]);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Professional product categories inspired by leading platforms
  const productCategories = [
    {
      id: "business-cards",
      title: "Profesyonel Kartvizitler",
      description: "Premium kartvizit çözümleri - 300gr kuşe, laminasyon ve özel kesim seçenekleri",
      image: "/api/placeholder/400/300",
      priceRange: "0.45₺ - 3.50₺",
      minOrder: "100 adet",
      delivery: "24-48 saat",
      features: ["UV Lak", "Laminasyon", "Özel Kesim", "Emboss"],
      category: "corporate",
      seoKeywords: ["kartvizit baskı", "profesyonel kartvizit", "kurumsal kartvizit"]
    },
    {
      id: "labels-stickers",
      title: "Etiket & Sticker Çözümleri",
      description: "Endüstriyel kalite etiketler - Su geçirmez, UV dayanıklı, hologram güvenlik",
      image: "/api/placeholder/400/300",
      priceRange: "0.08₺ - 2.50₺",
      minOrder: "500 adet",
      delivery: "24-72 saat",
      features: ["Su Geçirmez", "UV Dayanıklı", "Hologram", "Şeffaf/Mat"],
      category: "industrial",
      seoKeywords: ["etiket baskı", "sticker baskı", "güvenlik etiket"]
    },
    {
      id: "brochures-catalogs",
      title: "Broşür & Katalog Baskı",
      description: "Yüksek kalite broşür ve kataloglar - Premium kağıt, spot UV, ciltleme",
      image: "/api/placeholder/400/300",
      priceRange: "2.50₺ - 25.00₺",
      minOrder: "100 adet",
      delivery: "3-5 iş günü",
      features: ["Spot UV", "Ciltleme", "Premium Kağıt", "Tel Dikiş"],
      category: "corporate",
      seoKeywords: ["broşür baskı", "katalog baskı", "tanıtım materyali"]
    },
    {
      id: "packaging",
      title: "Ambalaj & Kutu Çözümleri",
      description: "Özel tasarım ambalajlar - Mukavva kutu, lüks ambalaj, eco-friendly seçenekler",
      image: "/api/placeholder/400/300",
      priceRange: "1.50₺ - 45.00₺",
      minOrder: "250 adet",
      delivery: "5-7 iş günü",
      features: ["Mukavva", "Lüks Finish", "Eco-Friendly", "Özel Tasarım"],
      category: "packaging",
      seoKeywords: ["ambalaj baskı", "kutu baskı", "özel ambalaj"]
    },
    {
      id: "banners-signage",
      title: "Banner & Tabela Sistemleri",
      description: "Açık hava reklamları - Dijital baskı, hava koşullarına dayanıklı malzemeler",
      image: "/api/placeholder/400/300",
      priceRange: "15.00₺ - 500.00₺",
      minOrder: "1 adet",
      delivery: "2-5 iş günü",
      features: ["Hava Dayanıklı", "UV Print", "Büyük Format", "Montaj Hizmeti"],
      category: "outdoor",
      seoKeywords: ["banner baskı", "tabela baskı", "açık hava reklamı"]
    },
    {
      id: "textile-printing",
      title: "Tekstil & Promosyon",
      description: "T-shirt, forma ve promosyon ürünleri - DTG, transfer, nakış seçenekleri",
      image: "/api/placeholder/400/300",
      priceRange: "12.00₺ - 85.00₺",
      minOrder: "25 adet",
      delivery: "5-10 iş günü",
      features: ["DTG Baskı", "Transfer", "Nakış", "Özel Tasarım"],
      category: "textile",
      seoKeywords: ["tekstil baskı", "tişört baskı", "promosyon ürünleri"]
    }
  ];

  // Enhanced platform features emphasizing automated design system
  const platformFeatures = [
    {
      icon: Sparkles,
      title: "Kredili Tasarım Sistemi",
      description: "Müşteriler için tasarım başına 35₺ ödeme sistemi - Geniş firma ağına erişim",
      benefit: "Kullandığın kadar öde"
    },
    {
      icon: Zap,
      title: "60 Saniyede Teklif",
      description: "Yapay zeka sistemi ile 500+ üretici firmadan otomatik teklif alın",
      benefit: "90% zaman tasarrufu"
    },
    {
      icon: TrendingUp,
      title: "Maliyet Optimizasyonu",
      description: "Akıllı algoritma ile en uygun fiyat ve kalite dengesini otomatik bulur",
      benefit: "40% maliyet tasarrufu"
    },
    {
      icon: Shield,
      title: "Kurumsal Güvence",
      description: "ISO 9001 sertifikalı üretici firmalar, tam sigorta koruması",
      benefit: "Risk-free işletme"
    }
  ];

  // Live job tracking
  useEffect(() => {
    const fetchLiveJobs = async () => {
      try {
        const response = await fetch('/api/quotes/live-feed');
        if (response.ok) {
          const data = await response.json();
          setLiveJobs(data.quotes || []);
        }
      } catch (error) {
        console.error('Live jobs fetch error:', error);
      }
    };

    fetchLiveJobs();
    const interval = setInterval(fetchLiveJobs, 30000);
    
    const jobRotation = setInterval(() => {
      setCurrentJobIndex((prev) => liveJobs.length > 0 ? (prev + 1) % liveJobs.length : 0);
    }, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(jobRotation);
    };
  }, [liveJobs.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* SEO Optimized Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Printer className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MatBixx</h1>
                <p className="text-xs text-gray-500 leading-none">Profesyonel Baskı Platformu</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/products" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Ürünler
              </Link>
              <Link href="/printers" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Matbaacılar
              </Link>
              <Link href="/references" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Referanslar
              </Link>
              <Link href="/blog" className="text-gray-700 hover:text-blue-600 font-medium transition-colors">
                Blog
              </Link>
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Ürün ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-gray-50 border-gray-200 focus:bg-white focus:border-blue-500"
                />
              </div>

              {/* Live Activity */}
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-700">
                  {liveJobs.length} Aktif İş
                </span>
              </div>

              {/* Active Login Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6">
                    <LogIn className="h-4 w-4 mr-2" />
                    Panel Girişi
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <div className="px-4 py-3 border-b">
                    <p className="font-semibold text-gray-900">Panel Türü Seçin</p>
                  </div>
                  <DropdownMenuItem 
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50" 
                    onClick={() => {
                      window.location.href = '/customer-dashboard';
                    }}
                  >
                    <User className="h-4 w-4 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">Müşteri Paneli</div>
                      <div className="text-sm text-gray-500">Teklif alın, siparişlerinizi takip edin</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="px-4 py-3 cursor-pointer hover:bg-orange-50" 
                    onClick={() => {
                      window.location.href = '/printer-dashboard';
                    }}
                  >
                    <Building2 className="h-4 w-4 mr-3 text-orange-600" />
                    <div>
                      <div className="font-medium">Üretici Paneli</div>
                      <div className="text-sm text-gray-500">Teklifler verin, işlerinizi yönetin</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="px-4 py-3 cursor-pointer hover:bg-purple-50" 
                    onClick={() => {
                      window.location.href = '/admin-dashboard';
                    }}
                  >
                    <Factory className="h-4 w-4 mr-3 text-purple-600" />
                    <div>
                      <div className="font-medium">Admin Paneli</div>
                      <div className="text-sm text-gray-500">Platform yönetimi</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="px-4 py-3 cursor-pointer hover:bg-gray-100" 
                    onClick={() => {
                      window.location.href = '/customer-register';
                    }}
                  >
                    <User className="h-4 w-4 mr-3 text-green-600" />
                    <div>
                      <div className="font-medium">Yeni Müşteri Kaydı</div>
                      <div className="text-sm text-gray-500">Kredili sistem - 35₺/tasarım</div>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="px-4 py-3 cursor-pointer hover:bg-gray-100" 
                    onClick={() => {
                      window.location.href = '/printer-register';
                    }}
                  >
                    <Building2 className="h-4 w-4 mr-3 text-teal-600" />
                    <div>
                      <div className="font-medium">Üretici Firma Kaydı</div>
                      <div className="text-sm text-gray-500">Geniş müşteri portföyüne erişim - 2999₺/ay</div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 text-gray-700"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <div className="flex flex-col space-y-3">
                <div className="px-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Ürün ara..."
                      className="pl-10 w-full"
                    />
                  </div>
                </div>
                <Link href="/products" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium">
                  Ürünler
                </Link>
                <Link href="/printers" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium">
                  Matbaacılar
                </Link>
                <Link href="/references" className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium">
                  Referanslar
                </Link>
                <div className="px-4 pt-2 border-t border-gray-200 space-y-2">
                  <div className="text-sm font-medium text-gray-900 mb-3">Panel Girişi</div>
                  
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white justify-start" 
                    onClick={() => {
                      window.location.href = '/customer-dashboard';
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Müşteri Paneli
                  </Button>
                  
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white justify-start" 
                    onClick={() => {
                      window.location.href = '/printer-dashboard';
                    }}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Üretici Paneli
                  </Button>
                  
                  <Button 
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white justify-start" 
                    onClick={() => {
                      window.location.href = '/admin-dashboard';
                    }}
                  >
                    <Factory className="h-4 w-4 mr-2" />
                    Admin Paneli
                  </Button>
                  
                  <div className="border-t border-gray-200 my-2"></div>
                  <div className="text-sm font-medium text-gray-900 mb-3">Yeni Kayıt</div>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => {
                      window.location.href = '/customer-register';
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Müşteri Kaydı (35₺/tasarım)
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full justify-start" 
                    onClick={() => {
                      window.location.href = '/printer-register';
                    }}
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Üretici Kaydı (2999₺/ay)
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section - SEO Optimized */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-800 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4 mr-2" />
                Türkiye'nin #1 B2B Baskı Platformu
              </div>
              
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-6">
                Otomatik Tasarım Sistemi ile
                <span className="text-blue-600 block">Kurumsal Baskı Çözümleri</span>
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                AI destekli otomatik tasarım motoru ile profesyonel tasarımlar anında oluşturulur. 
                500+ üretici firmadan 60 saniyede teklif alın, %40 maliyet tasarrufu sağlayın.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                  onClick={() => window.location.href = '/customer-register'}
                >
                  <Sparkles className="h-5 w-5 mr-2" />
                  Kredili Tasarım Başlat
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 px-8 py-3"
                  onClick={() => window.location.href = '/products'}
                >
                  <Calculator className="h-5 w-5 mr-2" />
                  Anında Teklif Al
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 px-8 py-3"
                  onClick={() => window.open('https://www.youtube.com/watch?v=demo', '_blank')}
                >
                  <Play className="h-5 w-5 mr-2" />
                  Demo İzle
                </Button>
              </div>

              {/* Corporate Trust Indicators */}
              <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Üretici Firma</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">Fortune 500</div>
                  <div className="text-sm text-gray-600">Kurumsal Müşteri</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">%40</div>
                  <div className="text-sm text-gray-600">Maliyet Tasarrufu</div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual/Live Feed */}
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Canlı İş Takibi</h3>
                  <Badge className="bg-green-100 text-green-800">Canlı</Badge>
                </div>
                
                {liveJobs.length > 0 && (
                  <div className="space-y-3">
                    {liveJobs.slice(0, 3).map((job, index) => (
                      <div key={job.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900 truncate">
                            {job.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {job.location} • {job.time}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{job.amount}</div>
                          <div className="text-xs text-gray-500">{job.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-4 text-center">
                  <Button variant="ghost" size="sm" className="text-blue-600">
                    Tüm İşleri Görüntüle
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories - SEO Optimized */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Profesyonel Baskı Çözümleri
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Her sektöre özel, ISO 9001 kalite standardında baskı hizmetleri
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {productCategories.map((category) => (
              <Card key={category.id} className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <div className="relative overflow-hidden rounded-t-lg">
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Package className="h-20 w-20 text-blue-600 opacity-20" />
                  </div>
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-white/90 text-gray-700">
                      {category.category === 'corporate' && 'Kurumsal'}
                      {category.category === 'industrial' && 'Endüstriyel'}
                      {category.category === 'packaging' && 'Ambalaj'}
                      {category.category === 'outdoor' && 'Dış Mekan'}
                      {category.category === 'textile' && 'Tekstil'}
                    </Badge>
                  </div>
                </div>
                
                <CardHeader>
                  <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {category.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Pricing */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Fiyat Aralığı:</span>
                    <span className="font-semibold text-green-600">{category.priceRange}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Min. Sipariş:</span>
                    <span className="font-medium text-gray-900">{category.minOrder}</span>
                  </div>

                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Özellikler:</h4>
                    <div className="flex flex-wrap gap-1">
                      {category.features.map((feature, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-4">
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                      <Calculator className="h-4 w-4 mr-1" />
                      Teklif Al
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Örnekler
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Automated Design System Showcase */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-blue-600 rounded-full text-white text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4 mr-2" />
              Otomatik Tasarım Teknolojisi
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              AI Destekli Otomatik Tasarım Sistemi
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Kurumsal firmalar için özel geliştirilen yapay zeka sistemi ile 
              profesyonel tasarımlar anında oluşturulur, tasarım maliyetiniz sıfırlanır.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Firmalar İçin Özel Avantajlar
              </h3>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Kredili Tasarım Sistemi</h4>
                    <p className="text-gray-600">AI sistemi ile profesyonel tasarımlar kredi sistemi ile oluşturulur. Aylık 2999₺ paket ile sınırsız tasarım.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">%90 Süreç Hızlanması</h4>
                    <p className="text-gray-600">Geleneksel 2-3 haftalık süreçler 1 saate düşer, işletme verimliliği maksimuma çıkar.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Kurumsal Kalite Garantisi</h4>
                    <p className="text-gray-600">Fortune 500 standartlarında tasarım kalitesi, marka imajınızı güçlendirir.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Otomatik Tasarım Süreci</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">1</div>
                  <span className="text-gray-700">Ürün ve marka bilgilerinizi sisteme girin</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white text-sm font-bold">2</div>
                  <span className="text-gray-700">AI sistemi 30 saniyede profesyonel tasarım oluşturur</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">3</div>
                  <span className="text-gray-700">500+ üretici firmadan otomatik teklif alırsınız</span>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                  <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white text-sm font-bold">4</div>
                  <span className="text-gray-700">En uygun teklifi seçip üretimi başlatın</span>
                </div>
              </div>
              
              <Button 
                className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                onClick={() => window.location.href = '/customer-register'}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Kredili Tasarım Sistemini Başlat
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Kurumsal Firmalar Neden MatBixx Tercih Ediyor?
            </h2>
            <p className="text-xl text-gray-600">
              İşletme verimliliği ve maliyet optimizasyonu odaklı çözümler
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {platformFeatures.map((feature, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                  {feature.description}
                </p>
                <div className="inline-flex items-center px-3 py-1 bg-green-100 rounded-full">
                  <span className="text-xs font-medium text-green-800">
                    {feature.benefit}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Baskı İhtiyaçlarınız İçin Hemen Başlayın
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Ücretsiz hesap oluşturun ve ilk siparişinizde %20 indirim kazanın
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3"
              onClick={() => window.location.href = '/customer-register'}
            >
              Firma Hesabı Aç (2999₺/ay)
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3"
              onClick={() => window.location.href = '/printer-register'}
            >
              Üretici Firma Katıl
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Printer className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold">MatBixx</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Türkiye'nin en güvenilir B2B baskı platformu. 
                Professional printing solutions for businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Ürünler</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Kartvizit Baskı</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Etiket & Sticker</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Broşür & Katalog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Ambalaj Çözümleri</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Matbaa Ol</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Fiyatlandırma</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Dokümantasyonu</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Kalite Standartları</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">İletişim</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  0850 XXX XX XX
                </li>
                <li className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  info@matbixx.com
                </li>
                <li className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  İstanbul, Türkiye
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-400">
              © 2024 MatBixx. Tüm hakları saklıdır.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                Gizlilik Politikası
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                Kullanım Koşulları
              </a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                KVKK
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}