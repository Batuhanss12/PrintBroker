import React, { useState, useMemo, useRef, useEffect, useCallback, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Eye, FileText, Zap, Trash2, AlertCircle, CheckCircle, Settings, Ruler, RotateCcw, Maximize2 } from "lucide-react";

// Temel Tipler
interface Design {
  id: string;
  name: string;
  filename: string;
  type: string;
  thumbnailPath?: string;
  dimensions?: string;
  realDimensionsMM?: string;
  fileSize?: string;
  uploadedAt: string;
}

interface ArrangementItem {
  designId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  withMargins?: {
    width: number;
    height: number;
  };
}

interface ArrangementResult {
  arrangements: ArrangementItem[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  usedArea?: {
    width: number;
    height: number;
  };
}

interface PageDimensions {
  widthMM: number;
  heightMM: number;
  orientation: 'portrait' | 'landscape';
}

interface BleedSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Sayfa Şablonları
const PAPER_TEMPLATES = [
  { id: 'matbixx-33x48', name: 'Matbixx 33×48cm', widthMM: 330, heightMM: 480 },
  { id: 'a4', name: 'A4', widthMM: 210, heightMM: 297 },
  { id: 'a3', name: 'A3', widthMM: 297, heightMM: 420 },
  { id: 'a2', name: 'A2', widthMM: 420, heightMM: 594 },
  { id: 'a1', name: 'A1', widthMM: 594, heightMM: 841 },
  { id: 'custom', name: 'Özel Boyut', widthMM: 330, heightMM: 480 }
];

// Tasarım Boyutu Çıkarma Fonksiyonu
const extractDimensions = (design: Design): { width: number; height: number } => {
  if (design.realDimensionsMM && design.realDimensionsMM !== 'Unknown' && design.realDimensionsMM !== 'Bilinmiyor') {
    const match = design.realDimensionsMM.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
    if (match) {
      return { width: parseFloat(match[1]), height: parseFloat(match[2]) };
    }
  }
  // Varsayılan boyutlar
  return { width: 85, height: 55 }; // Kartvizit boyutu
};

// Basit Bin Packing Algoritması
const simpleBinPacking = (
  designs: Design[],
  pageWidth: number,
  pageHeight: number,
  margin: number = 5
): ArrangementItem[] => {
  const arrangements: ArrangementItem[] = [];
  let currentX = margin;
  let currentY = margin;
  let rowHeight = 0;

  for (const design of designs) {
    const dims = extractDimensions(design);
    const width = dims.width;
    const height = dims.height;

    // Sayfa sınırlarını kontrol et
    if (currentX + width + margin > pageWidth) {
      // Yeni satıra geç
      currentX = margin;
      currentY += rowHeight + margin;
      rowHeight = 0;
    }

    // Sayfa yükseklik sınırını kontrol et
    if (currentY + height + margin > pageHeight) {
      break; // Daha fazla sığmıyor
    }

    arrangements.push({
      designId: design.id,
      x: currentX,
      y: currentY,
      width: width,
      height: height,
      withMargins: {
        width: width + margin * 2,
        height: height + margin * 2
      }
    });

    currentX += width + margin;
    rowHeight = Math.max(rowHeight, height);
  }

  return arrangements;
};

// Önizleme Canvas Bileşeni
const PreviewCanvas = memo(({ 
  arrangements, 
  pageWidth, 
  pageHeight, 
  designs,
  isLoading = false
}: {
  arrangements: ArrangementItem[];
  pageWidth: number;
  pageHeight: number;
  designs: Design[];
  isLoading?: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(1);

  const renderPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas boyutlarını ayarla
    const scale = 1.5; // Görüntü kalitesi için
    const displayWidth = 600;
    const displayHeight = (pageHeight / pageWidth) * displayWidth;

    canvas.width = displayWidth * scale;
    canvas.height = displayHeight * scale;
    canvas.style.width = displayWidth + 'px';
    canvas.style.height = displayHeight + 'px';

    ctx.scale(scale, scale);
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Ölçek faktörü
    const scaleX = displayWidth / pageWidth;
    const scaleY = displayHeight / pageHeight;

    // Sayfa arkaplanı
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Sayfa sınırları
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, displayWidth, displayHeight);

    // Grid çizgileri
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 0.5;
    const gridSize = 50; // 50mm grid
    for (let x = gridSize * scaleX; x < displayWidth; x += gridSize * scaleX) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, displayHeight);
      ctx.stroke();
    }
    for (let y = gridSize * scaleY; y < displayHeight; y += gridSize * scaleY) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(displayWidth, y);
      ctx.stroke();
    }

    if (isLoading) {
      // Yükleme animasyonu
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(0, 0, displayWidth, displayHeight);

      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 18px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Dizilim hesaplanıyor...', displayWidth / 2, displayHeight / 2);
      return;
    }

    // Tasarımları çiz
    arrangements.forEach((item, index) => {
      const x = item.x * scaleX;
      const y = item.y * scaleY;
      const width = item.width * scaleX;
      const height = item.height * scaleY;

      // Tasarım için renk
      const hue = (index * 137.5) % 360;
      const color = `hsl(${hue}, 70%, 85%)`;
      const borderColor = `hsl(${hue}, 70%, 60%)`;

      // Tasarım alanı
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, height);

      // Kenar çizgisi
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Tasarım bilgisi
      ctx.fillStyle = '#333333';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';

      const design = designs.find(d => d.id === item.designId);
      const label = `${index + 1}`;
      ctx.fillText(label, x + width / 2, y + height / 2);

      // Dosya ismi (eğer yer varsa)
      if (width > 60 && height > 40 && design) {
        ctx.font = '10px Arial';
        const shortName = design.filename.length > 12 ? 
          design.filename.substring(0, 9) + '...' : design.filename;
        ctx.fillText(shortName, x + width / 2, y + height / 2 + 15);
      }

      // Boyut bilgisi
      if (width > 80 && height > 50) {
        ctx.font = '9px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(
          `${Math.round(item.width)}×${Math.round(item.height)}mm`, 
          x + width / 2, 
          y + height - 5
        );
      }
    });

    // İstatistikler
    const totalArea = pageWidth * pageHeight;
    const usedArea = arrangements.reduce((sum, item) => sum + (item.width * item.height), 0);
    const efficiency = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    ctx.fillStyle = '#333333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Yerleştirilen: ${arrangements.length}`, 10, displayHeight - 40);
    ctx.fillText(`Verimlilik: ${efficiency.toFixed(1)}%`, 10, displayHeight - 25);
    ctx.fillText(`Sayfa: ${pageWidth}×${pageHeight}mm`, 10, displayHeight - 10);

  }, [arrangements, pageWidth, pageHeight, designs, isLoading]);

  useEffect(() => {
    renderPreview();
  }, [renderPreview]);

  return (
    <div className="relative border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Dizilim Önizlemesi</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(Math.min(zoom * 1.2, 2))}
            className="h-6 w-6 p-0"
          >
            <Maximize2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setZoom(1)}
            className="h-6 px-2 text-xs"
          >
            1:1
          </Button>
        </div>
      </div>

      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="border border-gray-300 rounded"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center top' }}
        />
      </div>

      {!isLoading && arrangements.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Eye className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Dizilim önizlemesi burada görünecek</p>
          </div>
        </div>
      )}
    </div>
  );
});

// Tasarım Listesi Bileşeni
const DesignList = memo(({ designs }: { designs: Design[] }) => {
  if (designs.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Henüz dosya yüklenmedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-60 overflow-y-auto">
      {designs.map((design, index) => {
        const dims = extractDimensions(design);

        return (
          <div key={design.id} className="p-3 bg-gray-50 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate flex-1 mr-2">
                {design.filename}
              </span>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="font-medium text-gray-600">Boyut:</span>
                <p className="text-gray-800">
                  {dims.width}×{dims.height}mm
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Tip:</span>
                <Badge variant="outline" className="text-xs">
                  {design.type === 'application/pdf' ? 'PDF' : 
                   design.type === 'image/svg+xml' ? 'SVG' : 'Vektör'}
                </Badge>
              </div>
            </div>

            {design.fileSize && (
              <div className="mt-2 text-xs text-gray-500">
                Dosya boyutu: {design.fileSize}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});

// Ana Bileşen
export default function AutomationPanelNew() {
  const { toast } = useToast();
  const [arrangements, setArrangements] = useState<ArrangementResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sayfa ayarları
  const [selectedTemplate, setSelectedTemplate] = useState<string>('matbixx-33x48');
  const [customDimensions, setCustomDimensions] = useState<PageDimensions>({
    widthMM: 330,
    heightMM: 480,
    orientation: 'portrait'
  });

  // Kesim payları
  const [bleedSettings, setBleedSettings] = useState<BleedSettings>({
    top: 3,
    bottom: 3,
    left: 3,
    right: 3
  });

  // Mevcut sayfa boyutları
  const currentPageDimensions = useMemo<PageDimensions>(() => {
    if (selectedTemplate === 'custom') {
      return customDimensions;
    }

    const template = PAPER_TEMPLATES.find(t => t.id === selectedTemplate);
    if (!template) return customDimensions;

    return {
      widthMM: template.widthMM,
      heightMM: template.heightMM,
      orientation: 'portrait'
    };
  }, [selectedTemplate, customDimensions]);

  // Tasarımları getir
  const { 
    data: designs = [], 
    refetch: refetchDesigns, 
    isLoading: designsLoading, 
    error: designsError 
  } = useQuery<Design[]>({
    queryKey: ['/api/automation/plotter/designs'],
    queryFn: async () => {
      try {
        const response = await apiRequest<Design[]>('GET', '/api/automation/plotter/designs');
        console.log('Designs loaded:', response);
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Failed to fetch designs:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    retry: 2,
    staleTime: 5 * 60 * 1000,
  });

  // Dosya yükleme
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploadProgress(0);
      setIsProcessing(true);

      try {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 90);
              setUploadProgress(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                setUploadProgress(100);
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (parseError) {
                reject(new Error('Sunucu yanıtı işlenemedi'));
              }
            } else {
              reject(new Error(`HTTP ${xhr.status}: Yükleme başarısız`));
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Ağ hatası: Dosya yüklenemedi'));
          });

          xhr.open('POST', '/api/automation/plotter/upload-designs');
          xhr.send(formData);
        });
      } finally {
        setIsProcessing(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    onSuccess: (data: any) => {
      const uploadedCount = data.designs?.length || 0;
      toast({
        title: "Başarılı",
        description: `${uploadedCount} dosya yüklendi ve işlendi.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
      refetchDesigns();
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      toast({
        title: "Yükleme Hatası",
        description: error.message || "Dosya yükleme başarısız",
        variant: "destructive",
      });
    },
  });

  // Otomatik dizilim
  const autoArrangeMutation = useMutation({
    mutationFn: async (): Promise<ArrangementResult> => {
      if (!Array.isArray(designs) || designs.length === 0) {
        throw new Error('Dizim yapılacak tasarım bulunamadı');
      }

      console.log('Starting local arrangement with designs:', designs.length);

      // Kullanılabilir alan
      const pageWidth = currentPageDimensions.widthMM - bleedSettings.left - bleedSettings.right;
      const pageHeight = currentPageDimensions.heightMM - bleedSettings.top - bleedSettings.bottom;

      // Basit bin packing algoritması
      const arrangements = simpleBinPacking(designs, pageWidth, pageHeight, 5);

      console.log('Arranged items:', arrangements.length);

      const totalArea = pageWidth * pageHeight;
      const usedArea = arrangements.reduce((sum, item) => sum + (item.width * item.height), 0);
      const efficiency = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

      const result: ArrangementResult = {
        arrangements,
        totalArranged: arrangements.length,
        totalRequested: designs.length,
        efficiency: `${efficiency.toFixed(1)}%`,
        usedArea: {
          width: pageWidth,
          height: pageHeight
        }
      };

      return result;
    },
    onSuccess: (data: ArrangementResult) => {
      console.log('Arrangement completed:', data);
      setArrangements(data);

      if (data.totalArranged === 0) {
        toast({
          title: "Dizim Uyarısı",
          description: "Hiçbir tasarım sayfa alanına sığmadı. Sayfa boyutunu büyütün.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "✅ Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım dizildi. Verimlilik: ${data.efficiency}`,
      });

      // PDF'i otomatik oluştur
      setTimeout(() => {
        if (data.arrangements.length > 0) {
          generatePdfMutation.mutate({
            plotterSettings: {
              sheetWidth: currentPageDimensions.widthMM,
              sheetHeight: currentPageDimensions.heightMM,
              marginTop: bleedSettings.top,
              marginBottom: bleedSettings.bottom,
              marginLeft: bleedSettings.left,
              marginRight: bleedSettings.right,
              labelWidth: 50,
              labelHeight: 50,
              horizontalSpacing: 5,
              verticalSpacing: 5,
            },
            arrangements: data.arrangements
          });
        }
      }, 1000);
    },
    onError: (error: any) => {
      console.error('Auto-arrange error:', error);
      toast({
        title: "❌ Dizim Hatası",
        description: error.message || "Otomatik dizim başarısız",
        variant: "destructive",
      });
    },
  });

  // PDF oluşturma
  const generatePdfMutation = useMutation({
    mutationFn: async (data: { plotterSettings: any; arrangements: ArrangementItem[] }): Promise<Blob> => {
      if (!data.arrangements || data.arrangements.length === 0) {
        throw new Error('PDF oluşturmak için dizim verisi bulunamadı');
      }

      console.log('Generating PDF with data:', data);

      const response = await fetch('/api/automation/plotter/generate-pdf', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/pdf'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`PDF oluşturulamadı: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('Boş PDF dosyası oluşturuldu');
      }

      // PDF'i indir
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `matbixx-dizim-${Date.now()}.pdf`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);

      return blob;
    },
    onSuccess: (blob) => {
      const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      toast({
        title: "✅ PDF İndirildi",
        description: `Dizilim PDF'i başarıyla oluşturuldu (${sizeMB}MB).`,
      });
    },
    onError: (error: any) => {
      console.error('PDF generation error:', error);
      toast({
        title: "PDF Hatası",
        description: error.message || "PDF oluşturulamadı",
        variant: "destructive",
      });
    },
  });

  // Dosya yükleme handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    console.log('Files selected:', files.length);

    const validFiles: File[] = [];
    const allowedTypes = ['application/pdf', 'image/svg+xml', 'application/postscript'];

    Array.from(files).forEach((file) => {
      if (allowedTypes.includes(file.type) || file.name.toLowerCase().endsWith('.eps')) {
        validFiles.push(file);
      }
    });

    if (validFiles.length === 0) {
      toast({
        title: "Hata",
        description: "Sadece PDF, SVG, EPS dosyaları desteklenir",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    const formData = new FormData();
    validFiles.forEach((file) => {
      formData.append('designs', file);
    });

    uploadMutation.mutate(formData);
    event.target.value = '';
  };

  // Tüm dosyaları temizle
  const clearAllDesigns = async () => {
    try {
      await fetch('/api/automation/plotter/designs/clear', { method: 'DELETE' });
      await refetchDesigns();
      setArrangements(null);
      toast({
        title: "Temizlendi",
        description: "Tüm dosyalar temizlendi.",
      });
    } catch (error) {
      toast({
        title: "Hata",
        description: "Dosyalar temizlenemedi",
        variant: "destructive",
      });
    }
  };

  const isBusy = uploadMutation.isPending || generatePdfMutation.isPending || isProcessing;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Matbixx Vektörel Dizilim Sistemi
        </h1>
        <p className="text-gray-600">
          Profesyonel Vektörel Dosya İşleme ve Otomatik Dizilim
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sayfa Boyutu Ayarları */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ruler className="h-5 w-5" />
              Sayfa Boyutu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Şablon Seç</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAPER_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} - {template.widthMM}×{template.heightMM}mm
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplate === 'custom' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Genişlik (mm)</Label>
                  <Input
                    type="number"
                    value={customDimensions.widthMM}
                    onChange={(e) => setCustomDimensions(prev => ({ 
                      ...prev, 
                      widthMM: parseFloat(e.target.value) || 330 
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Yükseklik (mm)</Label>
                  <Input
                    type="number"
                    value={customDimensions.heightMM}
                    onChange={(e) => setCustomDimensions(prev => ({ 
                      ...prev, 
                      heightMM: parseFloat(e.target.value) || 480 
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>
            )}

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-900 mb-1">Mevcut Sayfa</div>
              <div className="text-lg font-bold text-blue-800">
                {currentPageDimensions.widthMM} × {currentPageDimensions.heightMM} mm
              </div>
              <div className="text-xs text-blue-600 mt-1">
                Kullanılabilir: {currentPageDimensions.widthMM - bleedSettings.left - bleedSettings.right} × {currentPageDimensions.heightMM - bleedSettings.top - bleedSettings.bottom} mm
              </div>
            </div>

            {/* Kesim Payları */}
            <div className="space-y-3 pt-3 border-t">
              <Label className="text-sm font-medium">Kesim Payları (mm)</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Üst/Alt</Label>
                  <Input
                    type="number"
                    value={bleedSettings.top}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setBleedSettings(prev => ({ ...prev, top: value, bottom: value }));
                    }}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Sol/Sağ</Label>
                  <Input
                    type="number"
                    value={bleedSettings.left}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      setBleedSettings(prev => ({ ...prev, left: value, right: value }));
                    }}
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dosya Yükleme */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Vektörel Dosya Yükleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Yükleme Alanı */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.svg,.eps"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isBusy}
                />
                <Label htmlFor="file-upload" className={`cursor-pointer ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">
                    Vektörel dosyalarınızı seçin
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, SVG, EPS formatları desteklenir
                  </p>
                </Label>
              </div>

              {/* Yükleme İlerlemesi */}
              {(uploadMutation.isPending || uploadProgress > 0) && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-blue-600">
                      {isProcessing ? 'Dosyalar işleniyor...' : 'Dosyalar yükleniyor...'}
                    </span>
                    <span className="text-blue-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Dosya Listesi */}
              {designsLoading && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-500">Dosyalar yükleniyor...</p>
                </div>
              )}

              {designsError && (
                <div className="text-center py-4 text-red-500">
                  <AlertCircle className="h-6 w-6 mx-auto mb-2" />
                  <p className="text-sm">Dosyalar yüklenemedi</p>
                </div>
              )}

              {!designsLoading && !designsError && designs.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">Yüklenen Dosyalar ({designs.length})</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllDesigns}
                      disabled={isBusy}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Tümünü Temizle
                    </Button>
                  </div>
                  <DesignList                      <Trash2 className="h-4 w-4 mr-1" />
                      Tümünü Temizle
                    </Button>
                  </div>
                  <DesignList designs={designs} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Önizleme */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Dizilim Önizlemesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <PreviewCanvas
            arrangements={arrangements?.arrangements || []}
            pageWidth={currentPageDimensions.widthMM}
            pageHeight={currentPageDimensions.heightMM}
            designs={designs}
            isLoading={autoArrangeMutation.isPending}
          />

          {/* Sonuç Özeti */}
          {arrangements && arrangements.arrangements.length > 0 && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-center">
                <div>
                  <p className="font-medium text-green-800">Sayfa Boyutu</p>
                  <p className="text-green-700">
                    {currentPageDimensions.widthMM}×{currentPageDimensions.heightMM}mm
                  </p>
                </div>
                <div>
                  <p className="font-medium text-green-800">Yerleştirme</p>
                  <p className="text-green-700">
                    ✅ {arrangements.totalArranged}/{arrangements.totalRequested} tasarım
                  </p>
                </div>
                <div>
                  <p className="font-medium text-green-800">Verimlilik</p>
                  <p className="text-green-700 font-bold">
                    📊 {arrangements.efficiency}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* İşlem Butonu */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Otomatik Dizilim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button
              size="lg"
              onClick={() => autoArrangeMutation.mutate()}
              disabled={designs.length === 0 || autoArrangeMutation.isPending || generatePdfMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-bold"
            >
              {autoArrangeMutation.isPending ? (
                <>
                  <Play className="animate-spin h-6 w-6 mr-3" />
                  DİZİLİYOR...
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-3" />
                  AKILLI DİZİN ({designs.length} DOSYA)
                </>
              )}
            </Button>

            {generatePdfMutation.isPending && (
              <div className="text-center">
                <div className="animate-pulse text-green-600 font-medium">PDF oluşturuluyor...</div>
                <Progress value={75} className="w-48 mt-2" />
              </div>
            )}

            <p className="text-sm text-gray-500 text-center max-w-md">
              Gelişmiş algoritma ile {currentPageDimensions.widthMM}×{currentPageDimensions.heightMM}mm 
              sayfa boyutuna otomatik yerleştirme ve PDF oluşturma.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}