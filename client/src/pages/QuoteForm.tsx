import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "wouter";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  Wand2
} from "lucide-react";
import { Link } from "wouter";
import DesignEngine from "@/components/DesignEngine";

const quoteSchema = z.object({
  title: z.string().min(1, "Başlık gereklidir"),
  description: z.string().optional(),
  specifications: z.record(z.any()),
  deadline: z.string().optional(),
  budget: z.string().optional(),
});

type QuoteFormData = z.infer<typeof quoteSchema>;

export default function QuoteForm() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const params = useParams();
  const queryClient = useQueryClient();
  const quoteType = params.type as string;
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<QuoteFormData>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      specifications: {},
    }
  });

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      await apiRequest('POST', '/api/quotes', {
        ...data,
        type: quoteType,
        budget: data.budget ? parseFloat(data.budget) : null,
        fileUrls: uploadedFiles,
      });
    },
    onSuccess: () => {
      toast({
        title: "Başarılı",
        description: "Teklif talebiniz başarıyla oluşturuldu.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quotes"] });
      // Redirect to dashboard
      window.location.href = "/dashboard";
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
        description: "Teklif talebi oluşturulurken bir hata oluştu.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuoteFormData) => {
    createQuoteMutation.mutate(data);
  };

  const handleFileUpload = (fileId: string) => {
    setUploadedFiles(prev => [...prev, fileId]);
  };

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (user?.role !== 'customer') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex mb-4 gap-2">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Bu sayfaya erişim yetkiniz bulunmamaktadır.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getQuoteTypeConfig = () => {
    const configs = {
      sheet_label: {
        title: "Tabaka Etiket",
        subtitle: "A3/A4 tabaka halinde etiket baskısı",
        icon: <LayoutGrid className="h-6 w-6" />,
        color: "bg-blue-500",
        fields: [
          { name: "width", label: "Genişlik (mm)", type: "number", required: true },
          { name: "height", label: "Yükseklik (mm)", type: "number", required: true },
          { name: "quantity", label: "Miktar (Adet)", type: "number", required: true },
          { 
            name: "paperType", 
            label: "Kağıt Türü", 
            type: "select", 
            options: ["Kuşe Kağıt", "Bristol", "Sticker"],
            required: true 
          },
        ]
      },
      roll_label: {
        title: "Rulo Etiket",
        subtitle: "Rulo halinde etiket baskısı",
        icon: <Disc className="h-6 w-6" />,
        color: "bg-orange-500",
        fields: [
          { name: "diameter", label: "Çap (mm)", type: "number", required: true },
          { name: "length", label: "Boy (mm)", type: "number", required: true },
          { name: "rollLength", label: "Rulo Boyu (m)", type: "number", required: true },
          { 
            name: "coreSize", 
            label: "Mandrin Çapı", 
            type: "select", 
            options: ["25mm", "40mm", "76mm"],
            required: true 
          },
          { 
            name: "material", 
            label: "Malzeme", 
            type: "select", 
            options: ["Termal Kağıt", "PP Yapışkanlı", "Kuşe Yapışkanlı"],
            required: true 
          },
        ]
      },
      general_printing: {
        title: "Genel Baskı",
        subtitle: "Katalog, broşür, kartvizit vs.",
        icon: <Printer className="h-6 w-6" />,
        color: "bg-green-500",
        fields: [
          { 
            name: "productType", 
            label: "Ürün Türü", 
            type: "select", 
            options: ["Katalog", "Broşür", "Kartvizit", "Afiş", "Diğer"],
            required: true 
          },
          { 
            name: "size", 
            label: "Boyut", 
            type: "select", 
            options: ["A4", "A5", "A6", "Özel Boyut"],
            required: true 
          },
          { name: "quantity", label: "Miktar", type: "number", required: true },
          { 
            name: "paperType", 
            label: "Kağıt Türü", 
            type: "select", 
            options: ["Kuşe Kağıt", "Mat Kuşe", "Bristol", "Ofset"],
            required: true 
          },
          { 
            name: "grammage", 
            label: "Gramaj", 
            type: "select", 
            options: ["150 gr", "200 gr", "250 gr", "300 gr"],
            required: true 
          },
          { 
            name: "color", 
            label: "Renk", 
            type: "select", 
            options: ["4+0 (Tek Yüz Renkli)", "4+4 (Çift Yüz Renkli)", "1+0 (Tek Yüz Siyah)", "1+1 (Çift Yüz Siyah)"],
            required: true 
          },
        ]
      }
    };

    return configs[quoteType as keyof typeof configs] || configs.general_printing;
  };

  const config = getQuoteTypeConfig();

  const handleSpecificationChange = (fieldName: string, value: string) => {
    const currentSpecs = watch('specifications') || {};
    setValue('specifications', {
      ...currentSpecs,
      [fieldName]: value
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Geri Dön
            </Button>
          </Link>
          
          <div className="flex items-center">
            <div className={`w-12 h-12 ${config.color} rounded-lg flex items-center justify-center text-white mr-4`}>
              {config.icon}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{config.title}</h1>
              <p className="text-lg text-gray-600">{config.subtitle}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Teklif Başlığı *</Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="Örn: Logo etiket baskısı"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>
              
              <div>
                <Label htmlFor="description">Açıklama</Label>
                <Textarea
                  id="description"
                  {...register("description")}
                  placeholder="Proje hakkında detaylı bilgi verin..."
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="deadline">Termin Tarihi</Label>
                  <Input
                    id="deadline"
                    type="date"
                    {...register("deadline")}
                  />
                </div>
                
                <div>
                  <Label htmlFor="budget">Bütçe (₺)</Label>
                  <Input
                    id="budget"
                    type="number"
                    {...register("budget")}
                    placeholder="Tahmini bütçeniz"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Technical Specifications */}
          <Card>
            <CardHeader>
              <CardTitle>Teknik Özellikler</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {config.fields.map((field) => (
                  <div key={field.name}>
                    <Label htmlFor={field.name}>
                      {field.label} {field.required && "*"}
                    </Label>
                    
                    {field.type === "select" ? (
                      <Select onValueChange={(value) => handleSpecificationChange(field.name, value)}>
                        <SelectTrigger>
                          <SelectValue placeholder={`${field.label} seçin`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options?.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        id={field.name}
                        type={field.type}
                        placeholder={field.label}
                        onChange={(e) => handleSpecificationChange(field.name, e.target.value)}
                      />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Dosya Yükleme</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload onFileUpload={handleFileUpload} />
              
              {uploadedFiles.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Yüklenen dosyalar:</p>
                  <div className="flex flex-wrap gap-2">
                    {uploadedFiles.map((fileId, index) => (
                      <Badge key={index} variant="secondary">
                        Dosya {index + 1}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Design Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5" />
                AI Tasarım Oluşturucu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Yapay zeka ile profesyonel tasarımlar oluşturun. Logo, etiket, kartvizit ve daha fazlası.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="flex flex-col gap-2 h-auto py-4"
                    onClick={() => window.open('/design-engine', '_blank')}
                  >
                    <LayoutGrid className="h-6 w-6 text-blue-500" />
                    <span className="text-sm">Logo Tasarımı</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col gap-2 h-auto py-4"
                    onClick={() => window.open('/design-engine', '_blank')}
                  >
                    <Disc className="h-6 w-6 text-orange-500" />
                    <span className="text-sm">Etiket Tasarımı</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex flex-col gap-2 h-auto py-4"
                    onClick={() => window.open('/design-engine', '_blank')}
                  >
                    <Printer className="h-6 w-6 text-green-500" />
                    <span className="text-sm">Kartvizit Tasarımı</span>
                  </Button>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  onClick={() => window.open('/design-engine', '_blank')}
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  Tasarım Motorunu Aç
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createQuoteMutation.isPending}
              className={`${config.color} text-white hover:opacity-90 px-8 py-3 text-lg font-semibold`}
            >
              {createQuoteMutation.isPending ? (
                "Gönderiliyor..."
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Teklif Talep Et
                </>
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
