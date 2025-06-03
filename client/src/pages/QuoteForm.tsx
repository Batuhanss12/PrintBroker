
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import FileUpload from "@/components/FileUpload";
import DesignEngine from "@/components/DesignEngine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  LayoutGrid, 
  Disc, 
  Printer,
  AlertCircle,
  ArrowLeft,
  Send,
  Upload,
  Calculator,
  Palette,
  CheckCircle,
  Target,
  Zap,
  FileText,
  Wand2,
  Star
} from "lucide-react";
import { Link } from "wouter";

const quoteSchema = z.object({
  title: z.string().min(1, "Başlık gerekli"),
  type: z.enum(["sheet_label", "roll_label", "general_printing"]),
  specifications: z.record(z.any()),
  description: z.string().optional(),
  deadline: z.string().optional(),
  budget: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function QuoteForm() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const { type } = useParams();
  const queryClient = useQueryClient();
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [currentTab, setCurrentTab] = useState("details");
  const [formData, setFormData] = useState<any>({});

  const form = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      title: "",
      type: (type as any) || "sheet_label",
      specifications: {},
      description: "",
      deadline: "",
      budget: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const quoteData = {
        ...data,
        specifications: {
          ...data.specifications,
          ...formData,
          uploadedFiles,
        },
      };
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
      });
      if (!response.ok) {
        throw new Error(`${response.status}: ${response.statusText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Teklif talebiniz başarıyla gönderildi!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      form.reset();
      setUploadedFiles([]);
      setFormData({});
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Hata",
        description: "Teklif gönderilirken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    mutation.mutate(data);
  };

  const handleFileUpload = (fileId: string) => {
    setUploadedFiles(prev => [...prev, fileId]);
  };

  const updateFormData = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Erişim Reddedildi</h2>
              <p className="text-gray-600 mb-4">
                Bu sayfaya sadece müşteriler erişebilir.
              </p>
              <Button onClick={() => window.location.href = "/dashboard"}>
                Dashboard'a Dön
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getTypeConfig = () => {
    switch (type) {
      case 'sheet_label':
        return {
          title: 'Tabaka Etiket Teklifi',
          description: 'Profesyonel tabaka etiket baskısı için detaylı teklif',
          icon: <LayoutGrid className="h-8 w-8 text-white" />,
          color: 'blue',
          bgGradient: 'from-blue-500 to-indigo-600'
        };
      case 'roll_label':
        return {
          title: 'Rulo Etiket Teklifi',
          description: 'Endüstriyel rulo etiket çözümleri',
          icon: <Disc className="h-8 w-8 text-white" />,
          color: 'orange',
          bgGradient: 'from-orange-500 to-red-600'
        };
      case 'general_printing':
        return {
          title: 'Genel Baskı Teklifi',
          description: 'Katalog, broşür ve özel baskı projeleri',
          icon: <Printer className="h-8 w-8 text-white" />,
          color: 'green',
          bgGradient: 'from-green-500 to-emerald-600'
        };
      default:
        return {
          title: 'Teklif Talebi',
          description: 'Matbaa hizmetleri için teklif talebi',
          icon: <Printer className="h-8 w-8 text-white" />,
          color: 'blue',
          bgGradient: 'from-blue-500 to-indigo-600'
        };
    }
  };

  const typeConfig = getTypeConfig();

  const renderSheetLabelForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Etiket Boyutu</Label>
          <Select onValueChange={(value) => updateFormData('size', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Boyut seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10x15">10 x 15 mm</SelectItem>
              <SelectItem value="15x20">15 x 20 mm</SelectItem>
              <SelectItem value="20x30">20 x 30 mm</SelectItem>
              <SelectItem value="30x40">30 x 40 mm</SelectItem>
              <SelectItem value="40x60">40 x 60 mm</SelectItem>
              <SelectItem value="50x70">50 x 70 mm</SelectItem>
              <SelectItem value="70x100">70 x 100 mm</SelectItem>
              <SelectItem value="custom">Özel Boyut</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kağıt Türü</Label>
          <Select onValueChange={(value) => updateFormData('paperType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Kağıt türü seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coated-90">Kuşe Kağıt 90gr</SelectItem>
              <SelectItem value="coated-120">Kuşe Kağıt 120gr</SelectItem>
              <SelectItem value="coated-150">Kuşe Kağıt 150gr</SelectItem>
              <SelectItem value="bristol-160">Bristol Kağıt 160gr</SelectItem>
              <SelectItem value="bristol-200">Bristol Kağıt 200gr</SelectItem>
              <SelectItem value="sticker-white">Beyaz Sticker</SelectItem>
              <SelectItem value="sticker-transparent">Şeffaf Sticker</SelectItem>
              <SelectItem value="sticker-silver">Gümüş Sticker</SelectItem>
              <SelectItem value="kraft">Kraft Kağıt</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Miktar (Adet)</Label>
          <Select onValueChange={(value) => updateFormData('quantity', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Miktar seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100 Adet</SelectItem>
              <SelectItem value="250">250 Adet</SelectItem>
              <SelectItem value="500">500 Adet</SelectItem>
              <SelectItem value="1000">1.000 Adet</SelectItem>
              <SelectItem value="2500">2.500 Adet</SelectItem>
              <SelectItem value="5000">5.000 Adet</SelectItem>
              <SelectItem value="10000">10.000 Adet</SelectItem>
              <SelectItem value="custom">Özel Miktar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Renk Seçenekleri</Label>
          <Select onValueChange={(value) => updateFormData('color', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Renk seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4-0">4+0 (Tek Yüz Renkli)</SelectItem>
              <SelectItem value="4-4">4+4 (Çift Yüz Renkli)</SelectItem>
              <SelectItem value="1-0">1+0 (Tek Yüz Siyah)</SelectItem>
              <SelectItem value="1-1">1+1 (Çift Yüz Siyah)</SelectItem>
              <SelectItem value="pantone">Pantone Renk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Yüzey İşlemleri</Label>
          <Select onValueChange={(value) => updateFormData('surface', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Yüzey işlemi seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">İşlem Yok</SelectItem>
              <SelectItem value="cellophane-mat">Mat Selefon</SelectItem>
              <SelectItem value="cellophane-gloss">Parlak Selefon</SelectItem>
              <SelectItem value="uv-varnish">UV Vernik</SelectItem>
              <SelectItem value="gold-foil">Altın Yaldız</SelectItem>
              <SelectItem value="silver-foil">Gümüş Yaldız</SelectItem>
              <SelectItem value="emboss">Kabartma</SelectItem>
              <SelectItem value="deboss">Gömme</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kesim Türü</Label>
          <Select onValueChange={(value) => updateFormData('cutting', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Kesim türü seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="straight">Düz Kesim</SelectItem>
              <SelectItem value="die-cut">Özel Kesim (Kalıp)</SelectItem>
              <SelectItem value="round-corner">Köşe Yuvarlama</SelectItem>
              <SelectItem value="perforated">Perforeli</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.size === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="space-y-2">
            <Label>Özel Genişlik (mm)</Label>
            <Input 
              placeholder="Örn: 45" 
              onChange={(e) => updateFormData('customWidth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Özel Yükseklik (mm)</Label>
            <Input 
              placeholder="Örn: 65" 
              onChange={(e) => updateFormData('customHeight', e.target.value)}
            />
          </div>
        </div>
      )}

      {formData.quantity === 'custom' && (
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="space-y-2">
            <Label>Özel Miktar</Label>
            <Input 
              placeholder="Adet sayısını girin" 
              onChange={(e) => updateFormData('customQuantity', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderRollLabelForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Etiket Türü</Label>
          <Select onValueChange={(value) => updateFormData('labelType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tür seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thermal-direct">Direkt Termal</SelectItem>
              <SelectItem value="thermal-transfer">Termal Transfer</SelectItem>
              <SelectItem value="adhesive-permanent">Kalıcı Yapışkanlı</SelectItem>
              <SelectItem value="adhesive-removable">Çıkarılabilir Yapışkanlı</SelectItem>
              <SelectItem value="security">Güvenlik Etiketi</SelectItem>
              <SelectItem value="food-grade">Gıda Uyumlu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Etiket Boyutu</Label>
          <Select onValueChange={(value) => updateFormData('rollSize', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Boyut seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30x20">30 x 20 mm</SelectItem>
              <SelectItem value="40x30">40 x 30 mm</SelectItem>
              <SelectItem value="50x30">50 x 30 mm</SelectItem>
              <SelectItem value="60x40">60 x 40 mm</SelectItem>
              <SelectItem value="80x50">80 x 50 mm</SelectItem>
              <SelectItem value="100x60">100 x 60 mm</SelectItem>
              <SelectItem value="custom">Özel Boyut</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Rulo Çapı</Label>
          <Select onValueChange={(value) => updateFormData('coreDiameter', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Çap seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25 mm (1")</SelectItem>
              <SelectItem value="40">40 mm (1.5")</SelectItem>
              <SelectItem value="76">76 mm (3")</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Toplam Miktar</Label>
          <Select onValueChange={(value) => updateFormData('totalQuantity', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Miktar seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1000">1.000 Adet</SelectItem>
              <SelectItem value="2500">2.500 Adet</SelectItem>
              <SelectItem value="5000">5.000 Adet</SelectItem>
              <SelectItem value="10000">10.000 Adet</SelectItem>
              <SelectItem value="25000">25.000 Adet</SelectItem>
              <SelectItem value="50000">50.000 Adet</SelectItem>
              <SelectItem value="custom">Özel Miktar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Malzeme</Label>
          <Select onValueChange={(value) => updateFormData('material', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Malzeme seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pp-white">Beyaz PP</SelectItem>
              <SelectItem value="pp-transparent">Şeffaf PP</SelectItem>
              <SelectItem value="pe-white">Beyaz PE</SelectItem>
              <SelectItem value="vinyl">Vinil</SelectItem>
              <SelectItem value="paper-white">Beyaz Kağıt</SelectItem>
              <SelectItem value="paper-kraft">Kraft Kağıt</SelectItem>
              <SelectItem value="polyester">Polyester</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Yapıştırıcı Türü</Label>
          <Select onValueChange={(value) => updateFormData('adhesive', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Yapıştırıcı seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="permanent">Kalıcı</SelectItem>
              <SelectItem value="removable">Çıkarılabilir</SelectItem>
              <SelectItem value="ultra-removable">Ultra Çıkarılabilir</SelectItem>
              <SelectItem value="freezer">Dondurulmuş Ürün</SelectItem>
              <SelectItem value="high-temp">Yüksek Sıcaklık</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {formData.rollSize === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-orange-50 rounded-lg">
          <div className="space-y-2">
            <Label>Özel Genişlik (mm)</Label>
            <Input 
              placeholder="Örn: 45" 
              onChange={(e) => updateFormData('customRollWidth', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Özel Yükseklik (mm)</Label>
            <Input 
              placeholder="Örn: 65" 
              onChange={(e) => updateFormData('customRollHeight', e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );

  const renderGeneralPrintingForm = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <Label>Baskı Türü</Label>
          <Select onValueChange={(value) => updateFormData('printType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Tür seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="business-card">Kartvizit</SelectItem>
              <SelectItem value="brochure">Broşür</SelectItem>
              <SelectItem value="catalog">Katalog</SelectItem>
              <SelectItem value="flyer">Flyer</SelectItem>
              <SelectItem value="poster">Poster</SelectItem>
              <SelectItem value="book">Kitap</SelectItem>
              <SelectItem value="magazine">Dergi</SelectItem>
              <SelectItem value="packaging">Ambalaj</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Boyut</Label>
          <Select onValueChange={(value) => updateFormData('printSize', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Boyut seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="85x55">85 x 55 mm (Kartvizit)</SelectItem>
              <SelectItem value="a6">A6 (105 x 148 mm)</SelectItem>
              <SelectItem value="a5">A5 (148 x 210 mm)</SelectItem>
              <SelectItem value="a4">A4 (210 x 297 mm)</SelectItem>
              <SelectItem value="a3">A3 (297 x 420 mm)</SelectItem>
              <SelectItem value="a2">A2 (420 x 594 mm)</SelectItem>
              <SelectItem value="a1">A1 (594 x 841 mm)</SelectItem>
              <SelectItem value="custom">Özel Boyut</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Kağıt Türü</Label>
          <Select onValueChange={(value) => updateFormData('printPaper', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Kağıt seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="coated-90">Kuşe 90gr</SelectItem>
              <SelectItem value="coated-120">Kuşe 120gr</SelectItem>
              <SelectItem value="coated-150">Kuşe 150gr</SelectItem>
              <SelectItem value="coated-200">Kuşe 200gr</SelectItem>
              <SelectItem value="coated-250">Kuşe 250gr</SelectItem>
              <SelectItem value="coated-300">Kuşe 300gr</SelectItem>
              <SelectItem value="bristol-160">Bristol 160gr</SelectItem>
              <SelectItem value="bristol-200">Bristol 200gr</SelectItem>
              <SelectItem value="bristol-250">Bristol 250gr</SelectItem>
              <SelectItem value="offset-80">Offset 80gr</SelectItem>
              <SelectItem value="offset-90">Offset 90gr</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Miktar</Label>
          <Select onValueChange={(value) => updateFormData('printQuantity', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Miktar seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="100">100 Adet</SelectItem>
              <SelectItem value="250">250 Adet</SelectItem>
              <SelectItem value="500">500 Adet</SelectItem>
              <SelectItem value="1000">1.000 Adet</SelectItem>
              <SelectItem value="2500">2.500 Adet</SelectItem>
              <SelectItem value="5000">5.000 Adet</SelectItem>
              <SelectItem value="custom">Özel Miktar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Renk</Label>
          <Select onValueChange={(value) => updateFormData('printColor', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Renk seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4-0">4+0 (Tek Yüz Renkli)</SelectItem>
              <SelectItem value="4-4">4+4 (Çift Yüz Renkli)</SelectItem>
              <SelectItem value="1-0">1+0 (Tek Yüz Siyah)</SelectItem>
              <SelectItem value="1-1">1+1 (Çift Yüz Siyah)</SelectItem>
              <SelectItem value="2-0">2+0 (Tek Yüz İki Renk)</SelectItem>
              <SelectItem value="pantone">Pantone Renk</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ciltleme</Label>
          <Select onValueChange={(value) => updateFormData('binding', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Ciltleme seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Ciltleme Yok</SelectItem>
              <SelectItem value="saddle-stitch">Tel Dikiş</SelectItem>
              <SelectItem value="perfect-binding">Termal Cilt</SelectItem>
              <SelectItem value="spiral">Spiral Cilt</SelectItem>
              <SelectItem value="wire-o">Wire-O Cilt</SelectItem>
              <SelectItem value="hardcover">Sert Kapak</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Yüzey İşlemleri</Label>
          <Select onValueChange={(value) => updateFormData('printFinish', value)}>
            <SelectTrigger>
              <SelectValue placeholder="İşlem seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">İşlem Yok</SelectItem>
              <SelectItem value="cellophane-mat">Mat Selefon</SelectItem>
              <SelectItem value="cellophane-gloss">Parlak Selefon</SelectItem>
              <SelectItem value="uv-spot">Nokta UV</SelectItem>
              <SelectItem value="uv-total">Tam UV</SelectItem>
              <SelectItem value="gold-foil">Altın Yaldız</SelectItem>
              <SelectItem value="silver-foil">Gümüş Yaldız</SelectItem>
              <SelectItem value="emboss">Kabartma</SelectItem>
              <SelectItem value="deboss">Gömme</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Sayfa Sayısı</Label>
          <Input 
            placeholder="Örn: 24"
            onChange={(e) => updateFormData('pageCount', e.target.value)}
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="mb-6 shadow-md hover:shadow-lg transition-all duration-300">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Müşteri Dashboard
            </Button>
          </Link>
          
          {/* Header Card */}
          <Card className="mb-8 border-0 shadow-xl bg-gradient-to-r from-white to-blue-50">
            <CardContent className="p-8">
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-r ${typeConfig.bgGradient} rounded-full flex items-center justify-center shadow-lg`}>
                  {typeConfig.icon}
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">
                    {typeConfig.title}
                  </h1>
                  <p className="text-xl text-gray-600">
                    {typeConfig.description}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Hızlı Teklif</div>
                  <div className="text-2xl font-bold text-blue-600">5 Dakika</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Matbaa Sayısı</div>
                  <div className="text-2xl font-bold text-green-600">50+</div>
                </div>
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="text-sm text-gray-500 mb-1">Ortalama Tasarruf</div>
                  <div className="text-2xl font-bold text-orange-600">%25</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Card */}
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-8">
                <TabsTrigger value="details" className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Detaylar</span>
                </TabsTrigger>
                <TabsTrigger value="specifications" className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4" />
                  <span>Özellikler</span>
                </TabsTrigger>
                <TabsTrigger value="design" className="flex items-center space-x-2">
                  <Palette className="h-4 w-4" />
                  <span>Tasarım</span>
                </TabsTrigger>
                <TabsTrigger value="files" className="flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Dosyalar</span>
                </TabsTrigger>
                <TabsTrigger value="submit" className="flex items-center space-x-2">
                  <Send className="h-4 w-4" />
                  <span>Gönder</span>
                </TabsTrigger>
              </TabsList>

              <form onSubmit={form.handleSubmit(onSubmit)}>
                <TabsContent value="details" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Proje Başlığı *</Label>
                      <Input
                        id="title"
                        placeholder="Örn: Ürün Etiketleri"
                        {...form.register("title")}
                        className="border-gray-300 focus:border-blue-500"
                      />
                      {form.formState.errors.title && (
                        <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget">Bütçe (TL)</Label>
                      <Input
                        id="budget"
                        placeholder="Örn: 1000-5000"
                        {...form.register("budget")}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="deadline">Teslim Tarihi</Label>
                      <Input
                        id="deadline"
                        type="date"
                        {...form.register("deadline")}
                        className="border-gray-300 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Proje Açıklaması</Label>
                    <Textarea
                      id="description"
                      placeholder="Projeniz hakkında detaylı bilgi verin..."
                      rows={4}
                      {...form.register("description")}
                      className="border-gray-300 focus:border-blue-500"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={() => setCurrentTab("specifications")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Devam Et
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="specifications" className="space-y-6">
                  {type === 'sheet_label' && renderSheetLabelForm()}
                  {type === 'roll_label' && renderRollLabelForm()}
                  {type === 'general_printing' && renderGeneralPrintingForm()}

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentTab("details")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Geri
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentTab("design")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Devam Et
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="design" className="space-y-6">
                  <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Wand2 className="h-6 w-6 text-purple-600 mr-2" />
                        AI Tasarım Motoru
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 mb-4">
                        Yapay zeka destekli tasarım motorumuz ile profesyonel tasarımlar oluşturun.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <Button variant="outline" className="h-auto p-4 text-left">
                          <div>
                            <Star className="h-5 w-5 text-yellow-500 mb-2" />
                            <span className="font-medium block">Logo Tasarımı</span>
                            <span className="text-sm text-gray-500">Profesyonel logolar</span>
                          </div>
                        </Button>
                        
                        <Button variant="outline" className="h-auto p-4 text-left">
                          <div>
                            <Palette className="h-5 w-5 text-blue-500 mb-2" />
                            <span className="font-medium block">Etiket Tasarımı</span>
                            <span className="text-sm text-gray-500">Ürün etiketleri</span>
                          </div>
                        </Button>
                        
                        <Button variant="outline" className="h-auto p-4 text-left">
                          <div>
                            <FileText className="h-5 w-5 text-green-500 mb-2" />
                            <span className="font-medium block">Kartvizit Tasarımı</span>
                            <span className="text-sm text-gray-500">Modern kartvizitler</span>
                          </div>
                        </Button>
                      </div>

                      <Button
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                        onClick={() => window.open('/design-engine', '_blank')}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        Tasarım Motorunu Aç
                      </Button>
                    </CardContent>
                  </Card>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentTab("specifications")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Geri
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentTab("files")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Devam Et
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="files" className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Dosya Yükleme</h3>
                    <FileUpload
                      onFileUpload={handleFileUpload}
                      maxFiles={10}
                      maxSizeInMB={100}
                      acceptedTypes={['.pdf', '.ai', '.psd', '.jpg', '.png', '.eps', '.svg']}
                      className="mb-4"
                    />
                    
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Yüklenen Dosyalar:</h4>
                        <div className="space-y-2">
                          {uploadedFiles.map((fileId, index) => (
                            <div key={index} className="flex items-center space-x-2 p-2 bg-green-50 rounded">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm">Dosya {index + 1} başarıyla yüklendi</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentTab("design")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Geri
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setCurrentTab("submit")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Devam Et
                      <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="submit" className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                      <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                      Teklif Özeti
                    </h3>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Proje Tipi:</span>
                        <span className="font-medium">{typeConfig.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Başlık:</span>
                        <span className="font-medium">{form.getValues("title") || "Belirtilmedi"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Bütçe:</span>
                        <span className="font-medium">{form.getValues("budget") || "Belirtilmedi"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Yüklenen Dosya:</span>
                        <span className="font-medium">{uploadedFiles.length} dosya</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Özellikler:</span>
                        <span className="font-medium">{Object.keys(formData).length} adet</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentTab("files")}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Geri
                    </Button>
                    <Button
                      type="submit"
                      disabled={mutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8"
                    >
                      {mutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Gönderiliyor...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Teklif Talebini Gönder
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
