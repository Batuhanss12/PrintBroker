
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

export default function AutomationPanelNew() {
  const { toast } = useToast();
  const [arrangements, setArrangements] = useState<ArrangementResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

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

  // Enhanced auto-arrange mutation
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
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {designs.map((design: Design) => (
                      <div key={design.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm font-medium truncate flex-1 mr-2">{design.filename}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {design.realDimensionsMM || design.dimensions || 'N/A'}
                          </Badge>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    ))}
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
