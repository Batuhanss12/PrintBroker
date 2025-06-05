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
  Clock,
  Brain,
  Loader2
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

interface ArrangementResult {
  arrangements: Arrangement[];
  totalArranged: number;
  totalRequested: number;
  efficiency: string;
  pdfPath?: string;
  statistics?: {
    arrangedDesigns: number;
    rotatedItems: number;
    wastePercentage: number;
  };
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
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [plotterSettings, setPlotterSettings] = useState({
    pageSize: 'A4',
    orientation: 'portrait',
    marginMM: 5,
    spacingX: 3,
    spacingY: 3,
    maxCopies: 1,
    enableRotation: true,
    autoOptimize: true
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
    // Upload state management
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState<string>('');

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

  // Enhanced error handler
  const handleError = useCallback((error: unknown, fallbackMessage: string): void => {
    console.error('Operation failed:', error);
    let errorMessage = fallbackMessage;
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
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
      console.log('🚀 Starting file upload...');
      setUploadProgress(10);

      try {
        setUploadProgress(25);

        const response = await fetch('/api/automation/plotter/upload-designs', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        setUploadProgress(75);

        if (!response.ok) {
          const errorText = await response.text();
          let errorMessage = 'Dosya yükleme başarısız';

          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }

          throw new Error(errorMessage);
        }

        const result = await response.json();
        setUploadProgress(100);

        console.log('✅ Upload successful:', result);

        // Reset progress after delay
        setTimeout(() => setUploadProgress(0), 2000);

        // Handle single design response
        if (result && result.design) {
          return { designs: [result.design] };
        }

        // Handle legacy array response
        if (result && Array.isArray(result)) {
          return { designs: result };
        }

        // Handle error case
        return { designs: [] };
      } catch (error) {
        setUploadProgress(0);
        console.error('❌ Upload error:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log('📦 Upload mutation success:', data);
      if (data && data.designs && Array.isArray(data.designs) && data.designs.length > 0) {
        const newDesignIds = data.designs.map(d => d.id);
        setSelectedDesigns(prev => [...prev, ...newDesignIds]);
        toast({
          title: "✅ Yükleme Başarılı",
          description: `${data.designs.length} dosya başarıyla yüklendi ve analiz edildi.`,
        });
      } else {
        toast({
          title: "⚠️ Yükleme Tamamlandı",
          description: "Dosyalar yüklendi ancak analiz edilemedi.",
          variant: "default",
        });
      }
      queryClient.invalidateQueries({ queryKey: ['/api/automation/plotter/designs'] });
    },
    onError: (error: any) => {
      console.error('❌ Upload mutation error:', error);
      const errorMessage = error?.message || error?.toString() || "Dosya yükleme başarısız";
      toast({
        title: "❌ Yükleme Hatası",
        description: errorMessage,
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

  // One-click layout mutation
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

      toast({
        title: "Tek Tuş Dizim Tamamlandı",
        description: `${data.totalArranged}/${data.totalRequested} tasarım profesyonel olarak dizildi (${data.efficiency} verimlilik)`,
      });

      if (data.pdfPath) {
        console.log('✅ PDF otomatik oluşturuldu, indiriliyor...');
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

  // File upload mutation


  const uploadFile = async (file: File) => {
    try {
      setUploadStatus('uploading');
      setUploadMessage('Dosya yükleniyor...');

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze-design', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success && result.design) {
        setDesigns(prev => [...prev, result.design]);
        setUploadStatus('success');
        setUploadMessage(`${file.name} başarıyla yüklendi`);
      } else {
        throw new Error(result.message || 'Analiz başarısız');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Dosya yükleme hatası');
      console.error('Upload error:', error);
    }
  };

  // Event handlers
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      console.warn('No files selected');
      return;
    }

    console.log('📁 Files selected:', files.length);

    const file = files[0]; // Upload one file at a time
    console.log(`📄 Validating file: ${file.name} (${file.type}, ${file.size} bytes)`);

    // Enhanced file validation
    const allowedExtensions = ['pdf', 'svg', 'ai', 'eps', 'jpg', 'jpeg', 'png'];
    const allowedMimeTypes = [
      'application/pdf',
      'image/svg+xml', 
      'application/postscript',
      'application/illustrator',
      'image/jpeg',
      'image/png',
      'image/eps',
      'application/eps'
    ];

    const fileExtension = file.name.toLowerCase().split('.').pop() || '';
    const maxSize = 50 * 1024 * 1024; // 50MB

    // Check file extension and mime type
    if (!allowedExtensions.includes(fileExtension) && !allowedMimeTypes.includes(file.type)) {
      toast({
        title: "🚫 Desteklenmeyen Dosya Türü",
        description: `${file.name}: Sadece PDF, SVG, AI, EPS, JPG, PNG dosyaları yükleyebilirsiniz.`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    // Check file size
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      toast({
        title: "📏 Dosya Çok Büyük",
        description: `${file.name}: ${sizeMB}MB boyutunda. Maksimum 50MB yükleyebilirsiniz.`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    // Check if file is empty
    if (file.size === 0) {
      toast({
        title: "📄 Boş Dosya",
        description: `${file.name}: Dosya içeriği boş görünüyor.`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    // Additional validation for PDF files
    if (fileExtension === 'pdf' && file.size < 1024) {
      toast({
        title: "⚠️ PDF Uyarısı", 
        description: `${file.name}: PDF dosyası çok küçük, içeriği kontrol edin.`,
        variant: "destructive",
      });
      event.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('designs', file);
      console.log(`✅ File validated and prepared: ${file.name} (${fileExtension.toUpperCase()})`);

      // Show immediate feedback
      toast({
        title: "📤 Yükleme Başlıyor",
        description: `${file.name} analiz edilmek üzere yükleniyor...`,
      });

      uploadDesignsMutation.mutate(formData);
    } catch (error) {
      console.error('❌ Error preparing upload:', error);
      toast({
        title: "❌ Hazırlık Hatası",
        description: "Dosya yükleme için hazırlanamadı. Lütfen tekrar deneyin.",
        variant: "destructive",
      });
    }

    // Clear the input
    event.target.value = '';
  }, [uploadDesignsMutation, toast]);

  const toggleDesignSelection = (designId: string) => {
    setSelectedDesigns(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    );
  };

  const selectAllDesigns = () => {
    if (selectedDesigns.length === designs.length) {
      setSelectedDesigns([]);
    } else {
      setSelectedDesigns(designs.map((d: Design) => d.id));
    }
  };

  // Auto-select all designs when they load
  useEffect(() => {
    if (designs && designs.length > 0) {
      setSelectedDesigns(designs.map((d: Design) => d.id));
    }
  }, [designs]);

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
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {validDesigns.map((design: Design) => {
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

  const [isProcessing, setIsProcessing] = useState(false);
  const [layoutResult, setLayoutResult] = useState<any>(null);

  const handleAIAutoLayout = async () => {
    if (selectedDesigns.length === 0) {
      toast({
        title: "⚠️ Uyarı",
        description: "Lütfen en az bir tasarım seçin.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setLayoutResult(null);

    try {
      console.log('🤖 AI akıllı dizim başlatılıyor...');

      const response = await apiRequest('POST', '/api/automation/plotter/auto-arrange', {
        designIds: selectedDesigns,
        plotterSettings: plotterSettingsState
      });

      if (response && response.arrangements) {
        console.log('🤖 AI akıllı dizim tamamlandı:', response);

        setArrangements(response.arrangements);
        setLayoutResult({
          ...response,
          efficiency: response.efficiency
        });

        toast({
          title: "🤖 Dizim Tamamlandı",
          description: `${response.totalArranged}/${selectedDesigns.length} tasarım yerleştirildi. Verimlilik: ${response.efficiency}%`,
        });

        // Auto-generate PDF after successful arrangement
        setTimeout(() => {
          generatePDFMutation.mutate();
        }, 1500);
      } else {
        throw new Error("Geçersiz API yanıtı");
      }
    } catch (error) {
      console.error('AI dizim hatası:', error);
      toast({
        title: "Hata",
        description: error instanceof Error ? error.message : "AI dizim işlemi başarısız oldu",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOneClickLayout = async () => {
    if (selectedDesigns.length === 0) {
      toast({
        title: "⚠️ Uyarı",
        description: "Lütfen en az bir tasarım seçin.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setLayoutResult(null);

    try {
      console.log('🎯 Tek tuş dizim başlatılıyor...');

      const response = await apiRequest('POST', '/api/automation/plotter/one-click-layout', {
        designIds: selectedDesigns,
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

      if (response && response.success) {
        console.log('🎯 Tek tuş dizim tamamlandı:', response);
        setArrangements(response.arrangements);
        setLayoutResult(response);

        toast({
          title: "🎯 Tek Tuş Dizim Tamamlandı",
          description: response.message || `${response.arrangements.length} tasarım profesyonel olarak dizildi`,
        });

        // Auto-generate PDF
        if (response.arrangements && response.arrangements.length > 0) {
          setTimeout(() => {
            generatePDFMutation.mutate();
          }, 1500);
        }
      } else {
        throw new Error(response?.message || "Tek tuş dizim başarısız");
      }
    } catch (error) {
      console.error('Tek tuş dizim hatası:', error);
      toast({        title: "Hata",
        description: error instanceof Error ? error.message : "Dizim işlemi başarısız oldu",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (files: FileList) => {
    if (!files || files.length === 0) return;

    setIsGenerating(true);
    const newDesigns: any[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/svg+xml', 'application/postscript', 'image/jpeg', 'image/png'];
        const allowedExtensions = ['pdf', 'svg', 'ai', 'eps', 'jpg', 'jpeg', 'png'];
        const fileExt = file.name.toLowerCase().split('.').pop();

        if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExt || '')) {
          toast({
            title: "Dosya Türü Hatası",
            description: `${file.name} - Sadece PDF, SVG, AI, EPS, JPG, PNG dosyaları kabul edilir`,
            variant: "destructive",
          });
          continue;
        }

        const formData = new FormData();
        formData.append('designs', file);

        console.log(`📤 Uploading file: ${file.name}, type: ${file.type}, size: ${file.size}`);

        const response = await fetch('/api/automation/plotter/upload-designs', {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });

        const result = await response.json();
        console.log(`📥 Upload response for ${file.name}:`, result);

        if (response.ok && result.success && result.design) {
          newDesigns.push({
            ...result.design,
            id: result.design.id || `design_${Date.now()}_${i}`,
            selected: false
          });
        } else {
          console.error(`❌ Failed to upload ${file.name}:`, result.message);
          toast({
            title: "Yükleme Hatası",
            description: `${file.name}: ${result.message || 'Yükleme başarısız'}`,
            variant: "destructive",
          });
        }
      }

      if (newDesigns.length > 0) {
        setDesigns(prev => [...prev, ...newDesigns]);

        toast({
          title: "Dosyalar Yüklendi",
          description: `${newDesigns.length} dosya başarıyla yüklendi ve analiz edildi`,
        });

        // Auto-select uploaded designs
        setTimeout(() => {
          const newDesignIds = newDesigns.map(d => d.id);
          setSelectedDesigns(prev => [...prev, ...newDesignIds]);
        }, 500);
      }
    } catch (error) {
      console.error('❌ Upload system error:', error);
      toast({
        title: "Sistem Hatası",
        description: "Dosya yükleme sistemi hatası",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const [isUploading, setIsUploading] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [activeStep, setActiveStep] = useState(1);

  const handleGenerateLayout = async () => {
    if (selectedDesigns.length === 0) {
      toast({
        title: "Tasarım Seçiniz",
        description: "Lütfen en az bir tasarım seçin",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      console.log('🚀 Starting layout generation with:', {
        selectedDesigns: selectedDesigns.length,
        plotterSettings
      });

      // Progress simulation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 8, 85));
      }, 300);

      // Try FastAPI microservice first, then fallback to Node.js
      let response;
      let usedService = 'fastapi';

      try {
        // Check FastAPI service health
        const healthCheck = await fetch('/api/python/status', {
          method: 'GET',
          credentials: 'include',
        });

        if (healthCheck.ok) {
          // Use FastAPI microservice
          response = await fetch('/api/python/arrange-designs', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              designs: selectedDesigns.map(id => {
                const design = designs.find(d => d.id === id);
                return {
                  id: design?.id || id,
                  filename: design?.name || design?.originalName || `Design_${id}`,
                  width_mm: design?.dimensions ? 
                    parseFloat(design.dimensions.split('x')[0]) || 50 : 50,
                  height_mm: design?.dimensions ? 
                    parseFloat(design.dimensions.split('x')[1]) || 30 : 30,
                  copies: 1
                };
              }),
              page_size: "A3",
              orientation: plotterSettings.sheetWidth > plotterSettings.sheetHeight ? "landscape" : "portrait",
              margin_mm: plotterSettings.marginMM || 10,
              spacing_x_mm: plotterSettings.spacingX || 5,
              spacing_y_mm: plotterSettings.spacingY || 5,
              enable_rotation: true
            }),
          });
        } else {
          throw new Error('FastAPI service not available');
        }
      } catch (fastApiError) {
        console.log('⚡ FastAPI not available, using Node.js service');
        usedService = 'nodejs';

        // Fallback to Node.js service
        response = await fetch('/api/generate-layout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            designIds: selectedDesigns,
            plotterSettings: {
              sheetWidth: plotterSettings.sheetWidth,
              sheetHeight: plotterSettings.sheetHeight,
              margin: plotterSettings.marginMM,
              bleedMargin: 3,
              spacing: plotterSettings.spacingX
            }
          }),
        });
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!response?.ok) {
        const errorResult = await response?.json();
        throw new Error(errorResult?.message || `HTTP ${response?.status}: Service unavailable`);
      }

      const result = await response.json();
      console.log(`✅ Layout generation successful using ${usedService}:`, result);

      if (result.success) {
        // Handle different response formats
        const arrangements = result.arrangements || result.arrangement?.items || [];
        const statistics = result.statistics || result.arrangement?.statistics || {
          efficiency_percentage: 0,
          total_items: arrangements.length
        };

        setArrangements(arrangements);
        setLayoutResult({
          ...result,
          arrangements,
          statistics,
          service: usedService
        });
        setActiveStep(3);

        toast({
          title: "Dizilim Oluşturuldu",
          description: `${arrangements.length} tasarım yerleştirildi (${usedService} servisi)`,
        });
      } else {
        throw new Error(result.message || 'Layout generation failed');
      }
    } catch (error) {
      console.error('❌ Layout generation error:', error);
      toast({
        title: "Dizilim Hatası",
        description: error instanceof Error ? error.message : "Dizilim oluşturulamadı",
        variant: "destructive",
      });
      setLayoutResult(null);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-3 flex items-center gap-3">
          <Layout className="h-10 w-10 text-blue-600" />
          🚀 MatBixx Profesyonel Otomatik Dizilim Sistemi
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Vektörel dosyalarınızı yükleyin, AI destekli akıllı algoritma ile otomatik yerleştirin ve profesyonel PDF çıktısı alın
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
            <Brain className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-blue-800">AI Destekli Analiz</div>
            <div className="text-xs text-blue-600">Dosya içeriği otomatik analiz</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
            <Target className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-purple-800">Akıllı Yerleştirme</div>
            <div className="text-xs text-purple-600">Maksimum verimlilik algoritması</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <Sparkles className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-green-800">Tek Tuş Dizim</div>
            <div className="text-xs text-green-600">Tam otomatik süreç</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
            <FileText className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-sm font-medium text-orange-800">Profesyonel PDF</div>
            <div className="text-xs text-orange-600">Yüksek kalite çıktı</div>
          </div>
        </div>
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
              
              
              
              
                Vektörel Dosyalarınızı Yükleyin
              
              
                PDF, SVG, AI, EPS, JPG, PNG formatları desteklenir. Dosya içeriği analiz edilir ve korunur.
              
              
              
              
                
                  {uploadProgress > 0 && uploadProgress < 100 ? (
                    
                      🔄 Analiz Ediliyor...
                    
                  ) : uploadProgress === 100 ? (
                    
                      ✅ Yüklendi!
                    
                  ) : (
                    
                      📁 Dosya Seç ve Yükle
                    
                  )}
                
                {uploadProgress > 0 && uploadProgress < 100 && (
                  
                    
                      
                        {uploadProgress < 25
                           ? '🔄 Dosya yükleniyor...' :
                           uploadProgress < 75 ? '🔍 İçerik analiz ediliyor...' :
                           '✨ Son işlemler tamamlanıyor...'}
                      
                      {uploadProgress.toFixed(0)}%
                    
                  
                )}

                {uploadProgress === 100 && (
                  
                    
                      ✅ Dosya başarıyla yüklendi ve analiz edildi!
                    
                  
                )}

                {uploadDesignsMutation.isError && (
                  
                    
                      
                        Yükleme Başarısız
                      
                      
                        Dosya formatını kontrol edin ve tekrar deneyin. Desteklenen formatlar: PDF, SVG, AI, EPS, JPG, PNG
                      
                    
                  
                )}
              
              
                
                  ✅ Maksimum dosya boyutu: 50MB
                  ✅ İçerik analizi ve boyut tespiti
                
                
                  ✅ Otomatik önizleme oluşturma
                  ✅ Vektör kalitesi korunur
                
              
            </CardContent>
          </Card>

          {/* Otomatik Dizim Sistemi - Dosya yükleme altında */}
          {designs.length > 0 && (
            <Card className="border-2 border-gradient-to-r from-purple-500 to-blue-600 bg-gradient-to-r from-purple-50 to-blue-50">
              <CardHeader>
                
                  🚀 Tek Tuş Otomatik Dizim Sistemi
                
                
                  Yapay zeka destekli tam otomatik dizim: dosya analizi + yerleştirme + PDF üretimi
                
              </CardHeader>
              <CardContent>
                
                
                  {isProcessing ? (
                    
                      🤖 AI analiz ediyor ve diziyor...
                    
                  ) : (
                    
                      🚀 Tek Tuş Otomatik Dizim ({selectedDesigns.length} dosya)
                    
                  )}
                
                
                  Bu sistem otomatik olarak:
                
                
                  • Dosya içeriğini analiz eder ve boyutları tespit eder
                  • 3mm kesim payı ile optimal yerleştirme yapar
                  • Profesyonel PDF çıktısını otomatik oluşturur
                  • Maksimum verimlilik için rotation algoritması kullanır
                
                
                {arrangements.length > 0 && (
                  
                    
                      
                        
                          {arrangements.length} Yerleştirilen
                        
                      
                      
                        
                          {selectedDesigns.length} Seçilen
                        
                      
                      
                        
                          {arrangements.length > 0 ? Math.round((arrangements.length / selectedDesigns.length) * 100) : 0}% Başarı
                        
                      
                    
                    
                      {generatePDFMutation.isPending ? "📄 Profesyonel PDF Oluşturuluyor..." : "📥 Profesyonel PDF İndir"}
                    
                  
                )}
              
            </CardContent>
          )}

          {/* Design Management */}
          
            
              
                
                  Tasarım Dosyaları ({designs.length})
                
              
              
                
                  {selectedDesigns.length === designs.length ? "❌ Hiçbirini Seçme" : "✅ Tümünü Seç"}
                
              
            
            
              {designsError ? (
                
                  Tasarım dosyaları yüklenirken hata oluştu. Lütfen sayfayı yenileyin.
                
              ) : (
                <>
                  {selectedDesigns.length > 0 && (
                    
                      
                        {selectedDesigns.length} tasarım seçildi ve dizilim için hazır
                      
                    
                  )}
                </>
              )}
            
          
        </div>

        {/* Settings Panel */}
        
          
            
              
                Plotter Ayarları
              
            
            
              
                
                  Sayfa Genişlik (mm)
                
                
                
              
              
                
                  Sayfa Yükseklik (mm)
                
                
                
              
            
            
              
                
                  Üst Margin (mm)
                
                
                
              
              
                
                  Alt Margin (mm)
                
                
                
              
            
            
              
                
                  Yatay Aralık (mm)
                
                
                
              
              
                
                  Dikey Aralık (mm)
                
                
                
              
            
          
        

        {/* System Status */}
        
          
            
              Sistem Durumu
            
            
              
                
                  Dosya Analizi:
                
                
                  ✅ Aktif
                
              
              
                
                  PDF Üretimi:
                
                
                  ✅ Hazır
                
              
              
                
                  Yüklenen Dosya:
                
                
                  {designs.length}
                
              
              
                
                  Seçili Dosya:
                
                
                  {selectedDesigns.length}
                
              
              {arrangements.length > 0 && (
                
                  
                    Yerleştirilen:
                  
                  
                    {arrangements.length}
                  
                
              )}
            
          
        
      </div>
    </div>
  );
}