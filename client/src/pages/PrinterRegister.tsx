
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Building2, 
  ArrowLeft, 
  Check, 
  AlertCircle,
  CreditCard,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PrinterFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  companyName: string;
  taxNumber: string;
  address: string;
  city: string;
  postalCode: string;
  description: string;
  website?: string;
}

export default function PrinterRegister() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<PrinterFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    taxNumber: "",
    address: "",
    city: "",
    postalCode: "",
    description: "",
    website: ""
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof PrinterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ["firstName", "lastName", "email", "phone", "companyName", "taxNumber", "address", "city", "postalCode", "description"];
    
    for (const field of required) {
      if (!formData[field as keyof PrinterFormData]) {
        toast({
          title: "Eksik Bilgi",
          description: "Lütfen tüm gerekli alanları doldurun.",
          variant: "destructive",
        });
        return false;
      }
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Geçersiz E-posta",
        description: "Lütfen geçerli bir e-posta adresi girin.",
        variant: "destructive",
      });
      return false;
    }

    // Phone validation
    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.phone.replace(/\s/g, ""))) {
      toast({
        title: "Geçersiz Telefon",
        description: "Lütfen geçerli bir telefon numarası girin.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'printer'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Kayıt Başarılı",
          description: "Matbaa hesabınız oluşturuldu, ana sayfaya yönlendiriliyorsunuz...",
        });
        
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        throw new Error(data.message || "Kayıt işlemi başarısız");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Kayıt Hatası",
        description: error.message || "Kayıt işlemi başarısız. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="absolute left-4 top-4 md:left-8 md:top-8"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri Dön
          </Button>
          
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Matbaa Partner Kayıt
          </h1>
          <p className="text-lg text-gray-600">
            Matbixx matbaa ağımıza katılın ve işinizi büyütün
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Registration Form */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Building2 className="h-5 w-5 mr-2 text-orange-600" />
                Kayıt Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Yetkili Kişi Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Ad *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      placeholder="Adınız"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Soyad *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      placeholder="Soyadınız"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="email">E-posta *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      placeholder="ornek@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="5XX XXX XX XX"
                    />
                  </div>
                </div>
              </div>

              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Firma Bilgileri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Firma Adı *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange("companyName", e.target.value)}
                      placeholder="Firma adınız"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxNumber">Vergi Numarası *</Label>
                    <Input
                      id="taxNumber"
                      value={formData.taxNumber}
                      onChange={(e) => handleInputChange("taxNumber", e.target.value)}
                      placeholder="Vergi numaranız"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="website">Web Sitesi (İsteğe Bağlı)</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => handleInputChange("website", e.target.value)}
                    placeholder="https://www.firmaniz.com"
                  />
                </div>
              </div>

              {/* Address Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Adres Bilgileri</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="address">Adres *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      placeholder="Tam adresiniz"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Şehir *</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange("city", e.target.value)}
                        placeholder="Şehriniz"
                      />
                    </div>
                    <div>
                      <Label htmlFor="postalCode">Posta Kodu *</Label>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange("postalCode", e.target.value)}
                        placeholder="34000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Firma Tanıtımı *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Firmanızın hizmetleri, deneyimi ve uzmanlaştığı alanlar hakkında bilgi verin..."
                  rows={4}
                />
              </div>

              {/* Terms Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Kayıt olarak Matbaa Partner Sözleşmesi'ni ve Kullanım Şartları'nı kabul etmiş olursunuz.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Package Benefits */}
          <Card className="shadow-xl border-0 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-orange-600" />
                Firma Paketi Avantajları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">Premium Üyelik</h3>
                  <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ₺2999/ay
                  </div>
                </div>
                <p className="text-gray-600 mb-4">Gelişmiş işletme yönetim sistemi</p>
                
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    </div>
                    <span>Yoğun müşteri portföyü yönetimi</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    </div>
                    <span>Gelişmiş analitik dashboard</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    </div>
                    <span>Otomatik sipariş ve teklif yönetimi</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    </div>
                    <span>Müşteri CRM entegrasyonu</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    </div>
                    <span>Premium öncelikli destek</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                      <Check className="h-2.5 w-2.5 text-green-600" />
                    </div>
                    <span>Öncelikli liste görünürlüğü</span>
                  </li>
                </ul>
              </div>

              {/* Registration Button */}
              <Button
                onClick={handleRegister}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                {isLoading ? (
                  "Yönlendiriliyor..."
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Kayıt Ol ve Öde
                  </>
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Zaten hesabınız var mı?{" "}
                  <button
                    onClick={() => window.location.href = "/api/login"}
                    className="text-orange-600 hover:text-orange-700 font-semibold"
                  >
                    Giriş Yapın
                  </button>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
