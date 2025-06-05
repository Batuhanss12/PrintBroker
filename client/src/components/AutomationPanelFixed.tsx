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
import AnalysisResultsDisplay from './AnalysisResultsDisplay';

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
  status: 'uploading' | 'processing' | 'ready' | 'error' | 'warning';
  processingNotes?: string;
  smartDimensions?: {
    width: number;
    height: number;
    category: string;
    confidence: number;
  };
  professionallyAnalyzed?: boolean;
}

interface ArrangementItem {
  designId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  designName: string;
}

interface PlotterSettings {
  sheetWidth: number;
  sheetHeight: number;
  margin: number;
  spacing: number;
  bleedMargin: number;
}

export default function AutomationPanelFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedDesigns, setSelectedDesigns] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [plotterSettings, setPlotterSettings] = useState<PlotterSettings>({
    sheetWidth: 330,
    sheetHeight: 480,
    margin: 10,
    spacing: 5,
    bleedMargin: 3
  });

  // Fetch uploaded designs
  const { data: designs = [], isLoading: designsLoading, error: designsError } = useQuery({
    queryKey: ['/api/designs']
  });

  // Enhanced analysis mutation
  const enhancedAnalysisMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze-design', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Enhanced analysis failed');
      }

      return response.json();
    },
    onSuccess: (data, file) => {
      setAnalysisResults(prev => [...prev, { file: file.name, ...data }]);
      setShowAnalysisResults(true);
      toast({
        title: "Analysis Complete",
        description: `${file.name} has been analyzed successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/designs'] });
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : 'Analysis failed',
        variant: "destructive"
      });
    }
  });

  // Upload designs mutation
  const uploadDesignsMutation = useMutation({
    mutationFn: async (files: FileList) => {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload-designs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/designs'] });
      setUploadProgress(0);
      toast({
        title: "Yükleme başarılı",
        description: "Dosyalar analiz edildi ve sisteme yüklendi",
        variant: "default",
      });
    },
    onError: (error) => {
      setUploadProgress(0);
      toast({
        title: "Yükleme hatası",
        description: `Dosya yükleme başarısız: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Fixed automatic layout generation mutation
  const oneClickLayoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/generate-layout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designIds: selectedDesigns,
          plotterSettings
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Layout generation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        if (data.pdfPath) {
          window.open(`/api/download/${data.pdfPath}`, '_blank');
        }
        toast({
          title: "Otomatik dizim tamamlandı",
          description: `${data.statistics?.arrangedDesigns || 0} tasarım yerleştirildi, verimlilik: ${data.efficiency}%`,
          variant: "default",
        });
      } else {
        toast({
          title: "Dizim uyarısı",
          description: data.message || "Tasarımlar yerleştirilemedi",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Dizim hatası",
        description: `Otomatik dizim başarısız: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploadProgress(10);
      uploadDesignsMutation.mutate(files);
    }
  }, [uploadDesignsMutation]);

  const handleEnhancedAnalysis = useCallback((file: File) => {
    enhancedAnalysisMutation.mutate(file);
  }, [enhancedAnalysisMutation]);

  const handleManualDimensions = useCallback(async (dimensions: { widthMM: number; heightMM: number; userNote?: string }) => {
    try {
      const response = await fetch('/api/apply-manual-dimensions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysisResult: analysisResults[analysisResults.length - 1]?.analysis,
          manualDimensions: dimensions
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResults(prev => 
          prev.map((item, index) => 
            index === prev.length - 1 ? { ...item, analysis: result.analysis } : item
          )
        );
        toast({
          title: "Manual Dimensions Applied",
          description: `Dimensions updated to ${dimensions.widthMM}x${dimensions.heightMM}mm`,
        });
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to apply manual dimensions",
        variant: "destructive"
      });
    }
  }, [analysisResults, toast]);

  const handleRetryAnalysis = useCallback(async (method: string) => {
    const lastResult = analysisResults[analysisResults.length - 1];
    if (!lastResult) return;

    try {
      const response = await fetch('/api/retry-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filePath: lastResult.analysis?.filePath,
          fileName: lastResult.file,
          mimeType: lastResult.analysis?.mimeType || 'application/pdf',
          method
        })
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysisResults(prev => 
          prev.map((item, index) => 
            index === prev.length - 1 ? { ...item, analysis: result.analysis } : item
          )
        );
        toast({
          title: "Alternative Analysis Complete",
          description: `Analysis retried with ${method} method`,
        });
      }
    } catch (error) {
      toast({
        title: "Retry Failed",
        description: "Alternative analysis method failed",
        variant: "destructive"
      });
    }
  }, [analysisResults, toast]);

  const handleDesignSelect = (designId: string) => {
    setSelectedDesigns(prev => 
      prev.includes(designId) 
        ? prev.filter(id => id !== designId)
        : [...prev, designId]
    );
  };

  const handleSelectAll = () => {
    const readyDesigns = designs.filter((d: Design) => d.status === 'ready').map((d: Design) => d.id);
    setSelectedDesigns(readyDesigns);
  };

  const handleOneClickLayout = () => {
    if (selectedDesigns.length === 0) {
      toast({
        title: "Tasarım seçimi gerekli",
        description: "Lütfen en az bir tasarım seçin",
        variant: "destructive",
      });
      return;
    }
    oneClickLayoutMutation.mutate();
  };

  const getStatusBadge = (design: Design) => {
    switch (design.status) {
      case 'ready':
        return <Badge variant="default" className="bg-green-100 text-green-800">Hazır</Badge>;
      case 'processing':
        return <Badge variant="secondary">İşleniyor</Badge>;
      case 'error':
        return <Badge variant="destructive">Hata</Badge>;
      case 'warning':
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Uyarı</Badge>;
      default:
        return <Badge variant="secondary">Bilinmiyor</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Dosya Yükleme ve Analiz
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.svg,.ai,.eps"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadDesignsMutation.isPending}
              className="mb-4"
            >
              {uploadDesignsMutation.isPending ? "Analiz Ediliyor..." : "Dosya Seç ve Yükle"}
            </Button>

            {uploadProgress > 0 && (
              <div className="text-sm text-blue-600">
                Yükleniyor ve analiz ediliyor: {uploadProgress.toFixed(0)}%
              </div>
            )}

            <div className="text-sm text-gray-600 mt-2">
              <div>Maksimum dosya boyutu: 50MB</div>
              <div>İçerik analizi ve boyut tespiti</div>
              <div>Otomatik önizleme oluşturma</div>
              <div>Vektör kalitesi korunur</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Designs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileImage className="h-5 w-5" />
              Yüklenen Tasarımlar ({designs.length})
            </span>
            {designs.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Tümünü Seç
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {designsLoading ? (
            <div className="text-center py-4">
              <Loader2 className="h-6 w-6 animate-spin mx-auto" />
              <div>Tasarımlar yükleniyor...</div>
            </div>
          ) : designsError ? (
            <div className="text-red-600">Tasarım dosyaları yüklenirken hata oluştu. Lütfen sayfayı yenileyin.</div>
          ) : (
            <>
              {selectedDesigns.length > 0 && (
                <div className="text-green-600 mb-4">{selectedDesigns.length} tasarım seçildi ve dizilim için hazır</div>
              )}

              <div className="space-y-2">
                {designs.map((design: Design) => (
                  <div key={design.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedDesigns.includes(design.id)}
                        onChange={() => handleDesignSelect(design.id)}
                        disabled={design.status !== 'ready'}
                        className="rounded"
                      />
                      <div>
                        <div className="font-medium">{design.originalName}</div>
                        <div className="text-sm text-gray-600">
                          {design.smartDimensions ? 
                            `${design.smartDimensions.width}x${design.smartDimensions.height}mm (${design.smartDimensions.category})` :
                            design.realDimensionsMM
                          }
                        </div>
                        {design.professionallyAnalyzed && (
                          <div className="text-xs text-blue-600">Python analizi tamamlandı</div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(design)}
                      <div className="text-sm text-gray-500">{design.fileSize}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Plotter Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Baskı Ayarları
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sheetWidth">Sayfa Genişliği (mm)</Label>
              <Input
                id="sheetWidth"
                type="number"
                value={plotterSettings.sheetWidth}
                onChange={(e) => setPlotterSettings(prev => ({
                  ...prev,
                  sheetWidth: parseInt(e.target.value)
                }))}
              />
            </div>
            <div>
              <Label htmlFor="sheetHeight">Sayfa Yüksekliği (mm)</Label>
              <Input
                id="sheetHeight"
                type="number"
                value={plotterSettings.sheetHeight}
                onChange={(e) => setPlotterSettings(prev => ({
                  ...prev,
                  sheetHeight: parseInt(e.target.value)
                }))}
              />
            </div>
            <div>
              <Label htmlFor="margin">Kenar Boşluğu (mm)</Label>
              <Input
                id="margin"
                type="number"
                value={plotterSettings.margin}
                onChange={(e) => setPlotterSettings(prev => ({
                  ...prev,
                  margin: parseInt(e.target.value)
                }))}
              />
            </div>
            <div>
              <Label htmlFor="spacing">Tasarım Aralığı (mm)</Label>
              <Input
                id="spacing"
                type="number"
                value={plotterSettings.spacing}
                onChange={(e) => setPlotterSettings(prev => ({
                  ...prev,
                  spacing: parseInt(e.target.value)
                }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* One-Click Layout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Tek Tuş Otomatik Dizim
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleOneClickLayout}
            disabled={selectedDesigns.length === 0 || oneClickLayoutMutation.isPending}
            className="w-full"
            size="lg"
          >
            {oneClickLayoutMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Dizim oluşturuluyor...
              </>
            ) : (
              <>
                <Layout className="h-4 w-4 mr-2" />
                Otomatik Dizim Başlat ({selectedDesigns.length} tasarım)
              </>
            )}
          </Button>

          {selectedDesigns.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                {selectedDesigns.length} tasarım seçildi. Python tabanlı analiz sistemi ile optimal yerleşim hesaplanacak.
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Analysis Results Section */}
      {showAnalysisResults && analysisResults.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Gelişmiş PDF Analiz Sonuçları
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysisResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4">
                <h4 className="font-medium mb-3">{result.file}</h4>
                {result.analysis && (
                  <AnalysisResultsDisplay
                    result={result.analysis}
                    onManualDimensions={handleManualDimensions}
                    onRetryAnalysis={handleRetryAnalysis}
                    isLoading={enhancedAnalysisMutation.isPending}
                  />
                )}
              </div>
            ))}
            
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setShowAnalysisResults(false)}
              >
                Analiz Sonuçlarını Gizle
              </Button>
              <Button
                variant="outline"
                onClick={() => setAnalysisResults([])}
              >
                Sonuçları Temizle
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced File Upload with Analysis */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Gelişmiş PDF Analizi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              PDF dosyalarınızı yükleyerek MediaBox, TrimBox, ArtBox kontrolü ile çoklu analiz yöntemi uygulayın.
            </p>
            
            <Input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.svg,.ai,.eps"
              multiple
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  Array.from(files).forEach(file => {
                    handleEnhancedAnalysis(file);
                  });
                }
              }}
              className="cursor-pointer"
            />
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-green-50 rounded-lg">
                <h5 className="font-medium text-green-800">Desteklenen Özellikler:</h5>
                <ul className="mt-2 space-y-1 text-green-700">
                  <li>• PDF kutuları analizi (MediaBox, TrimBox, ArtBox)</li>
                  <li>• Vektörel içerik tespiti</li>
                  <li>• Otomatik boyut ölçekleme</li>
                  <li>• Manuel boyut girişi</li>
                </ul>
              </div>
              
              <div className="p-3 bg-blue-50 rounded-lg">
                <h5 className="font-medium text-blue-800">Analiz Yöntemleri:</h5>
                <ul className="mt-2 space-y-1 text-blue-700">
                  <li>• Python tabanlı gelişmiş analiz</li>
                  <li>• Görsel içerik analizi</li>
                  <li>• Kontur tespiti</li>
                  <li>• Alternatif yöntem desteği</li>
                </ul>
              </div>
            </div>
            
            {enhancedAnalysisMutation.isPending && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  Gelişmiş analiz işlemi devam ediyor...
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}