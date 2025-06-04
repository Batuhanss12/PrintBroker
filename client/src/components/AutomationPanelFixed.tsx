import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Download, Eye, FileText, Zap, Trash2 } from "lucide-react";

// Enhanced type definitions
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
  withMargins: {
    width: number;
    height: number;
  };
}

interface ArrangementResult {
  arrangements: ArrangementItem[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  usedArea: {
    width: number;
    height: number;
  };
}

interface FileUploadResponse {
  success: boolean;
  message: string;
  file?: Design;
}

interface ClearResponse {
  message: string;
  deletedCount: number;
}

interface APIError extends Error {
  status?: number;
  code?: string;
}

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/pdf', 'image/svg+xml', 'application/postscript'];
const API_TIMEOUT = 30000; // 30 seconds

export default function AutomationPanelFixed() {
  const { toast } = useToast();
  
  // State management with proper typing
  const [arrangements, setArrangements] = useState<ArrangementResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Plotter settings with validation
  const plotterSettings: PlotterSettings = {
    sheetWidth: 330,    // 33cm
    sheetHeight: 480,   // 48cm
    marginTop: 3,       // 0.3cm
    marginBottom: 3,
    marginLeft: 3,
    marginRight: 3,
    labelWidth: 50,     // 5cm
    labelHeight: 50,    // 5cm
    horizontalSpacing: 2,
    verticalSpacing: 2
  };

  // File validation helper
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { isValid: false, error: `Dosya boyutu ${MAX_FILE_SIZE / 1024 / 1024}MB'yi aşamaz` };
    }
    
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { isValid: false, error: 'Sadece PDF, SVG ve EPS dosyaları desteklenir' };
    }
    
    return { isValid: true };
  };

  // Enhanced error handler
  const handleError = (error: unknown, fallbackMessage: string): void => {
    console.error('API Error:', error);
    
    const apiError = error as APIError;
    let errorMessage = fallbackMessage;
    
    if (apiError.message) {
      errorMessage = apiError.message;
    } else if (apiError.status === 401) {
      errorMessage = "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
    } else if (apiError.status === 413) {
      errorMessage = "Dosya boyutu çok büyük.";
    } else if (apiError.status === 429) {
      errorMessage = "Çok fazla istek. Lütfen bekleyin.";
    }
    
    toast({
      title: "Hata",
      description: errorMessage,
      variant: "destructive",
    });
  };

  // Get designs with enhanced error handling
  const { data: designs = [], isLoading: designsLoading, refetch: refetchDesigns } = useQuery({
    queryKey: ['/api/automation/plotter/designs'],
    queryFn: () => apiRequest<Design[]>('GET', '/api/automation/plotter/designs'),
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Clear designs mutation
  const clearMutation = useMutation({
    mutationFn: async (): Promise<ClearResponse> => {
      return apiRequest('DELETE', '/api/automation/plotter/designs/clear');
    },
    onSuccess: (data) => {
      toast({
        title: "Temizleme Başarılı",
        description: `${data.deletedCount} tasarım silindi.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
      setArrangements(null);
    },
    onError: (error: unknown) => handleError(error, "Tasarımlar temizlenemedi"),
  });

  // File upload mutation with progress tracking
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList): Promise<FileUploadResponse[]> => {
      const results: FileUploadResponse[] = [];
      setUploadProgress(0);
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate each file
        const validation = validateFile(file);
        if (!validation.isValid) {
          throw new Error(validation.error);
        }
        
        const formData = new FormData();
        formData.append('designs', file);
        
        try {
          const result = await apiRequest('POST', '/api/automation/plotter/upload-designs', formData);
          results.push(result);
          
          // Update progress
          setUploadProgress(((i + 1) / files.length) * 100);
        } catch (error) {
          console.error(`File upload failed for ${file.name}:`, error);
          throw error;
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter(r => r.success).length;
      toast({
        title: "Yükleme Başarılı",
        description: `${successCount} dosya başarıyla yüklendi.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
      setUploadProgress(0);
    },
    onError: (error: unknown) => {
      handleError(error, "Dosya yükleme başarısız");
      setUploadProgress(0);
    },
  });

  // Auto-arrange mutation with enhanced error handling
  const autoArrangeMutation = useMutation({
    mutationFn: async (): Promise<ArrangementResult> => {
      if (!designs || designs.length === 0) {
        throw new Error("Dizim için en az bir tasarım gerekli");
      }
      
      setIsProcessing(true);
      const designIds = designs.map((d: Design) => d.id);
      
      const result = await apiRequest('POST', '/api/automation/plotter/auto-arrange', {
        designIds,
        plotterSettings
      });
      
      return result;
    },
    onSuccess: (data: ArrangementResult) => {
      console.log('Arrangement response received:', data);
      setArrangements(data);
      setIsProcessing(false);
      
      toast({
        title: "Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım dizildi (${data.efficiency} verimlilik)`,
      });
      
      // Auto-generate PDF with validation
      if (data.arrangements && Array.isArray(data.arrangements) && data.arrangements.length > 0) {
        setTimeout(() => {
          generatePdfMutation.mutate({ 
            plotterSettings, 
            arrangements: data.arrangements
          });
        }, 1500); // Increased delay for better UX
      } else {
        toast({
          title: "Uyarı",
          description: "Dizim başarılı ama PDF oluşturulamıyor - veri eksik",
          variant: "destructive",
        });
      }
    },
    onError: (error: unknown) => {
      setIsProcessing(false);
      handleError(error, "Otomatik dizim başarısız");
    },
  });

  // PDF generation mutation
  const generatePdfMutation = useMutation({
    mutationFn: async (data: { plotterSettings: PlotterSettings; arrangements: ArrangementItem[] }) => {
      return apiRequest('POST', '/api/automation/plotter/generate-pdf', data);
    },
    onSuccess: (response: { pdfUrl: string }) => {
      toast({
        title: "PDF Hazır",
        description: "Baskı dosyanız indirilmeye başlıyor...",
      });
      
      // Auto-download PDF
      const link = document.createElement('a');
      link.href = response.pdfUrl;
      link.download = `dizim-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    },
    onError: (error: unknown) => handleError(error, "PDF oluşturma başarısız"),
  });

  // File input handler with validation
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Reset input value for re-upload capability
    event.target.value = '';
    
    uploadMutation.mutate(files);
  };

  // Render design preview with error boundary
  const renderDesignPreview = (design: Design) => {
    try {
      return (
        <div 
          key={design.id} 
          className="flex items-center justify-between p-3 border rounded-lg bg-gray-50 dark:bg-gray-800"
          role="listitem"
          aria-label={`Tasarım: ${design.name}`}
        >
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" aria-hidden="true" />
            <div>
              <p className="font-medium text-sm truncate max-w-[200px]" title={design.name}>
                {design.name}
              </p>
              <p className="text-xs text-gray-500">
                {design.realDimensionsMM || design.dimensions || 'Boyut bilinmiyor'}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            {design.type || 'PDF'}
          </Badge>
        </div>
      );
    } catch (error) {
      console.error('Error rendering design preview:', error);
      return (
        <div key={design.id} className="p-3 border rounded-lg bg-red-50 dark:bg-red-900/20">
          <p className="text-red-600 text-sm">Önizleme hatası</p>
        </div>
      );
    }
  };

  // Render arrangement visualization
  const renderArrangementVisualization = () => {
    if (!arrangements || !arrangements.arrangements.length) return null;

    const scale = 0.5; // Scale down for display
    const sheetWidth = plotterSettings.sheetWidth * scale;
    const sheetHeight = plotterSettings.sheetHeight * scale;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            Dizim Önizlemesi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-600 mx-auto"
               style={{ width: `${sheetWidth}px`, height: `${sheetHeight}px` }}
               role="img"
               aria-label="Tasarım dizim önizlemesi">
            
            {arrangements.arrangements.map((item, index) => {
              const design = designs.find((d: Design) => d.id === item.designId);
              return (
                <div
                  key={`${item.designId}-${index}`}
                  className="absolute bg-blue-200 dark:bg-blue-800 border border-blue-400 rounded flex items-center justify-center text-xs font-medium"
                  style={{
                    left: `${item.x * scale}px`,
                    top: `${item.y * scale}px`,
                    width: `${item.width * scale}px`,
                    height: `${item.height * scale}px`,
                  }}
                  title={design?.name || `Tasarım ${index + 1}`}
                >
                  {index + 1}
                </div>
              );
            })}
            
            {/* Sheet dimensions label */}
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
              {plotterSettings.sheetWidth}×{plotterSettings.sheetHeight}mm
            </div>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Dizilen:</span> {arrangements.totalArranged}/{arrangements.totalRequested}
            </div>
            <div>
              <span className="font-medium">Verimlilik:</span> {arrangements.efficiency}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6" role="main" aria-label="Otomatik tasarım dizim sistemi">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-orange-600" />
            Otomatik Tasarım Dizim Sistemi
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tasarımlarınızı 33×48cm baskı alanına otomatik yerleştirin
          </p>
        </CardHeader>
      </Card>

      {/* File Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Dosya Yükleme
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              disabled={uploadMutation.isPending}
              className="flex items-center gap-2"
              aria-label="Tasarım dosyası yükle"
            >
              <Upload className="w-4 h-4" />
              {uploadMutation.isPending ? 'Yükleniyor...' : 'Dosya Seç'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => clearMutation.mutate()}
              disabled={clearMutation.isPending || !designs.length}
              className="flex items-center gap-2"
              aria-label="Tüm tasarımları temizle"
            >
              <Trash2 className="w-4 h-4" />
              Temizle
            </Button>
          </div>

          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.svg,.eps,.ai"
            onChange={handleFileUpload}
            className="hidden"
            aria-describedby="file-help"
          />
          
          <p id="file-help" className="text-xs text-gray-500">
            PDF, SVG, EPS formatları desteklenir. Maksimum dosya boyutu: 50MB
          </p>

          {uploadMutation.isPending && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center">Yükleniyor... %{Math.round(uploadProgress)}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Designs List */}
      <Card>
        <CardHeader>
          <CardTitle>Yüklenen Tasarımlar ({designs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {designsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Tasarımlar yükleniyor...</p>
            </div>
          ) : designs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Henüz tasarım yüklenmemiş</p>
            </div>
          ) : (
            <div className="space-y-2" role="list" aria-label="Yüklenen tasarımlar">
              {designs.map(renderDesignPreview)}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto Arrange Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5" />
            Otomatik Dizim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => autoArrangeMutation.mutate()}
            disabled={autoArrangeMutation.isPending || designs.length === 0 || isProcessing}
            className="w-full flex items-center justify-center gap-2"
            size="lg"
          >
            <Play className="w-4 h-4" />
            {isProcessing ? 'Dizim Yapılıyor...' : 'Otomatik Dizim Başlat'}
          </Button>
          
          {autoArrangeMutation.isPending && (
            <div className="mt-4 text-center">
              <div className="animate-pulse text-sm text-gray-600">
                Tasarımlar analiz ediliyor ve diziliyor...
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arrangement Visualization */}
      {renderArrangementVisualization()}

      {/* PDF Generation Status */}
      {generatePdfMutation.isPending && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">PDF oluşturuluyor...</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}