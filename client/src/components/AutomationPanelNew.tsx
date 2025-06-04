import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Eye, FileText, Zap, Trash2, AlertCircle, CheckCircle } from "lucide-react";

interface PlotterSettings {
  sheetWidth: number;
  sheetHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  labelWidth: number;
  labelHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
}

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

// Vector file processing interfaces
interface VectorDimensions {
  width: number;
  height: number;
  unit: 'mm' | 'px' | 'pt' | 'in';
  dpi?: number;
}

interface ProcessedVectorFile {
  originalDimensions: VectorDimensions;
  printDimensions: VectorDimensions; // Always in mm
  withBleed: VectorDimensions;
  safeArea: VectorDimensions;
  colorProfile: ColorProfileInfo;
  cropMarks?: CropMarkSettings;
}

interface CropMarkSettings {
  enabled: boolean;
  length: number; // mm
  offset: number; // mm from design edge
  lineWidth: number; // mm
}

interface UploadResponse {
  message: string;
  designs: Design[];
}

interface ApiError {
  message: string;
  status?: number;
}

// Constants for file validation
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ['application/pdf', 'image/svg+xml', 'application/postscript', 'application/illustrator', 'application/eps'];
const ALLOWED_EXTENSIONS = ['pdf', 'svg', 'ai', 'eps'];

// Vector file processing constants
const DEFAULT_DPI = 300; // Print quality DPI
const POINTS_TO_MM = 0.352778; // Conversion factor from points to millimeters
const INCHES_TO_MM = 25.4; // Conversion factor from inches to millimeters

// Bleed and margin constants
interface BleedSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

interface SafeAreaSettings {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

// Color profile types
type ColorProfile = 'CMYK' | 'RGB' | 'GRAYSCALE' | 'UNKNOWN';

interface ColorProfileInfo {
  profile: ColorProfile;
  isValid: boolean;
  recommendation: string;
}

export default function AutomationPanelNew() {
  const { toast } = useToast();
  const [arrangements, setArrangements] = useState<ArrangementResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Bleed and crop marks settings
  const [bleedSettings, setBleedSettings] = useState<BleedSettings>({
    top: 3,    // mm
    bottom: 3, // mm
    left: 3,   // mm
    right: 3   // mm
  });

  const [safeAreaSettings, setSafeAreaSettings] = useState<SafeAreaSettings>({
    top: 5,    // mm
    bottom: 5, // mm
    left: 5,   // mm
    right: 5   // mm
  });

  const [showCropMarks, setShowCropMarks] = useState<boolean>(true);
  const [colorProfileCheck, setColorProfileCheck] = useState<boolean>(true);

  // Fixed 33x48cm settings
  const plotterSettings: PlotterSettings = {
    sheetWidth: 330,
    sheetHeight: 480,
    marginTop: 3,
    marginBottom: 3,
    marginLeft: 3,
    marginRight: 3,
    labelWidth: 50,
    labelHeight: 50,
    horizontalSpacing: 2,
    verticalSpacing: 2,
  };

  // File validation helper
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, error: `Dosya boyutu ${MAX_FILE_SIZE / 1024 / 1024}MB'yi aşamaz` };
    }

    const fileExt = file.name.toLowerCase().split('.').pop();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(fileExt || '')) {
      return { isValid: false, error: 'Sadece PDF, SVG, AI ve EPS dosyaları desteklenir' };
    }

    return { isValid: true };
  };

  /**
   * Vektörel dosya boyutlarını hesaplar ve MM cinsine çevirir
   * @param width - Genişlik değeri
   * @param height - Yükseklik değeri  
   * @param unit - Birim (mm, px, pt, in)
   * @param dpi - DPI değeri (pixel biriminde ise gerekli)
   * @returns MM cinsinden boyutlar
   */
  const calculateVectorDimensions = (
    width: number,
    height: number,
    unit: 'mm' | 'px' | 'pt' | 'in',
    dpi: number = DEFAULT_DPI
  ): VectorDimensions => {
    let widthMM: number;
    let heightMM: number;

    switch (unit) {
      case 'mm':
        widthMM = width;
        heightMM = height;
        break;
      case 'px':
        // Pixel'den MM'ye çevirme (DPI kullanarak)
        widthMM = (width / dpi) * INCHES_TO_MM;
        heightMM = (height / dpi) * INCHES_TO_MM;
        break;
      case 'pt':
        // Point'den MM'ye çevirme
        widthMM = width * POINTS_TO_MM;
        heightMM = height * POINTS_TO_MM;
        break;
      case 'in':
        // Inch'den MM'ye çevirme
        widthMM = width * INCHES_TO_MM;
        heightMM = height * INCHES_TO_MM;
        break;
      default:
        throw new Error(`Desteklenmeyen birim: ${unit}`);
    }

    return {
      width: Math.round(widthMM * 100) / 100, // 2 ondalık basamak
      height: Math.round(heightMM * 100) / 100,
      unit: 'mm',
      dpi: unit === 'px' ? dpi : undefined
    };
  };

  /**
   * Kesim payı (bleed) hesaplamaları yapar
   * @param dimensions - Orijinal tasarım boyutları (MM)
   * @param bleedSettings - Kesim payı ayarları (MM)
   * @returns Kesim payı eklenmiş boyutlar
   */
  const calculateBleedDimensions = (
    dimensions: VectorDimensions,
    bleedSettings: BleedSettings
  ): VectorDimensions => {
    const widthWithBleed = dimensions.width + bleedSettings.left + bleedSettings.right;
    const heightWithBleed = dimensions.height + bleedSettings.top + bleedSettings.bottom;

    return {
      width: Math.round(widthWithBleed * 100) / 100,
      height: Math.round(heightWithBleed * 100) / 100,
      unit: 'mm'
    };
  };

  /**
   * Güvenli alan (safe area) hesaplamaları yapar
   * @param dimensions - Orijinal tasarım boyutları (MM)
   * @param safeAreaSettings - Güvenli alan ayarları (MM)
   * @returns Güvenli alan boyutları
   */
  const calculateSafeArea = (
    dimensions: VectorDimensions,
    safeAreaSettings: SafeAreaSettings
  ): VectorDimensions => {
    const safeWidth = dimensions.width - safeAreaSettings.left - safeAreaSettings.right;
    const safeHeight = dimensions.height - safeAreaSettings.top - safeAreaSettings.bottom;

    return {
      width: Math.max(0, Math.round(safeWidth * 100) / 100),
      height: Math.max(0, Math.round(safeHeight * 100) / 100),
      unit: 'mm'
    };
  };

  /**
   * Crop marks (kesim işaretleri) ayarlarını hesaplar
   * @param dimensions - Tasarım boyutları
   * @param bleedSettings - Kesim payı ayarları
   * @returns Crop marks ayarları
   */
  const calculateCropMarks = (
    dimensions: VectorDimensions,
    bleedSettings: BleedSettings
  ): CropMarkSettings => {
    // Standart kesim işareti uzunluğu: 5mm
    // Standart ofset: kesim payının yarısı + 2mm
    const averageBleed = (bleedSettings.top + bleedSettings.bottom + bleedSettings.left + bleedSettings.right) / 4;

    return {
      enabled: true,
      length: 5, // mm
      offset: Math.max(2, averageBleed / 2 + 2), // mm
      lineWidth: 0.25 // mm (0.25mm = yaklaşık 0.7pt)
    };
  };

  /**
   * Renk profili kontrolü yapar
   * @param filename - Dosya adı
   * @param fileType - Dosya tipi
   * @returns Renk profili bilgisi
   */
  const analyzeColorProfile = (filename: string, fileType: string): ColorProfileInfo => {
    // Dosya uzantısına göre varsayılan profil tahmini
    let profile: ColorProfile = 'UNKNOWN';
    let isValid = true;
    let recommendation = '';

    const extension = filename.toLowerCase().split('.').pop();

    switch (extension) {
      case 'pdf':
        // PDF'ler genellikle CMYK veya RGB olabilir
        profile = 'CMYK'; // Varsayılan olarak print-ready kabul
        recommendation = 'PDF dosyası tespit edildi. Baskı için CMYK profili önerilir.';
        break;
      case 'ai':
        profile = 'CMYK';
        recommendation = 'Adobe Illustrator dosyası. Baskı için ideal formattır.';
        break;
      case 'eps':
        profile = 'CMYK';
        recommendation = 'EPS dosyası. Profesyonel baskı için uygundur.';
        break;
      case 'svg':
        profile = 'RGB';
        isValid = false;
        recommendation = 'SVG dosyası RGB renk uzayında. Baskı için CMYK\'ya çevrilmesi önerilir.';
        break;
      default:
        profile = 'UNKNOWN';
        isValid = false;
        recommendation = 'Renk profili belirlenemedi. Manuel kontrol gerekli.';
    }

    return {
      profile,
      isValid,
      recommendation
    };
  };

  /**
   * Vektörel dosyayı tam olarak işler (boyut, kesim payı, renk profili)
   * @param design - Tasarım dosyası bilgisi
   * @param bleedSettings - Kesim payı ayarları
   * @param safeAreaSettings - Güvenli alan ayarları
   * @returns İşlenmiş vektörel dosya bilgisi
   */
  const processVectorFile = (
    design: Design,
    bleedSettings: BleedSettings,
    safeAreaSettings: SafeAreaSettings
  ): ProcessedVectorFile => {
    // Dosyadan boyut bilgisini çıkar
    let originalDimensions: VectorDimensions;

    try {
      if (design.realDimensionsMM && design.realDimensionsMM !== 'Unknown' && design.realDimensionsMM !== 'Bilinmiyor') {
        const match = design.realDimensionsMM.match(/(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)/);
        if (match) {
          originalDimensions = {
            width: parseFloat(match[1]),
            height: parseFloat(match[2]),
            unit: 'mm'
          };
        } else {
          throw new Error('Boyut bilgisi ayrıştırılamadı');
        }
      } else {
        // Varsayılan boyutlar
        originalDimensions = {
          width: 50,
          height: 30,
          unit: 'mm'
        };
      }
    } catch (error) {
      console.warn('Boyut bilgisi çıkarılırken hata:', error);
      originalDimensions = {
        width: 50,
        height: 30,
        unit: 'mm'
      };
    }

    // Hesaplamaları yap
    const printDimensions = originalDimensions; // Zaten MM cinsinde
    const withBleed = calculateBleedDimensions(printDimensions, bleedSettings);
    const safeArea = calculateSafeArea(printDimensions, safeAreaSettings);
    const colorProfile = analyzeColorProfile(design.filename, design.type);
    const cropMarks = calculateCropMarks(printDimensions, bleedSettings);

    return {
      originalDimensions,
      printDimensions,
      withBleed,
      safeArea,
      colorProfile,
      cropMarks
    };
  };

  /**
   * DPI kalitesini değerlendirir
   * @param dpi - DPI değeri
   * @returns Kalite değerlendirmesi
   */
  const evaluateDPIQuality = (dpi: number): { level: string; recommendation: string; color: string } => {
    if (dpi >= 300) {
      return {
        level: 'Yüksek Kalite',
        recommendation: 'Profesyonel baskı için ideal',
        color: 'text-green-600'
      };
    } else if (dpi >= 150) {
      return {
        level: 'Orta Kalite',
        recommendation: 'Günlük baskılar için uygun',
        color: 'text-yellow-600'
      };
    } else {
      return {
        level: 'Düşük Kalite',
        recommendation: 'Baskı kalitesi düşük olabilir',
        color: 'text-red-600'
      };
    }
  };

  // Enhanced error handler
  const handleError = (error: unknown, defaultMessage: string) => {
    console.error('Error:', error);

    let errorMessage = defaultMessage;

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      errorMessage = (error as ApiError).message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    toast({
      title: "Hata",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Get designs with improved error handling
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
        return Array.isArray(response) ? response : [];
      } catch (error) {
        console.error('Failed to fetch designs:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Enhanced upload mutation with better progress tracking
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<UploadResponse> => {
      setUploadProgress(0);
      setIsProcessing(true);

      try {
        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentComplete = Math.round((e.loaded / e.total) * 90); // Reserve 10% for processing
              setUploadProgress(percentComplete);
            }
          });

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                setUploadProgress(100);
                const response = JSON.parse(xhr.responseText) as UploadResponse;
                resolve(response);
              } catch (parseError) {
                reject(new Error('Sunucu yanıtı işlenemedi'));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText) as ApiError;
                reject(new Error(errorResponse.message || `HTTP ${xhr.status}: Yükleme başarısız`));
              } catch {
                reject(new Error(`HTTP ${xhr.status}: Yükleme başarısız`));
              }
            }
          });

          xhr.addEventListener('error', () => {
            reject(new Error('Ağ hatası: Dosya yüklenemedi'));
          });

          xhr.addEventListener('timeout', () => {
            reject(new Error('Zaman aşımı: Dosya yükleme işlemi çok uzun sürdü'));
          });

          xhr.addEventListener('abort', () => {
            reject(new Error('Yükleme iptal edildi'));
          });

          xhr.open('POST', '/api/automation/plotter/upload-designs');
          xhr.timeout = 300000; // 5 minutes timeout
          xhr.send(formData);
        });
      } finally {
        setIsProcessing(false);
        setTimeout(() => setUploadProgress(0), 1000);
      }
    },
    onSuccess: (data: UploadResponse) => {
      const uploadedCount = data.designs?.length || 0;
      toast({
        title: "Başarılı",
        description: `${uploadedCount} dosya yüklendi ve işlendi.`,
      });

      // Invalidate and refetch designs
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
      refetchDesigns();
    },
    onError: (error: unknown) => {
      handleError(error, "Dosya yükleme başarısız");
    },
  });

  // Auto-arrange mutation
  const autoArrangeMutation = useMutation({
    mutationFn: async (): Promise<ArrangementResult> => {
      if (!Array.isArray(designs) || designs.length === 0) {
        throw new Error('Dizim yapılacak tasarım bulunamadı');
      }

      const designIds = designs.map((d: Design) => d.id);
      console.log('Starting auto-arrange with designs:', designIds);

      try {
        const result = await apiRequest<ArrangementResult>('POST', '/api/automation/plotter/auto-arrange', {
          designIds,
          plotterSettings
        });

        if (!result || typeof result !== 'object') {
          throw new Error('Geçersiz dizim sonucu alındı');
        }

        if (!Array.isArray(result.arrangements)) {
          console.warn('Arrangements is not an array:', result.arrangements);
          result.arrangements = [];
        }

        return result;
      } catch (error) {
        console.error('Auto-arrange API error:', error);
        throw error;
      }
    },
    onSuccess: (data: ArrangementResult) => {
      console.log('Arrangement response received:', data);
      setArrangements(data);

      if (!data.arrangements || data.arrangements.length === 0 || data.totalArranged === 0) {
        toast({
          title: "Uyarı",
          description: "Hiçbir tasarım baskı alanına sığmadı. Tasarım boyutlarını kontrol edin.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım dizildi (${data.efficiency} verimlilik)`,
      });

      // Automatically generate PDF after successful arrangement
      if (data.arrangements.length > 0) {
        setTimeout(() => {
          const pdfData = {
            plotterSettings: plotterSettings,
            arrangements: data.arrangements
          };
          console.log('Sending to PDF generation:', pdfData);
          generatePdfMutation.mutate(pdfData);
        }, 1000);
      }
    },
    onError: (error: unknown) => {
      handleError(error, "Otomatik dizim başarısız");
    },
  });

  // Enhanced PDF generation mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (data: { plotterSettings: PlotterSettings; arrangements: ArrangementItem[] }): Promise<Blob> => {
      if (!data.arrangements || !Array.isArray(data.arrangements) || data.arrangements.length === 0) {
        throw new Error('PDF oluşturmak için dizim verisi bulunamadı');
      }

      console.log('Generating PDF with data:', data);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

      try {
        const response = await fetch('/api/automation/plotter/generate-pdf', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/pdf'
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json() as ApiError;
            throw new Error(errorData.message || `PDF oluşturulamadı: ${response.status}`);
          } else {
            const errorText = await response.text();
            throw new Error(`PDF oluşturulamadı: ${response.status} - ${errorText}`);
          }
        }

        const blob = await response.blob();
        if (blob.size === 0) {
          throw new Error('Boş PDF dosyası oluşturuldu');
        }

        // Auto-download PDF with error handling
        try {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `matbixx-dizim-${new Date().toISOString().slice(0, 10)}.pdf`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();

          // Clean up
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }, 100);
        } catch (downloadError) {
          console.error('Download error:', downloadError);
          // Still return the blob even if download fails
        }

        return blob;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error instanceof Error && error.name === 'AbortError') {
          throw new Error('PDF oluşturma işlemi zaman aşımına uğradı');
        }
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "PDF İndirildi",
        description: "Dizim PDF'i başarıyla oluşturuldu ve indirildi.",
      });
    },
    onError: (error: unknown) => {
      handleError(error, "PDF oluşturulamadı");
    },
  });

  // Enhanced file upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.log('No files selected');
      return;
    }

    console.log('Files selected:', files.length);

    // Validate all files before upload
    const invalidFiles: string[] = [];
    const validFiles: File[] = [];

    Array.from(files).forEach((file, index) => {
      console.log(`File ${index + 1}:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });

      const validation = validateFile(file);
      if (!validation.isValid) {
        invalidFiles.push(`${file.name}: ${validation.error}`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidFiles.length > 0) {
      toast({
        title: "Geçersiz Dosyalar",
        description: invalidFiles.join(', '),
        variant: "destructive",
      });

      if (validFiles.length === 0) {
        event.target.value = '';
        return;
      }
    }

    if (validFiles.length === 0) {
      toast({
        title: "Hata",
        description: "Yüklenecek geçerli dosya bulunamadı",
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    // Create FormData with valid files
    const formData = new FormData();
    validFiles.forEach((file) => {
      console.log(`Adding file to FormData:`, {
        name: file.name,
        type: file.type,
        size: file.size
      });
      formData.append('designs', file);
    });

    console.log('Uploading files...');
    uploadMutation.mutate(formData);

    // Reset input
    event.target.value = '';
  };

  // Enhanced clear designs function
  const clearAllDesigns = async () => {
    try {
      const response = await fetch('/api/automation/plotter/designs/clear', { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json() as ApiError;
        throw new Error(errorData.message || 'Dosyalar temizlenemedi');
      }

      await refetchDesigns();
      setArrangements(null);
      toast({
        title: "Temizlendi",
        description: "Tüm dosyalar temizlendi.",
      });
    } catch (error) {
      handleError(error, "Dosyalar temizlenemedi");
    }
  };

  // Loading state component
  const LoadingState = ({ message }: { message: string }) => (
    <div className="text-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  );

  // Error state component
  const ErrorState = ({ message, onRetry }: { message: string; onRetry: () => void }) => (
    <div className="text-center py-8">
      <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
      <p className="text-red-600 mb-4">{message}</p>
      <Button onClick={onRetry} variant="outline" size="sm">
        Tekrar Dene
      </Button>
    </div>
  );

  // Check if system is busy
  const isBusy = uploadMutation.isPending || autoArrangeMutation.isPending || generatePdfMutation.isPending || isProcessing;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Otomatik Vektörel Dizim Sistemi
        </h1>
        <p className="text-gray-600">
          33x48cm Sabit Format | Vektörel Dosyalar (PDF, SVG, AI, EPS)
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              1. Vektörel Dosya Yükleme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  multiple
                  accept=".pdf,.svg,.ai,.eps"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isBusy}
                />
                <Label htmlFor="file-upload" className={`cursor-pointer ${isBusy ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900">
                    Vektörel dosyaları seçin
                  </p>
                  <p className="text-sm text-gray-500">
                    PDF, SVG, AI, EPS formatları desteklenir (Max: 100MB)
                  </p>
                </Label>
              </div>

              {/* Upload Progress */}
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

              {/* Designs List */}
              {designsLoading && <LoadingState message="Tasarımlar yükleniyor..." />}

              {designsError && (
                <ErrorState 
                  message="Tasarımlar yüklenemedi" 
                  onRetry={() => refetchDesigns()} 
                />
              )}

              {!designsLoading && !designsError && designs.length > 0 && (
                <div className="space-y-2">
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
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {designs.map((design: Design) => {
                      const processedFile = processVectorFile(design, bleedSettings, safeAreaSettings);
                      return (
                        <div key={design.id} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium truncate flex-1 mr-2">{design.filename}</span>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="font-medium text-gray-600">Boyut:</span>
                              <p className="text-gray-800">
                                {processedFile.printDimensions.width}×{processedFile.printDimensions.height}mm
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Kesim Payı ile:</span>
                              <p className="text-blue-600">
                                {processedFile.withBleed.width}×{processedFile.withBleed.height}mm
                              </p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Renk Profili:</span>
                              <Badge 
                                variant={processedFile.colorProfile.isValid ? "default" : "destructive"} 
                                className="text-xs"
                              >
                                {processedFile.colorProfile.profile}
                              </Badge>
                            </div>
                            <div>
                              <span className="font-medium text-gray-600">Güvenli Alan:</span>
                              <p className="text-green-600">
                                {processedFile.safeArea.width}×{processedFile.safeArea.height}mm
                              </p>
                            </div>
                          </div>

                          {!processedFile.colorProfile.isValid && (
                            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                              <p className="text-yellow-800">⚠️ {processedFile.colorProfile.recommendation}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {!designsLoading && !designsError && designs.length === 0 && (
                <div className="text-center py-4 text-gray-500">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Henüz dosya yüklenmedi</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Bleed and Crop Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Kesim Payı ve Crop Mark Ayarları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Bleed Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Kesim Payları (mm)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBleedSettings({ top: 3, bottom: 3, left: 3, right: 3 })}
                  className="text-xs"
                >
                  Varsayılan (3mm)
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="bleed-top" className="text-xs">Üst</Label>
                  <input
                    id="bleed-top"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={bleedSettings.top}
                    onChange={(e) => setBleedSettings(prev => ({ ...prev, top: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="bleed-bottom" className="text-xs">Alt</Label>
                  <input
                    id="bleed-bottom"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={bleedSettings.bottom}
                    onChange={(e) => setBleedSettings(prev => ({ ...prev, bottom: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="bleed-left" className="text-xs">Sol</Label>
                  <input
                    id="bleed-left"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={bleedSettings.left}
                    onChange={(e) => setBleedSettings(prev => ({ ...prev, left: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
                <div>
                  <Label htmlFor="bleed-right" className="text-xs">Sağ</Label>
                  <input
                    id="bleed-right"
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    value={bleedSettings.right}
                    onChange={(e) => setBleedSettings(prev => ({ ...prev, right: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-sm border rounded"
                  />
                </div>
              </div>
            </div>

            {/* Crop Marks Settings */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="crop-marks"
                  checked={showCropMarks}
                  onChange={(e) => setShowCropMarks(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor="crop-marks" className="text-sm font-medium cursor-pointer">
                  Kesim işaretleri (Crop Marks) ekle
                </Label>
              </div>

              {showCropMarks && (
                <div className="ml-6 p-3 bg-blue-50 rounded-lg text-xs text-blue-800">
                  <p>• Uzunluk: 5mm</p>
                  <p>• Ofset: Kesim payından 2mm dışarıda</p>
                  <p>• Kalınlık: 0.25mm (0.7pt)</p>
                </div>
              )}
            </div>

            {/* Color Profile Check */}
            <div className="space-y-3 pt-3 border-t">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="color-profile"
                  checked={colorProfileCheck}
                  onChange={(e) => setColorProfileCheck(e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <Label htmlFor="color-profile" className="text-sm font-medium cursor-pointer">
                  Renk profili kontrolü yap (CMYK önerisi)
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              2. Dizim Önizlemesi
            </CardTitle>
          </CardHeader>
          <CardContent>
            {arrangements && arrangements.arrangements && arrangements.arrangements.length > 0 ? (
              <div className="space-y-4">
                <div 
                  className="relative border-2 border-dashed border-gray-300 mx-auto bg-gray-50"
                  style={{
                    width: '300px',
                    height: '400px',
                  }}
                >
                  {arrangements.arrangements.map((item: ArrangementItem, index: number) => (
                    <div
                      key={`${item.designId}-${index}`}
                      className="absolute bg-blue-200 border border-blue-500 rounded flex items-center justify-center text-xs font-bold text-blue-800"
                      style={{
                        left: `${(item.x / 330) * 85}%`,
                        top: `${(item.y / 480) * 85}%`,
                        width: `${Math.max(15, (item.width / 330) * 85)}px`,
                        height: `${Math.max(10, (item.height / 480) * 85)}px`,
                      }}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    33cm x 48cm | {arrangements.totalArranged} tasarım dizildi
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    Verimlilik: {arrangements.efficiency}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Eye className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium mb-2">
                  Önizleme Boş
                </p>
                <p className="text-gray-400 text-sm">
                  Dosya yükleyin ve dizim yapın
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            3. Otomatik İşlem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center space-y-4">
            <Button
              size="lg"
              onClick={() => autoArrangeMutation.mutate()}
              disabled={designs.length === 0 || isBusy}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-12 py-4 text-lg font-bold disabled:opacity-50"
            >
              {autoArrangeMutation.isPending ? (
                <>
                  <Play className="animate-spin h-6 w-6 mr-3" />
                  DİZİLİYOR...
                </>
              ) : (
                <>
                  <Play className="h-6 w-6 mr-3" />
                  HEMEN DİZİN
                </>
              )}
            </Button>

            {generatePdfMutation.isPending && (
              <div className="text-center">
                <div className="animate-pulse text-green-600 font-medium">PDF oluşturuluyor ve indiriliyor...</div>
                <div className="mt-2">
                  <Progress value={75} className="w-48" />
                </div>
              </div>
            )}

            <p className="text-sm text-gray-500 text-center max-w-md">
              Tüm vektörel dosyalarınız otomatik olarak 33x48cm baskı alanına yerleştirilecek 
              ve PDF olarak indirilecek.
            </p>

            {/* Status indicators */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${designs.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Dosyalar Yüklendi</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${arrangements ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>Dizim Tamamlandı</span>
              </div>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${generatePdfMutation.isSuccess ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span>PDF İndirildi</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}