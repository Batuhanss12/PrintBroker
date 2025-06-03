
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Lock, 
  Check, 
  AlertCircle,
  Building2,
  Users,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  companyName?: string;
  taxNumber?: string;
}

export default function Payment() {
  const [searchParams] = useSearchParams();
  const planType = searchParams.get("plan") || "customer";
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<PaymentFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    companyName: "",
    taxNumber: ""
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");

  const plans = {
    customer: {
      name: "Müşteri Paketi",
      price: 0,
      description: "Kredili sistem - Kullandığın kadar öde",
      icon: <Users className="h-6 w-6" />,
      features: ["Sınırsız teklif alma", "AI destekli tasarım", "100MB dosya yükleme", "Gerçek zamanlı takip", "7/24 canlı destek"]
    },
    firm: {
      name: "Firma Paketi",
      price: 299,
      description: "Aylık abonelik sistemi",
      icon: <Building2 className="h-6 w-6" />,
      features: ["Sınırsız teklif verme", "Gelişmiş analitik dashboard", "Müşteri değerlendirme sistemi", "Otomatik sipariş yönetimi", "Premium öncelikli destek"]
    }
  };

  const currentPlan = plans[planType as keyof typeof plans] || plans.customer;

  const handleInputChange = (field: keyof PaymentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const required = ["firstName", "lastName", "email", "phone", "address", "city", "postalCode"];
    
    if (planType === "firm") {
      required.push("companyName", "taxNumber");
    }

    for (const field of required) {
      if (!formData[field as keyof PaymentFormData]) {
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

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      // PayTR payment request
      const paymentData = {
        planType,
        amount: currentPlan.price,
        customer: formData,
        paymentMethod
      };

      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to PayTR payment page
        window.location.href = result.paymentUrl;
      } else {
        throw new Error(result.message || "Ödeme hatası");
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast({
        title: "Ödeme Hatası",
        description: "Ödeme işlemi başlatılamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
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
          
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Güvenli Ödeme
          </h1>
          <p className="text-lg text-gray-600">
            SSL sertifikası ile korunan güvenli ödeme sistemi
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Payment Form */}
          <Card className="shadow-xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-green-600" />
                Ödeme Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Kişisel Bilgiler</h3>
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

              {/* Company Information (for firm plan) */}
              {planType === "firm" && (
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
                </div>
              )}

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

              {/* Payment Method */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Ödeme Yöntemi</h3>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Kredi Kartı
                      </div>
                    </SelectItem>
                    <SelectItem value="bank_transfer">
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        Banka Havalesi
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Security Notice */}
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  Ödeme işleminiz SSL sertifikası ile korunmaktadır. 
                  Kart bilgileriniz güvenli PayTR altyapısı üzerinden işlenmektedir.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="shadow-xl border-0 h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                {currentPlan.icon}
                <span className="ml-2">Sipariş Özeti</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Details */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{currentPlan.name}</h3>
                  {planType === "firm" && (
                    <Badge className="bg-orange-500">EN POPÜLER</Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-4">{currentPlan.description}</p>
                
                <ul className="space-y-2">
                  {currentPlan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                        <Check className="h-2.5 w-2.5 text-green-600" />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Plan Ücreti</span>
                  <span className="font-semibold">
                    {currentPlan.price === 0 ? "Ücretsiz" : `₺${currentPlan.price}`}
                  </span>
                </div>
                
                {planType === "firm" && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">KDV (%20)</span>
                      <span className="font-semibold">₺{(currentPlan.price * 0.2).toFixed(2)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Toplam</span>
                      <span className="text-orange-600">₺{(currentPlan.price * 1.2).toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Button */}
              <Button
                onClick={handlePayment}
                disabled={isLoading || currentPlan.price === 0}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                size="lg"
              >
                {isLoading ? (
                  "İşleniyor..."
                ) : currentPlan.price === 0 ? (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Ücretsiz Başla
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Güvenli Ödeme Yap
                  </>
                )}
              </Button>

              {/* Trust Indicators */}
              <div className="text-center text-sm text-gray-500">
                <div className="flex items-center justify-center space-x-4 mb-2">
                  <div className="flex items-center">
                    <Lock className="h-4 w-4 mr-1 text-green-600" />
                    <span>SSL Güvenli</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="h-4 w-4 mr-1 text-green-600" />
                    <span>PayTR Güvencesi</span>
                  </div>
                </div>
                <p>256-bit SSL şifreleme ile korunmaktadır</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
