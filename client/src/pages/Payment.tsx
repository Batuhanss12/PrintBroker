import { useState, useEffect } from "react";
import { useSearch, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
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
  ArrowLeft,
  Gift,
  Star
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PrintSpinner } from "@/components/PrintingLoaders";

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
  const search = useSearch();
  const searchParams = new URLSearchParams(search);
  const planType = searchParams.get("plan") || "customer";
  const { toast } = useToast();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  
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
  const [selectedAmount, setSelectedAmount] = useState(500);
  const [cardData, setCardData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: ''
  });

  const creditAmounts = [
    { amount: 500, bonus: 0, label: "500₺" },
    { amount: 1000, bonus: 50, label: "1000₺", bonusLabel: "+50₺ Bonus" },
    { amount: 2000, bonus: 150, label: "2000₺", bonusLabel: "+150₺ Bonus" },
    { amount: 5000, bonus: 500, label: "5000₺", bonusLabel: "+500₺ Bonus" }
  ];

  const plans = {
    customer: {
      name: "Kredi Yükleme",
      description: "Hesabınıza kredi yükleyin",
      icon: <CreditCard className="h-6 w-6" />,
      isCredit: true
    },
    firm: {
      name: "Firma Paketi",
      price: 2999,
      description: "Aylık abonelik sistemi",
      icon: <Building2 className="h-6 w-6" />,
      features: ["Yoğun müşteri portföyü yönetimi", "Gelişmiş analitik dashboard", "Otomatik sipariş ve teklif yönetimi", "Müşteri CRM entegrasyonu", "Premium öncelikli destek"]
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

    // Card validation for credit card payment
    if (paymentMethod === "credit_card") {
      if (!cardData.cardNumber || cardData.cardNumber.length < 16) {
        toast({
          title: "Geçersiz Kart Numarası",
          description: "Lütfen geçerli bir kart numarası girin.",
          variant: "destructive",
        });
        return false;
      }
      if (!cardData.expiryDate || !cardData.cvv || !cardData.cardName) {
        toast({
          title: "Eksik Kart Bilgisi",
          description: "Lütfen tüm kart bilgilerini doldurun.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  // Load user data automatically
  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        address: "",
        city: "",
        postalCode: "",
        companyName: user.companyName || "",
        taxNumber: ""
      }));
    }
  }, [isAuthenticated, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Giriş Gerekli</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Ödeme işlemi için giriş yapmanız gerekiyor.
            </p>
            <div className="space-y-2">
              <Link href="/">
                <Button variant="outline" className="w-full">
                  Ana Sayfaya Dön
                </Button>
              </Link>
              <Button 
                variant="outline"
                onClick={() => window.location.href = "/api/login"}
                className="w-full"
              >
                Giriş Yap
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      const finalAmount = planType === 'customer' ? selectedAmount : (currentPlan as any).price;
      
      const paymentData = {
        planType,
        amount: finalAmount,
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
        toast({
          title: "Kredi Yükleme Başarılı",
          description: result.message || "Kredi hesabınıza eklendi",
        });
        
        // Başarılı ödeme sonrası dashboard'a yönlendir
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      } else {
        toast({
          title: "Ödeme Hatası",
          description: result.message || "Ödeme işlemi başlatılamadı",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Bağlantı Hatası",
        description: "Lütfen internet bağlantınızı kontrol edin",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCreditAmount = creditAmounts.find(c => c.amount === selectedAmount);
  const totalAmount = selectedAmount + (selectedCreditAmount?.bonus || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={user?.role === 'customer' ? '/customer-dashboard' : '/printer-dashboard'}>
            <Button variant="outline" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{currentPlan.name}</h1>
          <p className="text-gray-600 mt-2">{currentPlan.description}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Plan Details & Credit Selection */}
          <div className="space-y-6">
            {planType === 'customer' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Kredi Tutarı Seçin
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {creditAmounts.map((credit) => (
                      <Button
                        key={credit.amount}
                        variant={selectedAmount === credit.amount ? "default" : "outline"}
                        className={`h-20 flex flex-col items-center justify-center relative ${
                          selectedAmount === credit.amount 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'hover:bg-blue-50'
                        }`}
                        onClick={() => setSelectedAmount(credit.amount)}
                      >
                        <span className="text-lg font-bold">{credit.label}</span>
                        {credit.bonus > 0 && (
                          <div className="flex items-center gap-1 mt-1">
                            <Gift className="h-3 w-3" />
                            <span className="text-xs">{credit.bonusLabel}</span>
                          </div>
                        )}
                        {selectedAmount === credit.amount && (
                          <div className="absolute top-1 right-1">
                            <Check className="h-4 w-4" />
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                  
                  {selectedCreditAmount && selectedCreditAmount.bonus > 0 && (
                    <Alert className="mt-4 border-green-200 bg-green-50">
                      <Gift className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        <strong>{selectedAmount}₺</strong> yükleyip <strong>+{selectedCreditAmount.bonus}₺</strong> bonus kazanın!
                        Toplam: <strong>{totalAmount}₺</strong>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Payment Method */}
            <Card>
              <CardHeader>
                <CardTitle>Ödeme Yöntemi</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Kredi Kartı</SelectItem>
                    <SelectItem value="bank_transfer">Havale/EFT</SelectItem>
                  </SelectContent>
                </Select>

                {paymentMethod === "credit_card" && (
                  <div className="mt-4 space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Test Modu:</strong> Aşağıdaki test kart bilgilerini kullanın:<br/>
                        <strong>Kart No:</strong> 4355084355084358<br/>
                        <strong>CVV:</strong> 000<br/>
                        <strong>Son Kullanma:</strong> Herhangi bir tarih
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <Label htmlFor="cardNumber">Kart Numarası</Label>
                      <Input
                        id="cardNumber"
                        placeholder="4355 0843 5508 4358 (Test kartı)"
                        value={cardData.cardNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 16);
                          const formatted = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                          setCardData(prev => ({ ...prev, cardNumber: formatted }));
                        }}
                        maxLength={19}
                      />
                      <Button 
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-1 text-xs"
                        onClick={() => setCardData(prev => ({ ...prev, cardNumber: '4355 0843 5508 4358' }))}
                      >
                        Test Kartını Kullan
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiryDate">Son Kullanma Tarihi</Label>
                        <Input
                          id="expiryDate"
                          placeholder="MM/YY"
                          value={cardData.expiryDate}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            const formatted = value.replace(/(\d{2})(?=\d)/, '$1/');
                            setCardData(prev => ({ ...prev, expiryDate: formatted }));
                          }}
                          maxLength={5}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="cvv">CVV</Label>
                        <Input
                          id="cvv"
                          placeholder="000 (Test CVV)"
                          value={cardData.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 3);
                            setCardData(prev => ({ ...prev, cvv: value }));
                          }}
                          maxLength={3}
                        />
                        <Button 
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-1 text-xs"
                          onClick={() => setCardData(prev => ({ 
                            ...prev, 
                            cardNumber: '4355 0843 5508 4358',
                            cvv: '000',
                            expiryDate: '12/25',
                            cardName: 'Test Kullanıcı'
                          }))}
                        >
                          Tüm Test Bilgilerini Doldur
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="cardName">Kart Üzerindeki İsim</Label>
                      <Input
                        id="cardName"
                        placeholder="Ad Soyad"
                        value={cardData.cardName}
                        onChange={(e) => setCardData(prev => ({ ...prev, cardName: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Billing Info & Summary */}
          <div className="space-y-6">
            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle>Fatura Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Ad *</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Soyad *</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange("lastName", e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">E-posta *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Telefon *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="address">Adres *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => handleInputChange("address", e.target.value)}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Şehir *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Posta Kodu *</Label>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      required
                    />
                  </div>
                </div>

                {planType === "firm" && (
                  <>
                    <div>
                      <Label htmlFor="companyName">Şirket Adı *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange("companyName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="taxNumber">Vergi Numarası *</Label>
                      <Input
                        id="taxNumber"
                        value={formData.taxNumber}
                        onChange={(e) => handleInputChange("taxNumber", e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Payment Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Ödeme Özeti
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {planType === 'customer' ? (
                    <>
                      <div className="flex justify-between">
                        <span>Kredi Tutarı:</span>
                        <span className="font-semibold">{selectedAmount}₺</span>
                      </div>
                      {selectedCreditAmount && selectedCreditAmount.bonus > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Bonus Kredi:</span>
                          <span className="font-semibold">+{selectedCreditAmount.bonus}₺</span>
                        </div>
                      )}
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Ödeme Tutarı:</span>
                        <span>{selectedAmount}₺</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-green-600">
                        <span>Hesabınıza Eklenecek:</span>
                        <span>{totalAmount}₺</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Paket:</span>
                        <span>{currentPlan.name}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Toplam:</span>
                        <span>{(currentPlan as any).price}₺</span>
                      </div>
                    </>
                  )}
                </div>

                <Alert className="mt-4">
                  <Lock className="h-4 w-4" />
                  <AlertDescription>
                    Ödemeniz SSL sertifikası ile korunmaktadır. Kart bilgileriniz güvenle şifrelenmektedir.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handlePayment}
                  disabled={isLoading}
                  className="w-full mt-6 h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <PrintSpinner size={20} color="#ffffff" />
                      <span>İşleminiz Gerçekleştiriliyor...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      <span>
                        {planType === 'customer' 
                          ? `${selectedAmount}₺ Öde` 
                          : `${(currentPlan as any).price}₺ Öde`
                        }
                      </span>
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}