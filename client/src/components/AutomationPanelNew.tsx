import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Upload, 
  Settings, 
  FileImage, 
  Trash2, 
  Download, 
  Zap, 
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Maximize2,
  Info,
  Layout,
  Target,
  Sparkles,
  Clock
} from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface Design {
  id: string;
  name: string;
  originalName: string;
  filename: string;
  dimensions: string;
  realDimensionsMM: string;
  thumbnailPath?: string;
  filePath: string;
  fileType: string;
  mimeType: string;
  size: number;
  fileSize: string;
  uploadedAt: string;
  colorProfile?: string;
  hasTransparency?: boolean;
  resolution?: number;
  contentPreserved?: boolean;
  processingStatus?: 'pending' | 'success' | 'error';
  processingNotes?: string;
}

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

interface Arrangement {
  designId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  designName?: string;
  isFullPage?: boolean;
}

interface ArrangementResponse {
  arrangements: Arrangement[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  sheetDimensions: { width: number; height: number };
  wasteArea: number;
}

// Enhanced type definitions
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
  pdfPath?: string;
  aiRecommendations?: string[];
  statistics: {
    arrangedDesigns: number;
    rotatedItems: number;
    wastePercentage: number;
  }
}

interface FileUploadResponse {
  success: boolean;
  message: string;
  file?: Design;
}

export default function AutomationPanelNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [arrangements, setArrangements] = useState<Arrangement[]>([]);
  const [isArranging, setIsArranging] = useState(false);
  const [previewMode, setPreviewMode] = useState<'list' | 'grid'>('grid');
  const [plotterSettingsState, setPlotterSettings] = useState<PlotterSettings>({
    sheetWidth: 330,
    sheetHeight: 480,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 10,
    marginRight: 10,
    labelWidth: 50,
    labelHeight: 30,
    horizontalSpacing: 3,
    verticalSpacing: 3,
  });

  // API functions
  const apiRequest = async (method: string, url: string, data?: any) => {
    const options: RequestInit = {
      method,
      credentials: 'include',
      headers: {} as Record<string, string>,
    };

    if (data instanceof FormData) {
      options.body = data;
    } else if (data) {
      (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  };

  // File validation function
  const validateFile = (file: File): { isValid: boolean; error?: string } => {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const allowedTypes = [
      'application/pdf',
      'image/svg+xml',
      'application/postscript',
      'application/eps',
      'image/eps'
    ];

    const allowedExtensions = ['.pdf', '.svg', '.ai', '.eps'];
    const fileExtension = file.name.toLowerCase().split('.').pop();

    if (file.size > maxSize) {
      return { isValid: false, error: 'Dosya boyutu 50MB\'dan büyük olamaz' };
    }

    if (file.size === 0) {
      return { isValid: false, error: 'Dosya boş olamaz' };
    }

    const isValidType = allowedTypes.includes(file.type) || 
                       allowedExtensions.includes(`.${fileExtension}`);

    if (!isValidType) {
      return { isValid: false, error: 'Sadece vektörel dosyalar (PDF, SVG, AI, EPS) kabul edilir' };
    }

    return { isValid: true };
  };

  // Enhanced error handler
  const handleError = useCallback((error: unknown, fallbackMessage: string): void => {
    console.error('Operation failed:', error);

    let errorMessage = fallbackMessage;
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    toast({
      title: "Hata",
      description: errorMessage,
      variant: "destructive",
    });
  }, [toast]);

  // Fetch designs query
  const { data: designs = [], isLoading: designsLoading, error: designsError, refetch } = useQuery({
    queryKey: ['/api/automation/plotter/designs'],
    queryFn: () => apiRequest('GET', '/api/automation/plotter/designs'),
    staleTime: 30000,
    retry: 2,
  });

  // Upload designs mutation
  const uploadDesignsMutation = useMutation({
    mutationFn: async (formData: FormData): Promise<{ designs: Design[] }> => {
      setUploadProgress(0);

      // Progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 15, 90));
      }, 300);

      try {
        const result = await apiRequest('POST', '/api/automation/plotter/upload-designs', formData);
        clearInterval(progressInterval);
        setUploadProgress(100);

        setTimeout(() => setUploadProgress(0), 1500);
        return result;
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      }
    },
    onSuccess: (data) => {
      if (data.designs && data.designs.length > 0) {
        const newDesignIds = data.designs.map(d => d.id);
        setSelectedDesigns(prev => [...prev, ...newDesignIds]);

        toast({
          title: "✅ Yükleme Başarılı",
          description: `${data.designs.length} dosya başarıyla yüklendi ve analiz edildi.`,
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Yükleme Hatası",
        description: error.message || "Dosyalar yüklenemedi",
        variant: "destructive",
      });
    },
  });

  // Auto arrange mutation
  const autoArrangeMutation = useMutation({
    mutationFn: async ({ designIds, plotterSettings }: { designIds: string[]; plotterSettings: PlotterSettings }): Promise<ArrangementResponse> => {
      setIsArranging(true);
      return apiRequest('POST', '/api/automation/plotter/auto-arrange', { designIds, plotterSettings });
    },
    onSuccess: (data) => {
      setArrangements(data.arrangements);
      setIsArranging(false);
      toast({
        title: "🎯 Dizilim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım yerleştirildi. Verimlilik: ${data.efficiency}`,
      });

      // Auto-generate PDF after successful arrangement
      if (data.arrangements && data.arrangements.length > 0) {
        console.log('🔄 Auto-generating PDF after arrangement...');
        setTimeout(() => {
          generatePDFMutation.mutate();
        }, 1500);
      }
    },
    onError: (error: any) => {
      setIsArranging(false);
      toast({
        title: "❌ Dizilim Hatası",
        description: error.message || "Otomatik dizilim başarısız",
        variant: "destructive",
      });
    },
  });

  // Generate PDF mutation
  const generatePDFMutation = useMutation({
    mutationFn: async () => {
      console.log('🔄 Starting PDF generation...');

      const response = await fetch('/api/automation/plotter/generate-enhanced-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          plotterSettings: plotterSettingsState,
          arrangements,
          qualitySettings: {
            dpi: 300,
            colorProfile: 'CMYK',
            preserveVectorData: true
          },
          cuttingMarks: {
            enabled: true,
            length: 5,
            offset: 3,
            lineWidth: 0.25
          },
          bleedSettings: {
            top: 3,
            bottom: 3,
            left: 3,
            right: 3
          }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PDF generation failed:', errorText);
        throw new Error(`PDF oluşturulamadı: ${response.status}`);
      }

      console.log('✅ PDF response received, creating download...');

      // Get the blob
      const blob = await response.blob();
      console.log('📄 PDF blob size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('PDF dosyası boş');
      }

      // Create download
      const url = window.URL.createObjectURL(blob);
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
      const filename = `matbixx-layout-${timestamp}.pdf`;

      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;

      document.body.appendChild(a);
      console.log('🚀 Triggering download:', filename);
      a.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        console.log('🧹 Download cleanup completed');
      }, 1000);

      return { filename, size: blob.size };
    },
    onSuccess: (result: any) => {
      console.log('✅ PDF generation completed:', result);
      toast({
        title: "📄 PDF İndirildi",
        description: `Layout PDF'i başarıyla oluşturuldu: ${result?.filename || 'matbixx-layout.pdf'}`,
      });
    },
    onError: (error: any) => {
      console.error('❌ PDF generation error:', error);
      toast({
        title: "❌ PDF Hatası",
        description: error.message || "PDF oluşturulamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    },
  });

  // Clear designs mutation
  const clearDesignsMutation = useMutation({
    mutationFn: () => apiRequest('DELETE', '/api/automation/plotter/designs/clear'),
    onSuccess: () => {
      setSelectedDesigns([]);
      setArrangements([]);
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
      toast({
        title: "🗑️ Temizlendi",
        description: "Tüm tasarım dosyaları temizlendi.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "❌ Temizleme Hatası",
        description: error.message || "Dosyalar temizlenemedi",
        variant: "destructive",
      });
    },
  });

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (files: FileList): Promise<FileUploadResponse[]> => {
      const results: FileUploadResponse[] = [];
      setUploadProgress(0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // File validation
        if (file.size > 50 * 1024 * 1024) { // 50MB
          throw new Error(`${file.name} dosyası çok büyük (maksimum 50MB)`);
        }

        const formData = new FormData();
        formData.append('designs', file);

        try {
          const result = await apiRequest<FileUploadResponse>('POST', '/api/automation/plotter/upload-designs', formData);
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
        description: `${successCount} dosya başarıyla yüklendi ve analiz edildi.`,
      });
      queryClient.invalidateQueries({ queryKey: ['automation-designs'] });
      setUploadProgress(0);
    },
    onError: (error: unknown) => {
      handleError(error, "Dosya yükleme başarısız");
      setUploadProgress(0);
    },
  });

  // Tek tuş otomatik dizim mutation
  const [oneClickResult, setOneClickResult] = useState<ArrangementResult | null>(null);
  const oneClickLayoutMutation = useMutation({
    mutationFn: async (): Promise<ArrangementResult> => {
      if (!designs || designs.length === 0) {
        throw new Error("Dizim için en az bir tasarım gerekli");
      }

      setIsArranging(true);
      const designIds = designs.map((d: Design) => d.id);

      const result = await apiRequest('POST', '/api/automation/plotter/one-click-layout', {
        designIds,
        sheetSettings: {
          width: plotterSettingsState.sheetWidth,
          height: plotterSettingsState.sheetHeight,
          margin: plotterSettingsState.marginTop,
          bleedMargin: 3
        },
        cuttingSettings: {
          enabled: true,
          markLength: 5,
          markWidth: 0.25
        }
      });

      return result;
    },
    onSuccess: (data: ArrangementResult) => {
      console.log('🎯 Tek tuş dizim tamamlandı:', data);
      setArrangements(data.arrangements);
      setIsArranging(false);
      setOneClickResult(data);

      toast({
        title: "Tek Tuş Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım profesyonel olarak dizildi (${data.efficiency} verimlilik)`,
      });

      // PDF otomatik olarak oluşturuldu, indirme linkini göster
      if (data.pdfPath) {
        console.log('✅ PDF otomatik oluşturuldu, indiriliyor...');
        // PDF indirme işlemi
        const link = document.createElement('a');
        link.href = `/uploads/${data.pdfPath.split('/').pop()}`;
        link.download = `matbixx-tek-tus-dizim-${new Date().toISOString().split('T')[0]}.pdf`;
        link.click();

        toast({
          title: "PDF Hazır",
          description: "Profesyonel dizim PDF'i otomatik olarak indiriliyor...",
        });
      }
    },
    onError: (error: unknown) => {
      setIsArranging(false);
      handleError(error, "Tek tuş dizim başarısız");
    },
  });

  // Auto-arrange mutation (eski sistem)
  const autoArrangeMutationNew = useMutation({
    mutationFn: async (): Promise<ArrangementResult> => {
      if (!designs || designs.length === 0) {
        throw new Error("Dizim için en az bir tasarım gerekli");
      }

      setIsArranging(true);
      const designIds = designs.map((d: Design) => d.id);

      const result = await apiRequest('POST', '/api/automation/plotter/auto-arrange', {
        designIds,
        plotterSettings: plotterSettingsState
      });

      return result;
    },
    onSuccess: (data: ArrangementResult) => {
      console.log('Arrangement completed:', data);
      setArrangements(data.arrangements);
      setIsArranging(false);

      toast({
        title: "Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım dizildi (${data.efficiency} verimlilik)`,
      });

      // Auto-generate PDF
      if (data.arrangements && data.arrangements.length > 0) {
        setTimeout(() => {
          generatePDFMutation.mutate({ 
            plotterSettings: plotterSettingsState, 
            arrangements: data.arrangements
          });
        }, 1000);
      }
    },
    onError: (error: unknown) => {
      setIsArranging(false);
      handleError(error, "Otomatik dizim başarısız");
    },
  });

  // PDF generation mutation
    const generatePdfMutationNew = useMutation({
    mutationFn: async (data: { plotterSettings: PlotterSettings; arrangements: ArrangementItem[] }) => {
      //setIsPdfGenerating(true); //TODO: check isPdfGenerating
      return apiRequest('POST', '/api/automation/plotter/generate-pdf', data);
    },
    onSuccess: (response: { pdfUrl: string }) => {
      //setIsPdfGenerating(false);  //TODO: check isPdfGenerating
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
    onError: (error: unknown) => {
      //setIsPdfGenerating(false); //TODO: check isPdfGenerating
      handleError(error, "PDF oluşturma başarısız");
    },
  });

  // Event handlers
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Validate files
    const validFiles: File[] = [];
    const errors: string[] = [];

    Array.from(files).forEach(file => {
      const validation = validateFile(file);
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    });

    if (errors.length > 0) {
      toast({
        title: "⚠️ Dosya Doğrulama Hatası",
        description: errors.join(', '),
        variant: "destructive",
      });
    }

    if (validFiles.length > 0) {
      const formData = new FormData();
      validFiles.forEach(file => {
        formData.append('designs', file);
      });
      uploadDesignsMutation.mutate(formData);
    }

    // Reset input
    event.target.value = '';
  }, [uploadDesignsMutation, toast]);

  const toggleDesignSelection = (designId: string) => {
    setSelectedDesigns(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    );
  };

  const handleAutoArrange = () => {
    if (selectedDesigns.length === 0) {
      toast({
        title: "⚠️ Uyarı",
        description: "Lütfen en az bir tasarım seçin.",
        variant: "destructive",
      });
      return;
    }

    autoArrangeMutation.mutate({
      designIds: selectedDesigns,
      plotterSettings: plotterSettingsState
    });
  };

  const selectAllDesigns = () => {
    if (selectedDesigns.length === designs.length) {
      setSelectedDesigns([]);
    } else {
      setSelectedDesigns(designs.map((d: Design) => d.id));
    }
  };

  // Design List Component
  const DesignList = ({ designs }: { designs: Design[] }) => {
    if (!designs || designs.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <FileImage className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">Henüz tasarım dosyası yüklenmedi</h3>
          <p className="text-sm">PDF, SVG, AI, EPS formatlarında vektörel dosyalarınızı yükleyin</p>
        </div>
      );
    }

    // Ensure all designs have required properties
    const validDesigns = designs.filter(design => 
      design && 
      typeof design === 'object' && 
      design.id && 
      (design.name || design.originalName)
    );

    if (validDesigns.length === 0) {
      return (
        <div className="text-center py-8 text-orange-500">
          <AlertCircle className="h-12 w-12 mx-auto mb-4" />
          <p>Geçerli tasarım dosyası bulunamadı</p>
        </div>
      );
    }

    const parseDimensions = (dimensionStr: string | undefined): { width: number; height: number } => {
          if (!dimensionStr || typeof dimensionStr !== 'string') return { width: 100, height: 100 };

          const parts = dimensionStr.split('x');
          if (parts.length !== 2) return { width: 100, height: 100 };

          const width = parseFloat(parts[0]);
          const height = parseFloat(parts[1]);

          return { 
            width: isNaN(width) ? 100 : width, 
            height: isNaN(height) ? 100 : height 
          };
        };

    return (
      <div className={`grid gap-4 ${previewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
        {validDesigns.map((design: Design) => {
          // Extra safety check
          if (!design || !design.id || !design.name) {
            return null;
          }

          const displayName = design.originalName || design.name || 'Adsız Dosya';
          const safeDimensions = design.realDimensionsMM || design.dimensions || 'Boyut bilinmiyor';

          try {
            return (
              <div
                key={design.id}
                className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                  selectedDesigns.includes(design.id)
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => toggleDesignSelection(design.id)}
              >
                {/* Selection indicator */}
                {selectedDesigns.includes(design.id) && (
                  <div className="absolute top-3 right-3 z-10">
                    <CheckCircle className="h-6 w-6 text-blue-500 bg-white rounded-full shadow-sm" />
                  </div>
                )}

                {/* File preview */}
                <div className="aspect-square mb-3 bg-gray-50 rounded-lg border overflow-hidden">
                  {design.mimeType === 'application/pdf' ? (
                    <div className="w-full h-full flex items-center justify-center bg-red-50 relative">
                      <div className="text-center">
                        <div className="text-3xl mb-2">📄</div>
                        <span className="text-xs text-red-600 font-semibold">PDF VEKTÖR</span>
                      </div>
                      {safeDimensions && (
                        <div className="absolute bottom-0 left-0 right-0 text-xs bg-red-600 bg-opacity-90 text-white p-1 text-center font-medium">
                          {safeDimensions}
                        </div>
                      )}
                    </div>
                  ) : design.thumbnailPath ? (
                    <img
                      src={design.thumbnailPath}
                      alt={displayName}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'crisp-edges' }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-purple-50">
                      <div className="text-center">
                        <div className="text-2xl mb-2">🎨</div>
                        <span className="text-xs text-purple-600 font-medium">
                          {design.mimeType?.includes('svg') ? 'SVG' : 
                           design.mimeType?.includes('eps') ? 'EPS' : 'VEKTÖR'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm truncate" title={displayName}>
                    {displayName}
                  </h4>

                  <div className="text-xs text-gray-600 space-y-1">
                    <div className="flex justify-between items-center">
                      <span>Boyut:</span>
                      <Badge variant="outline" className="text-xs font-medium text-blue-600 border-blue-200">
                        {safeDimensions}
                      </Badge>
                    </div>

                    <div className="flex justify-between">
                      <span>Dosya:</span>
                      <span className="font-medium">{design.fileSize || 'Bilinmiyor'}</span>
                    </div>

                    {design.colorProfile && (
                      <div className="flex justify-between">
                        <span>Renk:</span>
                        <span className="font-medium">{design.colorProfile}</span>
                      </div>
                    )}

                    {design.processingStatus && (
                      <div className="flex justify-between items-center">
                        <span>Durum:</span>
                        <Badge 
                          variant={design.processingStatus === 'success' ? 'default' : 'destructive'} 
                          className="text-xs"
                        >
                          {design.processingStatus === 'success' ? '✅ Hazır' : '❌ Hata'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content preservation indicator */}
                {design.contentPreserved && (
                  <div className="absolute top-3 left-3">
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      ✅ İçerik Korundu
                    </Badge>
                  </div>
                )}
              </div>
            );
          } catch (error) {
            console.error('Error rendering design:', design.id, error);
            return (
              <div key={design.id} className="p-4 border-2 border-red-200 rounded-xl bg-red-50">
                <p className="text-red-600 text-sm">Tasarım yüklenirken hata oluştu</p>
                <p className="text-xs text-red-500">{displayName}</p>
              </div>
            );
          }
        })}
      </div>
    );
  };

    // Design preview component
    const DesignListNew = () => {
      if (designsLoading) {
        return (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Tasarımlar yükleniyor...</p>
          </div>
        );
      }

      if (!designs || designs.length === 0) {
        return (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Henüz tasarım yüklenmemiş</p>
            <p className="text-xs mt-1">PDF, SVG, EPS dosyalarınızı yükleyin</p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {designs.map((design: Design) => {
            const dimensions = design.realDimensionsMM || design.dimensions || 'Boyut analiz ediliyor...';
            const status = design.processingStatus || 'processed';

            return (
              <div 
                key={design.id} 
                className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <FileText className="w-10 h-10 text-blue-600" />
                    {status === 'processing' && (
                      <Clock className="w-4 h-4 text-yellow-600 absolute -top-1 -right-1" />
                    )}
                    {status === 'processed' && (
                      <CheckCircle className="w-4 h-4 text-green-600 absolute -top-1 -right-1" />
                    )}
                    {status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600 absolute -top-1 -right-1" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate max-w-[200px]" title={design.name}>
                      {design.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {dimensions}
                    </p>
                    {design.processingNotes && (
                      <p className="text-xs text-blue-600 mt-1">
                        {design.processingNotes}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {design.fileType || 'PDF'}
                  </Badge>
                  {design.fileSize && (
                    <Badge variant="outline" className="text-xs">
                      {design.fileSize}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      );
    };


  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center gap-3">
          <Layout className="h-10 w-10 text-blue-600" />
          Profesyonel Otomatik Dizilim Sistemi
        </h1>
        <p className="text-lg text-gray-600">
          Vektörel dosyalarınızı yükleyin, akıllı algoritma ile otomatik yerleştirin ve profesyonel PDF çıktısı alın
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* File Upload Section */}
          <Card className="border-2 border-dashed border-blue-200 bg-blue-50/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Upload className="h-6 w-6" />
                Profesyonel Dosya Yükleme Sistemi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors bg-white">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.svg,.ai,.eps,application/pdf,image/svg+xml,application/postscript"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <div className="mb-4">
                  <Upload className="h-16 w-16 text-blue-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Vektörel Dosyalarınızı Yükleyin
                  </h3>
                  <p className="text-gray-600 mb-6">
                    PDF, SVG, AI, EPS formatları desteklenir. Dosya içeriği analiz edilir ve korunur.
                  </p>
                </div>

                <Button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadDesignsMutation.isPending}
                  size="lg"
                  className="mb-6"
                >
                  {uploadDesignsMutation.isPending ? "🔄 Analiz Ediliyor..." : "📁 Dosya Seç ve Yükle"}
                </Button>

                {uploadProgress > 0 && (
                  <div className="mb-4">
                    <Progress value={uploadProgress} className="w-full h-3 mb-2" />
                    <p className="text-sm text-blue-600 font-medium">
                      📊 Yükleniyor ve analiz ediliyor: %{uploadProgress.toFixed(0)}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-500 border-t pt-4">
                  <div className="space-y-1">
                    <div>✅ Maksimum dosya boyutu: 50MB</div>
                    <div>✅ İçerik analizi ve boyut tespiti</div>
                  </div>
                  <div className="space-y-1">
                    <div>✅ Otomatik önizleme oluşturma</div>
                    <div>✅ Vektör kalitesi korunur</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileImage className="h-5 w-5" />
                  Tasarım Dosyaları ({designs.length})
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewMode(previewMode === 'grid' ? 'list' : 'grid')}
                  >
                    {previewMode === 'grid' ? <Eye className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={selectAllDesigns}
                    disabled={designs.length === 0}
                  >
                    {selectedDesigns.length === designs.length ? "❌ Hiçbirini Seçme" : "✅ Tümünü Seç"}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={designsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${designsLoading ? 'animate-spin' : ''}`} />
                  </Button>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => clearDesignsMutation.mutate()}
                    disabled={designs.length === 0 || clearDesignsMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {designsError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Tasarım dosyaları yüklenirken hata oluştu. Lütfen sayfayı yenileyin.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {selectedDesigns.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-blue-600" />
                        <p className="text-sm text-blue-800 font-medium">
                          {selectedDesigns.length} tasarım seçildi ve dizilim için hazır
                        </p>
                      </div>
                    </div>
                  )}

                  <DesignList designs={designs} />
                </>
              )}
            </CardContent>
          </Card>

          {/* Tek Tuş Otomatik Dizim - Premium Feature */}
          <Card className="border-2 border-gradient-to-r from-purple-500 to-blue-600 bg-gradient-to-r from-purple-50 to-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Sparkles className="h-6 w-6" />
                Tek Tuş Profesyonel Dizim Sistemi
              </CardTitle>
              <p className="text-sm text-purple-600 mt-2">
                Yapay zeka destekli tam otomatik dizim: dosya analizi + yerleştirme + PDF üretimi
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={() => oneClickLayoutMutation.mutate()}
                  disabled={selectedDesigns.length === 0 || isArranging}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg"
                  size="lg"
                >
                  {isArranging ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Profesyonel sistem çalışıyor...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Tek Tuş Otomatik Dizim
                    </>
                  )}
                </Button>

                <div className="text-xs text-purple-600 bg-purple-50 p-3 rounded-lg">
                  <div className="font-medium mb-1">Bu sistem otomatik olarak:</div>
                  <div className="space-y-1">
                    <div>• Dosya içeriğini analiz eder ve boyutları tespit eder</div>
                    <div>• 3mm kesim payı ile optimal yerleştirme yapar</div>
                    <div>• Profesyonel PDF çıktısını otomatik oluşturur</div>
                    <div>• Maksimum verimlilik için rotation algoritması kullanır</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Geleneksel Otomatik Dizim */}
          <Card className="border-2 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Zap className="h-6 w-6" />
                Geleneksel Otomatik Dizilim
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={handleAutoArrange}
                  disabled={selectedDesigns.length === 0 || isArranging}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isArranging ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Algoritma çalışıyor...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Manuel Ayarlı Dizilim
                    </>
                  )}
                </Button>

                {arrangements.length > 0 && (
                  <div className="space-y-4 border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm bg-green-50 p-3 rounded-lg">
                      <div>✅ Yerleştirilen: {arrangements.length}</div>
                      <div>📊 Seçilen: {selectedDesigns.length}</div>
                    </div>

                    <Button
                      onClick={() => generatePDFMutation.mutate()}
                      disabled={generatePDFMutation.isPending}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      size="lg"
                    >
                      <Download className="h-5 w-5 mr-2" />
                      {generatePDFMutation.isPending ? "📄 Profesyonel PDF Oluşturuluyor..." : "📥 Profesyonel PDF İndir"}
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Panel */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Plotter Ayarları
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sheetWidth" className="text-xs font-medium">Sayfa Genişlik (mm)</Label>
                  <Input
                    id="sheetWidth"
                    type="number"
                    value={plotterSettingsState.sheetWidth}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      sheetWidth: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="sheetHeight" className="text-xs font-medium">Sayfa Yükseklik (mm)</Label>
                  <Input
                    id="sheetHeight"
                    type="number"
                    value={plotterSettingsState.sheetHeight}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      sheetHeight: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="marginTop" className="text-xs font-medium">Üst Margin (mm)</Label>
                  <Input
                    id="marginTop"
                    type="number"
                    value={plotterSettingsState.marginTop}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      marginTop: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="marginBottom" className="text-xs font-medium">Alt Margin (mm)</Label>
                  <Input
                    id="marginBottom"
                    type="number"
                    value={plotterSettingsState.marginBottom}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      marginBottom: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="horizontalSpacing" className="text-xs font-medium">Yatay Aralık (mm)</Label>
                  <Input
                    id="horizontalSpacing"
                    type="number"
                    value={plotterSettingsState.horizontalSpacing}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      horizontalSpacing: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="verticalSpacing" className="text-xs font-medium">Dikey Aralık (mm)</Label>
                  <Input
                    id="verticalSpacing"
                    type="number"
                    value={plotterSettingsState.verticalSpacing}
                    onChange={(e) => setPlotterSettings(prev => ({
                      ...prev,
                      verticalSpacing: Number(e.target.value)
                    }))}
                    className="text-sm"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Sistem Durumu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span>📊 Dosya Analizi:</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    ✅ Aktif
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>🔒 İçerik Koruma:</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    ✅ Aktif
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>📄 PDF Üretimi:</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    ✅ Hazır
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>🤖 Akıllı Algoritma:</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    ✅ Optimized
                  </Badge>
                </div>
                <Separator />
                <div className="flex justify-between items-center font-medium">
                  <span>📁 Yüklenen Dosya:</span>
                  <span className="text-blue-600">{designs.length}</span>
                </div>
                <div className="flex justify-between items-center font-medium">
                  <span>🎯 Seçili Dosya:</span>
                  <span className="text-green-600">{selectedDesigns.length}</span>
                </div>
                {arrangements.length> 0 && (
                  <div className="flex justify-between items-center font-medium">
                    <span>✅ Yerleştirilen:</span>
                    <span className="text-purple-600">{arrangements.length}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}