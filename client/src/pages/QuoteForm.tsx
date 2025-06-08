
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import FileUpload from "@/components/FileUpload";
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
  CheckCircle,
  Target,
  FileText,
  Star,
  Sparkles,
  Palette,
  Layers
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
  const [surfaceProcessingTab, setSurfaceProcessingTab] = useState("cellophane");

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

      // Convert deadline to proper format if it exists
      if (quoteData.deadline && quoteData.deadline !== '') {
        quoteData.deadline = new Date(quoteData.deadline).toISOString();
      } else {
        delete quoteData.deadline;
      }

      console.log("Submitting quote data:", {
        title: quoteData.title,
        type: quoteData.type,
        hasDeadline: !!quoteData.deadline,
        specificationsCount: Object.keys(quoteData.specifications).length
      });

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(quoteData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Quote submission failed:", errorData);
        throw new Error(errorData.message || `${response.status}: ${response.statusText}`);
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

  const renderSurfaceProcessingOptions = () => (
    <div className="space-y-4">
      <Label className="text-base font-semibold">Yüzey İşlemleri</Label>
      
      <Tabs value={surfaceProcessingTab} onValueChange={setSurfaceProcessingTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="cellophane" className="flex items-center space-x-1">
            <Layers className="h-4 w-4" />
            <span>Selefon</span>
          </TabsTrigger>
          <TabsTrigger value="foil" className="flex items-center space-x-1">
            <Star className="h-4 w-4" />
            <span>Yaldız</span>
          </TabsTrigger>
          <TabsTrigger value="varnish" className="flex items-center space-x-1">
            <Sparkles className="h-4 w-4" />
            <span>Vernik</span>
          </TabsTrigger>
          <TabsTrigger value="emboss" className="flex items-center space-x-1">
            <Target className="h-4 w-4" />
            <span>Kabartma</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cellophane" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant={formData.cellophaneType === 'mat' ? 'default' : 'outline'}
              onClick={() => updateFormData('cellophaneType', 'mat')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Mat Selefon</div>
                <div className="text-sm text-gray-500">Pürüzsüz, yansımasız görünüm</div>
              </div>
            </Button>
            <Button
              variant={formData.cellophaneType === 'gloss' ? 'default' : 'outline'}
              onClick={() => updateFormData('cellophaneType', 'gloss')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Parlak Selefon</div>
                <div className="text-sm text-gray-500">Yüksek parlaklık, canlı renkler</div>
              </div>
            </Button>
            <Button
              variant={formData.cellophaneType === 'soft-touch' ? 'default' : 'outline'}
              onClick={() => updateFormData('cellophaneType', 'soft-touch')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Soft Touch Selefon</div>
                <div className="text-sm text-gray-500">Kadife hissi, premium görünüm</div>
              </div>
            </Button>
            <Button
              variant={formData.cellophaneType === 'anti-scratch' ? 'default' : 'outline'}
              onClick={() => updateFormData('cellophaneType', 'anti-scratch')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Çizilmez Selefon</div>
                <div className="text-sm text-gray-500">Dayanıklı, uzun ömürlü</div>
              </div>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="foil" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant={formData.foilType === 'gold' ? 'default' : 'outline'}
              onClick={() => updateFormData('foilType', 'gold')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Altın Yaldız</div>
                <div className="text-sm text-gray-500">Klasik, prestijli görünüm</div>
              </div>
            </Button>
            <Button
              variant={formData.foilType === 'silver' ? 'default' : 'outline'}
              onClick={() => updateFormData('foilType', 'silver')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Gümüş Yaldız</div>
                <div className="text-sm text-gray-500">Modern, şık görünüm</div>
              </div>
            </Button>
            <Button
              variant={formData.foilType === 'hologram' ? 'default' : 'outline'}
              onClick={() => updateFormData('foilType', 'hologram')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Hologram Yaldız</div>
                <div className="text-sm text-gray-500">Gökkuşağı efekti, güvenlik</div>
              </div>
            </Button>
            <Button
              variant={formData.foilType === 'copper' ? 'default' : 'outline'}
              onClick={() => updateFormData('foilType', 'copper')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Bakır Yaldız</div>
                <div className="text-sm text-gray-500">Sıcak, vintage görünüm</div>
              </div>
            </Button>
            <Button
              variant={formData.foilType === 'red' ? 'default' : 'outline'}
              onClick={() => updateFormData('foilType', 'red')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Kırmızı Yaldız</div>
                <div className="text-sm text-gray-500">Dikkat çekici, enerjik</div>
              </div>
            </Button>
            <Button
              variant={formData.foilType === 'blue' ? 'default' : 'outline'}
              onClick={() => updateFormData('foilType', 'blue')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Mavi Yaldız</div>
                <div className="text-sm text-gray-500">Güven verici, profesyonel</div>
              </div>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="varnish" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant={formData.varnishType === 'uv-total' ? 'default' : 'outline'}
              onClick={() => updateFormData('varnishType', 'uv-total')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Tam UV Vernik</div>
                <div className="text-sm text-gray-500">Tüm yüzey parlak</div>
              </div>
            </Button>
            <Button
              variant={formData.varnishType === 'uv-spot' ? 'default' : 'outline'}
              onClick={() => updateFormData('varnishType', 'uv-spot')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Nokta UV Vernik</div>
                <div className="text-sm text-gray-500">Seçili alanlar parlak</div>
              </div>
            </Button>
            <Button
              variant={formData.varnishType === 'water-based' ? 'default' : 'outline'}
              onClick={() => updateFormData('varnishType', 'water-based')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Su Bazlı Vernik</div>
                <div className="text-sm text-gray-500">Çevre dostu, doğal</div>
              </div>
            </Button>
            <Button
              variant={formData.varnishType === 'oil-based' ? 'default' : 'outline'}
              onClick={() => updateFormData('varnishType', 'oil-based')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Yağ Bazlı Vernik</div>
                <div className="text-sm text-gray-500">Dayanıklı, uzun ömürlü</div>
              </div>
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="emboss" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant={formData.embossType === 'raised' ? 'default' : 'outline'}
              onClick={() => updateFormData('embossType', 'raised')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Kabartma (Emboss)</div>
                <div className="text-sm text-gray-500">Yükseltilmiş baskı</div>
              </div>
            </Button>
            <Button
              variant={formData.embossType === 'deboss' ? 'default' : 'outline'}
              onClick={() => updateFormData('embossType', 'deboss')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Gömme (Deboss)</div>
                <div className="text-sm text-gray-500">Çukur baskı</div>
              </div>
            </Button>
            <Button
              variant={formData.embossType === 'blind' ? 'default' : 'outline'}
              onClick={() => updateFormData('embossType', 'blind')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Kör Kabartma</div>
                <div className="text-sm text-gray-500">Renksiz, sadece doku</div>
              </div>
            </Button>
            <Button
              variant={formData.embossType === 'combination' ? 'default' : 'outline'}
              onClick={() => updateFormData('embossType', 'combination')}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">Kombinasyon</div>
                <div className="text-sm text-gray-500">Kabartma + yaldız</div>
              </div>
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderSheetLabelForm = () => (
    <div className="space-y-8">
      {/* Temel Özellikler */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Temel Özellikler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Etiket Boyutu *</Label>
            <Select onValueChange={(value) => updateFormData('size', value)}>
              <SelectTrigger className="h-12">
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
            <Label className="text-sm font-medium text-gray-700">Miktar (Adet) *</Label>
            <Select onValueChange={(value) => updateFormData('quantity', value)}>
              <SelectTrigger className="h-12">
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
            <Label className="text-sm font-medium text-gray-700">Renk Seçenekleri *</Label>
            <Select onValueChange={(value) => updateFormData('color', value)}>
              <SelectTrigger className="h-12">
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
        </div>
      </div>

      <Separator />

      {/* Malzeme Seçimi */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Malzeme Seçimi</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { value: 'coated-90', label: 'Kuşe Kağıt 90gr', desc: 'Ekonomik, günlük kullanım' },
            { value: 'coated-120', label: 'Kuşe Kağıt 120gr', desc: 'Standart kalite' },
            { value: 'bristol-160', label: 'Bristol Kağıt 160gr', desc: 'Dayanıklı, kaliteli' },
            { value: 'sticker-white', label: 'Beyaz Sticker', desc: 'Yapışkanlı, pratik' },
            { value: 'sticker-transparent', label: 'Şeffaf Sticker', desc: 'Görünmez kenar' },
            { value: 'kraft', label: 'Kraft Kağıt', desc: 'Doğal, çevre dostu' },
          ].map((paper) => (
            <Button
              key={paper.value}
              variant={formData.paperType === paper.value ? 'default' : 'outline'}
              onClick={() => updateFormData('paperType', paper.value)}
              className="h-auto p-4 justify-start"
            >
              <div className="text-left">
                <div className="font-medium">{paper.label}</div>
                <div className="text-sm text-gray-500">{paper.desc}</div>
              </div>
            </Button>
          ))}
        </div>
      </div>

      <Separator />

      {/* Yüzey İşlemleri */}
      {renderSurfaceProcessingOptions()}

      <Separator />

      {/* Kesim ve Son İşlemler */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Kesim ve Son İşlemler</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Kesim Türü</Label>
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

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Paketleme</Label>
            <Select onValueChange={(value) => updateFormData('packaging', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Paketleme seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bulk">Toplu Paket</SelectItem>
                <SelectItem value="individual">Tekli Paket</SelectItem>
                <SelectItem value="custom">Özel Paketleme</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Özel Boyut Girişi */}
      {formData.size === 'custom' && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h4 className="font-semibold mb-4">Özel Boyut Bilgileri</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Genişlik (mm)</Label>
              <Input 
                placeholder="Örn: 45" 
                onChange={(e) => updateFormData('customWidth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Yükseklik (mm)</Label>
              <Input 
                placeholder="Örn: 65" 
                onChange={(e) => updateFormData('customHeight', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Özel Miktar Girişi */}
      {formData.quantity === 'custom' && (
        <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
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
    <div className="space-y-8">
      {/* Temel Özellikler */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Etiket Özellikleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Etiket Türü *</Label>
            <Select onValueChange={(value) => updateFormData('labelType', value)}>
              <SelectTrigger className="h-12">
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
            <Label className="text-sm font-medium text-gray-700">Etiket Boyutu *</Label>
            <Select onValueChange={(value) => updateFormData('rollSize', value)}>
              <SelectTrigger className="h-12">
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
            <Label className="text-sm font-medium text-gray-700">Toplam Miktar *</Label>
            <Select onValueChange={(value) => updateFormData('totalQuantity', value)}>
              <SelectTrigger className="h-12">
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
        </div>
      </div>

      <Separator />

      {/* Rulo Özellikleri */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Rulo Özellikleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Rulo Çapı *</Label>
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
            <Label className="text-sm font-medium text-gray-700">Sarım Yönü</Label>
            <Select onValueChange={(value) => updateFormData('windingDirection', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Yön seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="out">Dışarı Sarım</SelectItem>
                <SelectItem value="in">İçeri Sarım</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Perfore Aralığı</Label>
            <Select onValueChange={(value) => updateFormData('perforationGap', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Aralık seçin" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Perfore Yok</SelectItem>
                <SelectItem value="2">2 mm Aralık</SelectItem>
                <SelectItem value="3">3 mm Aralık</SelectItem>
                <SelectItem value="custom">Özel Aralık</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <Separator />

      {/* Malzeme Seçimi */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900">Malzeme ve Yapıştırıcı</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label className="text-base font-medium">Malzeme Türü</Label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'pp-white', label: 'Beyaz PP', desc: 'Dayanıklı, su geçirmez' },
                { value: 'pp-transparent', label: 'Şeffaf PP', desc: 'Görünmez, modern' },
                { value: 'pe-white', label: 'Beyaz PE', desc: 'Esnek, yumuşak' },
                { value: 'paper-white', label: 'Beyaz Kağıt', desc: 'Ekonomik, çevre dostu' },
                { value: 'polyester', label: 'Polyester', desc: 'Ekstra dayanıklı' },
              ].map((material) => (
                <Button
                  key={material.value}
                  variant={formData.material === material.value ? 'default' : 'outline'}
                  onClick={() => updateFormData('material', material.value)}
                  className="h-auto p-3 justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">{material.label}</div>
                    <div className="text-sm text-gray-500">{material.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-base font-medium">Yapıştırıcı Türü</Label>
            <div className="grid grid-cols-1 gap-3">
              {[
                { value: 'permanent', label: 'Kalıcı', desc: 'Çıkarılamaz, güçlü' },
                { value: 'removable', label: 'Çıkarılabilir', desc: 'Temiz çıkarma' },
                { value: 'ultra-removable', label: 'Ultra Çıkarılabilir', desc: 'İz bırakmaz' },
                { value: 'freezer', label: 'Dondurulmuş Ürün', desc: '-18°C dayanıklı' },
                { value: 'high-temp', label: 'Yüksek Sıcaklık', desc: '+150°C dayanıklı' },
              ].map((adhesive) => (
                <Button
                  key={adhesive.value}
                  variant={formData.adhesive === adhesive.value ? 'default' : 'outline'}
                  onClick={() => updateFormData('adhesive', adhesive.value)}
                  className="h-auto p-3 justify-start"
                >
                  <div className="text-left">
                    <div className="font-medium">{adhesive.label}</div>
                    <div className="text-sm text-gray-500">{adhesive.desc}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {formData.rollSize === 'custom' && (
        <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-semibold mb-4">Özel Boyut Bilgileri</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Genişlik (mm)</Label>
              <Input 
                placeholder="Örn: 45" 
                onChange={(e) => updateFormData('customRollWidth', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Yükseklik (mm)</Label>
              <Input 
                placeholder="Örn: 65" 
                onChange={(e) => updateFormData('customRollHeight', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderGeneralPrintingForm = () => {
    const printTypes = {
      'business-card': {
        requiredFields: ['size', 'paper', 'quantity', 'color'],
        optionalFields: ['finish', 'cutting'],
        sizeOptions: ['85x55', '90x50', '85x54', 'custom'],
        paperOptions: ['coated-300', 'coated-350', 'bristol-300', 'textured']
      },
      'brochure': {
        requiredFields: ['size', 'paper', 'quantity', 'color', 'pages', 'folding'],
        optionalFields: ['finish', 'binding'],
        sizeOptions: ['a4', 'a5', 'a6', 'custom'],
        paperOptions: ['coated-120', 'coated-150', 'coated-200', 'offset-90']
      },
      'catalog': {
        requiredFields: ['size', 'paper', 'quantity', 'color', 'pages', 'binding'],
        optionalFields: ['finish', 'cover'],
        sizeOptions: ['a4', 'a5', '21x21', 'custom'],
        paperOptions: ['coated-120', 'coated-150', 'coated-200']
      },
      'magazine': {
        requiredFields: ['size', 'paper', 'quantity', 'color', 'pages', 'binding'],
        optionalFields: ['finish', 'cover'],
        sizeOptions: ['a4', '21x28', '19x27', 'custom'],
        paperOptions: ['coated-90', 'coated-120', 'coated-150']
      },
      'flyer': {
        requiredFields: ['size', 'paper', 'quantity', 'color'],
        optionalFields: ['finish'],
        sizeOptions: ['a4', 'a5', 'a6', '21x21', 'custom'],
        paperOptions: ['coated-120', 'coated-150', 'coated-200']
      },
      'poster': {
        requiredFields: ['size', 'paper', 'quantity', 'color'],
        optionalFields: ['finish'],
        sizeOptions: ['a3', 'a2', 'a1', '50x70', '70x100', 'custom'],
        paperOptions: ['coated-150', 'coated-200', 'poster-paper']
      },
      'book': {
        requiredFields: ['size', 'paper', 'quantity', 'color', 'pages', 'binding', 'cover'],
        optionalFields: ['finish'],
        sizeOptions: ['a4', 'a5', '13.5x21', '16x24', 'custom'],
        paperOptions: ['offset-80', 'offset-90', 'book-paper']
      },
      'packaging': {
        requiredFields: ['type', 'size', 'material', 'quantity', 'color'],
        optionalFields: ['finish', 'handle'],
        sizeOptions: ['custom'],
        paperOptions: ['kraft', 'bristol-250', 'corrugated']
      }
    };

    const selectedType = formData.printType ? printTypes[formData.printType as keyof typeof printTypes] : null;

    return (
      <div className="space-y-8">
        {/* Baskı Türü Seçimi */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900">Baskı Türü Seçimi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries({
              'business-card': { label: 'Kartvizit', desc: 'Profesyonel kartvizitler' },
              'brochure': { label: 'Broşür', desc: 'Tanıtım broşürleri' },
              'catalog': { label: 'Katalog', desc: 'Ürün katalogları' },
              'magazine': { label: 'Dergi', desc: 'Dergi ve gazete' },
              'flyer': { label: 'Flyer', desc: 'Reklam flyerleri' },
              'poster': { label: 'Poster', desc: 'Büyük boy posterler' },
              'book': { label: 'Kitap', desc: 'Kitap ve yayın' },
              'packaging': { label: 'Ambalaj', desc: 'Özel ambalajlar' }
            }).map(([value, config]) => (
              <Button
                key={value}
                variant={formData.printType === value ? 'default' : 'outline'}
                onClick={() => updateFormData('printType', value)}
                className="h-auto p-4 justify-start"
              >
                <div className="text-left">
                  <div className="font-medium">{config.label}</div>
                  <div className="text-sm text-gray-500">{config.desc}</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {selectedType && (
          <>
            <Separator />

            {/* Temel Özellikler */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Temel Özellikler</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Boyut */}
                {selectedType.requiredFields.includes('size') && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      Boyut <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select onValueChange={(value) => updateFormData('printSize', value)}>
                      <SelectTrigger className="h-12">
                        <SelectValue placeholder="Boyut seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedType.sizeOptions.map(size => {
                          const sizeLabels: Record<string, string> = {
                            '85x55': '85 x 55 mm (Standart Kartvizit)',
                            '90x50': '90 x 50 mm (Avrupa Kartvizit)', 
                            'a6': 'A6 (105 x 148 mm)',
                            'a5': 'A5 (148 x 210 mm)',
                            'a4': 'A4 (210 x 297 mm)',
                            'a3': 'A3 (297 x 420 mm)',
                            'a2': 'A2 (420 x 594 mm)',
                            'a1': 'A1 (594 x 841 mm)',
                            '21x21': '21 x 21 cm (Kare)',
                            '21x28': '21 x 28 cm (Dergi)',
                            '19x27': '19 x 27 cm (Küçük Dergi)',
                            '50x70': '50 x 70 cm',
                            '70x100': '70 x 100 cm',
                            'custom': 'Özel Boyut'
                          };
                          return (
                            <SelectItem key={size} value={size}>
                              {sizeLabels[size] || size}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Miktar */}
                {selectedType.requiredFields.includes('quantity') && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      Miktar <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select onValueChange={(value) => updateFormData('printQuantity', value)}>
                      <SelectTrigger className="h-12">
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
                )}

                {/* Renk */}
                {selectedType.requiredFields.includes('color') && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 flex items-center">
                      Renk <span className="text-red-500 ml-1">*</span>
                    </Label>
                    <Select onValueChange={(value) => updateFormData('printColor', value)}>
                      <SelectTrigger className="h-12">
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
                )}
              </div>
            </div>

            {/* Sayfa ve Ciltleme (Gerekirse) */}
            {(selectedType.requiredFields.includes('pages') || selectedType.requiredFields.includes('binding')) && (
              <>
                <Separator />
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Sayfa ve Ciltleme</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {selectedType.requiredFields.includes('pages') && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          Sayfa Sayısı <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input 
                          placeholder="Örn: 24"
                          onChange={(e) => updateFormData('pageCount', e.target.value)}
                        />
                      </div>
                    )}

                    {selectedType.requiredFields.includes('binding') && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          Ciltleme <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select onValueChange={(value) => updateFormData('binding', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Ciltleme seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="saddle-stitch">Tel Dikiş</SelectItem>
                            <SelectItem value="perfect-binding">Termal Cilt</SelectItem>
                            <SelectItem value="spiral">Spiral Cilt</SelectItem>
                            <SelectItem value="wire-o">Wire-O Cilt</SelectItem>
                            <SelectItem value="hardcover">Sert Kapak</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {selectedType.requiredFields.includes('folding') && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700 flex items-center">
                          Katlama <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Select onValueChange={(value) => updateFormData('folding', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Katlama seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Katlama Yok</SelectItem>
                            <SelectItem value="half">Yarı Katlama</SelectItem>
                            <SelectItem value="tri-fold">Üç Katlama</SelectItem>
                            <SelectItem value="z-fold">Z Katlama</SelectItem>
                            <SelectItem value="gate-fold">Kapı Katlama</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <Separator />

            {/* Malzeme Seçimi */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Malzeme Seçimi</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedType.paperOptions.map((paper) => {
                  const paperLabels: Record<string, { label: string, desc: string }> = {
                    'coated-90': { label: 'Kuşe 90gr', desc: 'Ekonomik, günlük kullanım' },
                    'coated-120': { label: 'Kuşe 120gr', desc: 'Standart kalite' },
                    'coated-150': { label: 'Kuşe 150gr', desc: 'İyi kalite' },
                    'coated-200': { label: 'Kuşe 200gr', desc: 'Yüksek kalite' },
                    'coated-300': { label: 'Kuşe 300gr', desc: 'Premium kalite' },
                    'coated-350': { label: 'Kuşe 350gr', desc: 'Ultra kalite' },
                    'bristol-300': { label: 'Bristol 300gr', desc: 'Kalın, dayanıklı' },
                    'offset-80': { label: 'Offset 80gr', desc: 'Hafif, ekonomik' },
                    'offset-90': { label: 'Offset 90gr', desc: 'Standart iç sayfa' },
                    'textured': { label: 'Dokulu Kağıt', desc: 'Premium doku' },
                    'kraft': { label: 'Kraft Kağıt', desc: 'Doğal, çevre dostu' },
                    'poster-paper': { label: 'Poster Kağıdı', desc: 'Büyük boy baskılar' },
                    'book-paper': { label: 'Kitap Kağıdı', desc: 'Okuma dostu' },
                    'corrugated': { label: 'Oluklu Karton', desc: 'Ambalaj için' }
                  };
                  
                  const paperInfo = paperLabels[paper] || { label: paper, desc: '' };
                  
                  return (
                    <Button
                      key={paper}
                      variant={formData.printPaper === paper ? 'default' : 'outline'}
                      onClick={() => updateFormData('printPaper', paper)}
                      className="h-auto p-4 justify-start"
                    >
                      <div className="text-left">
                        <div className="font-medium">{paperInfo.label}</div>
                        <div className="text-sm text-gray-500">{paperInfo.desc}</div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Yüzey İşlemleri */}
            {selectedType.optionalFields.includes('finish') && renderSurfaceProcessingOptions()}
          </>
        )}
      </div>
    );
  };

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
              <TabsList className="grid w-full grid-cols-4 mb-8">
                <TabsTrigger value="details" className="flex items-center space-x-2">
                  <Target className="h-4 w-4" />
                  <span>Detaylar</span>
                </TabsTrigger>
                <TabsTrigger value="specifications" className="flex items-center space-x-2">
                  <Calculator className="h-4 w-4" />
                  <span>Özellikler</span>
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
                    <p className="text-gray-600 mb-4">
                      Tasarım dosyalarınızı, referans görselleri veya özel talimatlarınızı yükleyin.
                    </p>
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
                      onClick={() => setCurrentTab("specifications")}
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
